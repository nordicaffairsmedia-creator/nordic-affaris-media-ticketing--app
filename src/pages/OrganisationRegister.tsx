import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav, COLUMN, DetailHeader } from '../components/Layout'
import { registerOrganisation, type OrganisationForm } from '../lib/api'
import { SITE_URL } from '../lib/config'
import { getVisitor } from '../lib/storage'

const input =
  'h-12 w-full rounded-lg bg-surface-container px-space-sm font-body-md text-body-md text-on-surface outline-none ring-1 ring-outline-variant/60 placeholder:text-outline focus:ring-2 focus:ring-primary/70'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** "google.com/x" -> "https://google.com/x"; anything that is not a web address -> null. */
function toLink(v: string): string | null {
  const t = v.trim()
  if (!t) return ''
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
    return u.protocol === 'https:' || u.protocol === 'http:' ? `https://${u.host}${u.pathname}${u.search}`.replace(/\/$/, '') : null
  } catch {
    return null
  }
}

/** An association or club registers its profile. Staff approve it before it shows in the app. */
export default function OrganisationRegister() {
  const visitor = getVisitor()
  const [f, setF] = useState({
    name: '',
    description: '',
    city: '',
    website: '',
    youtube: '',
    instagram: '',
    facebook: '',
    groupLink: '',
    contactName: visitor?.name ?? '',
    contactEmail: visitor?.email ?? '',
  })
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (f.name.trim().length < 2) return setError('Please enter the organisation name.')
    if (f.contactEmail.trim() && !EMAIL.test(f.contactEmail.trim())) return setError('Please enter a valid contact email.')
    const links: Partial<Record<'website' | 'youtube' | 'instagram' | 'facebook' | 'groupLink', string>> = {}
    for (const k of ['website', 'youtube', 'instagram', 'facebook', 'groupLink'] as const) {
      const l = toLink(f[k])
      if (l === null) return setError(`The ${k === 'groupLink' ? 'group chat' : k} link is not a valid web address.`)
      links[k] = l
    }
    if (!agree) return setError('Please agree so we can review and publish your profile.')
    setError('')
    setBusy(true)
    const body: OrganisationForm = { ...f, ...(links as Record<string, string>), name: f.name.trim(), contactName: f.contactName.trim(), contactEmail: f.contactEmail.trim() }
    const r = await registerOrganisation(body)
    setBusy(false)
    if (r.ok) setDone(true)
    else setError(r.message)
  }

  return (
    <>
      <DetailHeader title="Register organisation" />
      <main className={`${COLUMN} min-h-screen pb-24 pt-16`}>
        {done ? (
          <div className="flex flex-col items-center gap-space-md px-gutter pt-space-xl text-center">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Thank you</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              We received the profile of <b className="text-on-surface">{f.name.trim()}</b>. We will review it and publish it in the app. We may contact you by email.
            </p>
            <Link to="/organisations" className="flex h-12 items-center rounded-lg bg-primary px-6 font-label-lg text-label-lg text-on-primary">
              Back to organisations
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-space-sm px-gutter pt-space-md">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Register your organisation</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Add your profile. We review it before it shows in the app.</p>

            <label className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant">Organisation name *</span>
              <input className={input} value={f.name} onChange={set('name')} maxLength={120} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant">About your organisation</span>
              <textarea className={`${input} h-28 py-3`} value={f.description} onChange={set('description')} maxLength={600} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant">City</span>
              <input className={input} value={f.city} onChange={set('city')} maxLength={80} />
            </label>
            {(
              [
                ['website', 'Website', 'www.example.com'],
                ['youtube', 'YouTube channel', 'youtube.com/@yourchannel'],
                ['instagram', 'Instagram', 'instagram.com/yourname'],
                ['facebook', 'Facebook', 'facebook.com/yourpage'],
                ['groupLink', 'WhatsApp / Telegram group link', 'chat.whatsapp.com/...'],
              ] as const
            ).map(([k, label, ph]) => (
              <label key={k} className="flex flex-col gap-1">
                <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
                <input className={input} value={f[k]} onChange={set(k)} placeholder={ph} inputMode="url" autoCapitalize="none" maxLength={300} />
              </label>
            ))}

            <div className="mt-space-xs rounded-xl bg-surface-container-low p-space-sm">
              <p className="pb-space-xs font-label-md text-label-md text-secondary">Contact person (optional, private, only we can see this)</p>
              <div className="flex flex-col gap-space-sm">
                <input className={input} value={f.contactName} onChange={set('contactName')} placeholder="Name (optional)" autoComplete="name" maxLength={80} />
                <input className={input} type="email" value={f.contactEmail} onChange={set('contactEmail')} placeholder="Email (optional)" autoComplete="email" maxLength={200} />
              </div>
            </div>

            <label className="flex items-start gap-3 pt-1 font-body-sm text-body-sm text-on-surface-variant">
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setError('') }} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]" />
              <span>
                I agree that Nordic Affairs Media stores these details and may publish the profile (name, description, city and links) in the app, as described in the{' '}
                {SITE_URL ? (
                  <a className="text-primary underline" href={`${SITE_URL}/en/privacy`} target="_blank" rel="noreferrer">privacy policy</a>
                ) : (
                  'privacy policy'
                )}
                .
              </span>
            </label>

            {error ? <p role="alert" className="font-body-sm text-body-sm text-error">{error}</p> : null}
            <button type="submit" disabled={busy} className="mt-1 h-12 w-full rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-[0_4px_16px_rgba(212,175,55,0.35)] active:scale-[0.98] disabled:opacity-60">
              {busy ? 'Please wait…' : 'Send for review'}
            </button>
          </form>
        )}
      </main>
      <BottomNav />
    </>
  )
}
