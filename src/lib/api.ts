import { API_URL, CMS_URL } from './config'
import type { Availability, Community, EventItem, PublicOrder, Quote, SalesStatus, Tier } from './types'

export class ApiError extends Error {
  constructor(
    public code: string,
    public status = 0,
  ) {
    super(code)
  }
}

async function json<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new ApiError(data.error ?? 'error', res.status)
  return data
}

async function call<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch {
    throw new ApiError('network')
  }
  return json<T>(res)
}

// ---------------------------------------------------------------- events (CMS)

type Rec = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const rec = (v: unknown): Rec => (v && typeof v === 'object' ? (v as Rec) : {})

const abs = (u: string) => (u.startsWith('http') ? u : `${CMS_URL}${u}`)

function posterUrl(p: unknown): string | null {
  const o = rec(p)
  const sizes = rec(o.sizes)
  const url = str(rec(sizes.feature).url) || str(rec(sizes.card).url) || str(o.url)
  return url ? abs(url) : null
}

/** Sends the visitor's details to the website's admin (Inbox → App sign-ups). true = stored (or already known). */
export async function registerVisitor(v: { name: string; email: string; phone: string }): Promise<boolean> {
  try {
    const res = await fetch(`${CMS_URL}/api/app-registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: v.name, email: v.email, phone: v.phone, locale: 'en', consentAt: new Date().toISOString() }),
    })
    if (res.ok) return true
    // 400 = this email is already registered: nothing more to do.
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { errors?: { message?: string; data?: { errors?: { path?: string }[] } }[] }
      const dup = JSON.stringify(body).toLowerCase().includes('email')
      return dup
    }
    return false
  } catch {
    return false
  }
}

/** The app's background music: the track ticked "Play in the ticketing app" in the admin (null = none). */
export async function fetchMusicUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${CMS_URL}/api/music?where[playInApp][equals]=true&sort=-updatedAt&limit=1&depth=0`)
    if (!res.ok) return null
    const data = (await res.json()) as { docs?: Rec[] }
    const url = str(rec(data.docs?.[0]).url)
    return url ? abs(url) : null
  } catch {
    return null
  }
}

/** A past-event poster shown in the app as a showcase (not for booking). */
export type PastEvent = { id: string; thumb: string; full: string; caption: string }

/** Pictures ticked "Show in the app as a past event" in the website's Media library. */
export async function fetchPastEvents(): Promise<PastEvent[]> {
  const get = async (sort: string) => {
    const res = await fetch(`${CMS_URL}/api/media?where[showInApp][equals]=true&sort=${sort}&limit=40&depth=0&locale=en`)
    if (!res.ok) throw new Error('media')
    return (await res.json()) as { docs?: Rec[] }
  }
  try {
    let data: { docs?: Rec[] }
    try {
      data = await get('_order')
    } catch {
      data = await get('-createdAt')
    }
    const out: PastEvent[] = []
    for (const d of data.docs ?? []) {
      const sizes = rec(d.sizes)
      const base = str(d.url)
      const thumb = str(rec(sizes.card).url) || base
      const full = str(rec(sizes.feature).url) || base
      if (!thumb) continue
      out.push({ id: str(d.id), thumb: abs(thumb), full: abs(full || thumb), caption: str(d.caption) || str(d.alt) })
    }
    return out
  } catch {
    return []
  }
}

/** Payload stores descriptions as Lexical JSON; we only need readable paragraphs. */
function lexicalParagraphs(desc: unknown): string[] {
  const out: string[] = []
  const text = (n: Rec): string =>
    str(n.text) + (Array.isArray(n.children) ? (n.children as Rec[]).map(text).join('') : '')
  const root = rec(rec(desc).root)
  for (const block of (Array.isArray(root.children) ? root.children : []) as Rec[]) {
    if (Array.isArray(block.children) && block.type === 'list') {
      for (const li of block.children as Rec[]) {
        const t = text(li).trim()
        if (t) out.push(`• ${t}`)
      }
    } else {
      const t = text(block).trim()
      if (t) out.push(t)
    }
  }
  return out
}

