export type SalesStatus = 'announced' | 'onSale' | 'soldOut' | 'cancelled'

export type Tier = {
  tierId: string
  name: string
  description: string
  /** Major units (e.g. 250 = SEK 250), incl. VAT. */
  price: number
  salesStart: string | null
  salesEnd: string | null
}

export type EventItem = {
  id: string
  slug: string
  title: string
  summary: string
  description: string[]
  poster: string | null
  startsAt: string | null
  endsAt: string | null
  salesStatus: SalesStatus
  currency: string
  maxPerOrder: number
  reservedSeating: boolean
  tiers: Tier[]
  lineup: { name: string; role: string }[]
  languages: string[]
  category: string | null
  /** Slug of the community this event is tagged with in the admin (Events → Community). */
  community: string | null
  /** Slug of the organisation this event is tagged with in the admin (Events → Organisation). */
  organisation: string | null
  venue: {
    name: string
    address: string
    city: string
    mapUrl: string | null
    lat: number | null
    lng: number | null
  } | null
}

export type ServiceKey = 'smsTickets' | 'refundProtection' | 'reminder'
export type Offered = { key: ServiceKey; name: string; price: number }

export type Availability = {
  onSale: boolean
  paymentsReady: boolean
  promoCodes: boolean
  maxPerOrder: number
  holdMinutes: number
  serviceFeePercent: number
  services?: Offered[]
  tiers: { tierId: string; onSale: boolean; remaining: number }[]
  seating: unknown | null
}

export type Quote = {
  subtotal: number
  discount: number
  fees: number
  total: number
  vatAmount: number
  servicesTotal?: number
  services?: Offered[]
  currency: string
  promoCode: string | null
}

/** Shape of an order as returned by the booking API (`publicOrder` in apps/api). Amounts are minor units. */
export type PublicOrder = {
  ref: string
  status: 'pending' | 'paid' | 'expired' | 'refunded' | 'partially_refunded' | 'cancelled'
  event: { id: string; slug: string; title: string; startsAt: string; venue: string }
  name: string
  email: string
  currency: string
  items: { tierId: string; name: string; unitPrice: number; quantity: number }[]
  total: number
  paidAt: string | null
  tickets: {
    code: string
    tier: string
    holder: string
    status: 'valid' | 'checked_in' | 'cancelled'
    seat?: string | null
    qr?: string
  }[]
}

export type Community = {
  /** A community (language group) or an organisation (association / club). */
  kind: 'community' | 'organisation'
  slug: string
  name: string
  /** A few letters in the community language, shown on its card. */
  script: string
  tagline: string
  description: string
  cover: string | null
  songs: string[]
  groupLink: string | null
  announcement: string
  accent: 'gold' | 'blue'
  order: number
}