const STATUSES: SalesStatus[] = ['announced', 'onSale', 'soldOut', 'cancelled']

export function normaliseEvent(d: Rec): EventItem {
  const venue = rec(d.venue)
  const loc = rec(d.location)
  const hasVenue = typeof d.venue === 'object' && d.venue !== null
  const tiers: Tier[] = (Array.isArray(d.tiers) ? (d.tiers as Rec[]) : []).map((t) => ({
    tierId: str(t.tierId),
    name: str(t.name),
    description: str(t.description),
    price: num(t.price) ?? 0,
    salesStart: str(t.salesStart) || null,
    salesEnd: str(t.salesEnd) || null,
  }))
  const status = STATUSES.includes(d.salesStatus as SalesStatus) ? (d.salesStatus as SalesStatus) : 'onSale'
  const placeName = str(loc.placeName)
  return {
    id: str(d.id),
    slug: str(d.slug),
    title: str(d.title),
    summary: str(d.summary),
    description: lexicalParagraphs(d.description),
    poster: posterUrl(d.appPoster) ?? posterUrl(d.poster),
    startsAt: str(d.startsAt) || null,
    endsAt: str(d.endsAt) || null,
    salesStatus: status,
    currency: str(d.currency) || 'SEK',
    maxPerOrder: num(d.maxPerOrder) ?? 10,
    reservedSeating: d.seating === 'reserved',
    tiers,
    lineup: (Array.isArray(d.lineup) ? (d.lineup as Rec[]) : []).map((l) => ({
      name: str(l.name),
      role: str(l.role),
    })),
    languages: Array.isArray(d.eventLanguage) ? (d.eventLanguage as unknown[]).map(str) : [],
    category: str(rec(d.category).title) || null,
    community: str(rec(d.community).slug) || null,
    organisation: str(rec(d.organisation).slug) || null,
    venue:
      hasVenue || placeName || str(loc.address)
        ? {
            name: placeName || str(venue.name),
            address: str(loc.address) || str(venue.address),
            city: str(venue.city),
            mapUrl: str(venue.mapUrl) || null,
            lat: num(loc.latitude) ?? num(venue.latitude),
            lng: num(loc.longitude) ?? num(venue.longitude),
          }
        : null,
  }
}

/** All published events, soonest first (events without a date go last). */
export async function fetchEvents(): Promise<EventItem[]> {
  let res: Response
  try {
    res = await fetch(
      `${CMS_URL}/api/events?depth=2&limit=100&locale=en&sort=startsAt&where[_status][equals]=published`,
    )
  } catch {
    throw new ApiError('network')
  }
  const data = await json<{ docs?: Rec[] }>(res)
  return (data.docs ?? [])
    .map(normaliseEvent)
    .filter((e) => e.id && e.slug && e.salesStatus !== 'cancelled')
    .sort((a, b) => {
      if (!a.startsAt) return 1
      if (!b.startsAt) return -1
      return a.startsAt.localeCompare(b.startsAt)
    })
}

// ---------------------------------------------------------------- booking API

export const fetchAvailability = (eventId: string) =>
  call<Availability>(`/events/${encodeURIComponent(eventId)}/availability?locale=en`)

export const fetchQuote = (body: {
  eventId: string
  items: { tierId: string; quantity: number }[]
  promoCode?: string
  services?: Partial<Record<'smsTickets' | 'refundProtection' | 'reminder', boolean>>
}) => call<Quote>('/quote', { method: 'POST', body: JSON.stringify({ ...body, locale: 'en' }) })

export const startCheckout = (body: {
  eventId: string
  name: string
  email: string
  items: { tierId: string; quantity: number }[]
  promoCode?: string
  paymentMethod?: 'card' | 'klarna' | 'swish'
  phone?: string
  country?: string
  postalCode?: string
  companyName?: string
  consent?: { marketing: boolean; promoter: boolean }
  services?: Partial<Record<'smsTickets' | 'refundProtection' | 'reminder', boolean>>
}) =>
  call<{ ref: string; url: string }>('/checkout', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      locale: 'en',
      acceptTerms: true,
      // Stripe sends the buyer back to this app (the API only honours origins it allows).
      webOrigin: window.location.origin,
    }),
  })

export const requestCode = (email: string) =>
  call<{ sent: boolean }>('/auth/code', { method: 'POST', body: JSON.stringify({ email, locale: 'en' }) })

export const verifyCode = (email: string, code: string) =>
  call<{ token: string; email: string }>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })

export const signOutRemote = (token: string) =>
  call<{ ok: boolean }>('/auth/signout', { method: 'POST', token }).catch(() => undefined)

export const myOrders = (token: string) =>
  call<{ email: string; orders: PublicOrder[] }>('/me/orders', { token })

/** One order including each ticket's QR code (as a data URL). */
export const fetchOrder = (ref: string, auth: { token?: string; t?: string }) =>
  call<PublicOrder>(`/orders/${encodeURIComponent(ref)}${auth.t ? `?t=${encodeURIComponent(auth.t)}` : ''}`, {
    token: auth.token,
  })

export const confirmOrder = (ref: string, t: string) =>
  call<{ status: string }>(`/orders/${encodeURIComponent(ref)}/confirm?t=${encodeURIComponent(t)}`, {
    method: 'POST',
  })

export const resendTickets = (ref: string, auth: { token?: string; t?: string }) =>
  call<{ sent: boolean }>(
    `/orders/${encodeURIComponent(ref)}/resend${auth.t ? `?t=${encodeURIComponent(auth.t)}` : ''}`,
    { method: 'POST', token: auth.token },
  )

/** Downloads the PDF with the visitor's credentials and hands it to the browser as a file. */
export async function downloadTicketsPdf(ref: string, auth: { token?: string; t?: string }) {
  const res = await fetch(
    `${API_URL}/orders/${encodeURIComponent(ref)}/tickets.pdf${auth.t ? `?t=${encodeURIComponent(auth.t)}` : ''}`,
    { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {} },
  )
  if (!res.ok) throw new ApiError('download_failed', res.status)
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = `tickets-${ref}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Plain-language text for the API's error codes. */
export function errorText(e: unknown): string {
  const code = e instanceof ApiError ? e.code : 'error'
  switch (code) {
    case 'sold_out':
    case 'tier_unavailable':
      return 'Sorry, these tickets are no longer available. Please choose another pass or fewer tickets.'
    case 'invalid_promo':
      return 'That promo code is not valid for this order.'
    case 'too_many':
      return 'That is more tickets than one order allows.'
    case 'not_on_sale':
    case 'sales_closed':
      return 'Tickets for this event are not on sale right now.'
    case 'payments_unavailable':
      return 'Online payment is temporarily unavailable. Please try again later.'
    case 'invalid_code':
      return 'That code is not correct or has expired. Request a new one.'
    case 'signed_out':
      return 'Your session has ended. Please sign in again.'
    case 'network':
      return 'Cannot reach the server. Check your connection and try again.'
    case 'seats_required':
    case 'seat_taken':
    case 'seat_unavailable':
      return 'This event uses reserved seats, which must be chosen on the website.'
    default:
      return 'Something went wrong. Please try again.'
  }
}


// ---------------------------------------------------------------- communities (CMS)

/** One community from the admin (Communities). null = hidden in the app. */
export function normaliseCommunity(d: Rec, kind: Community['kind'] = 'community'): (Community & { active: boolean }) | null {
  const slug = str(d.slug)
  const name = str(d.name)
  if (!slug || !name) return null
  const songs = (Array.isArray(d.songs) ? (d.songs as unknown[]) : [])
    .map((x) => str(rec(x).url))
    .filter(Boolean)
    .map(abs)
  const link = str(d.groupLink)
  return {
    kind,
    slug,
    name,
    script: str(d.script),
    tagline: '',
    description: str(d.description),
    cover: posterUrl(d.cover),
    songs,
    groupLink: /^https:\/\//.test(link) ? link : null,
    announcement: str(d.announcement).trim(),
    accent: d.accent === 'blue' ? 'blue' : 'gold',
    order: num(d.order) ?? 10,
    city: str(d.city),
    links: Object.fromEntries(
      (['website', 'youtube', 'instagram', 'facebook'] as const)
        .map((k) => [k, str(d[k])] as const)
        .filter(([, v]) => /^https:\/\//.test(v)),
    ),
    active: d.active !== false,
  }
}

export async function fetchCommunityRecords(collection: 'communities' | 'organisations' = 'communities'): Promise<Rec[]> {
  try {
    const res = await fetch(`${CMS_URL}/api/${collection}?limit=50&depth=2&sort=order`)
    if (!res.ok) return []
    const data = (await res.json()) as { docs?: Rec[] }
    return data.docs ?? []
  } catch {
    return []
  }
}

/** Tells the admin (Communities → Community members) that this visitor joined. Best effort: the app works without it. */
export async function postJoin(c: { slug: string; name: string; kind?: string }, v: { name: string; email: string }): Promise<void> {
  try {
    await fetch(`${CMS_URL}/api/community-joins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ community: c.name, communitySlug: c.slug, kind: c.kind ?? 'community', name: v.name, email: v.email }),
    })
  } catch {
    /* ignore */
  }
}

export type OrganisationForm = {
  name: string
  description: string
  city: string
  website: string
  youtube: string
  instagram: string
  facebook: string
  groupLink: string
  contactName: string
  contactEmail: string
}

/** An organisation registers itself. It is saved hidden; staff approve it in the admin before it shows in the app. */
export async function registerOrganisation(f: OrganisationForm): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${CMS_URL}/api/organisations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    })
    if (res.ok) return { ok: true }
    return { ok: false, message: 'We could not send your details. Please check them and try again.' }
  } catch {
    return { ok: false, message: 'No connection. Please try again.' }
  }
}

/** Who else joined: first names only. Works only for members (the server checks the caller's email). */
export async function fetchMembers(kind: 'community' | 'organisation', slug: string, email: string): Promise<{ count: number; members: string[] } | null> {
  try {
    const qs = new URLSearchParams({ kind, slug, email })
    const res = await fetch(`${CMS_URL}/api/community-joins/members?${qs}`)
    if (!res.ok) return null
    const d = (await res.json()) as { count?: number; members?: unknown }
    const members = Array.isArray(d.members) ? d.members.filter((m): m is string => typeof m === 'string') : []
    return { count: typeof d.count === 'number' ? d.count : members.length, members }
  } catch {
    return null
  }
}

export type ChatMessage = { id: string; name: string; text: string; at: string; mine: boolean }

export async function fetchChat(kind: 'community' | 'organisation', slug: string, email: string): Promise<ChatMessage[] | null> {
  try {
    const qs = new URLSearchParams({ kind, slug, email })
    const res = await fetch(`${CMS_URL}/api/community-joins/chat?${qs}`)
    if (!res.ok) return null
    const d = (await res.json()) as { messages?: unknown }
    return Array.isArray(d.messages) ? (d.messages as ChatMessage[]) : []
  } catch {
    return null
  }
}

export async function sendChat(kind: 'community' | 'organisation', slug: string, email: string, text: string): Promise<'ok' | 'slow' | 'fail'> {
  try {
    const res = await fetch(`${CMS_URL}/api/community-joins/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, slug, email, text }),
    })
    if (res.ok) return 'ok'
    return res.status === 429 ? 'slow' : 'fail'
  } catch {
    return 'fail'
  }
}
