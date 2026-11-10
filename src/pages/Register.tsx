import { useState, type FormEvent } from 'react'
import { registerVisitor } from '../lib/api'
import { SITE_URL } from '../lib/config'
import { COUNTRIES } from '../lib/countries'
import { setVisitor, type Visitor } from '../lib/storage'

const input =
  'h-12 w-full rounded-lg bg-surface-container px-space-sm font-body-md text-body-md text-on-surface outline-none ring-1 ring-outline-variant/60 placeholder:text-outline focus:ring-2 focus:ring-primary/70'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const national = (p: string) => p.replace(/\D/g, '').replace(/^0+/, '')

/** Asked once, before the app opens: name, email and mobile number. No password, no account. */
export default function Register({ onDone }: { onDone: (v: Visitor) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dial, setDial] = useState('+46')
  const [phone, setPhone] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const em = email.trim().toLowerCase()
    const num = national(phone)
    if (n.length < 2) return setError('Please enter your name.')
    if (!EMAIL.test(em)) return setError('Please enter a valid email address.')
    if (num.length < 6 || num.length > 13) return setError('Please enter a valid mobile number.')
    if (!agree) return setError('Please accept the privacy policy to continue.')
    setError('')
    setBusy(true)
    const full = `${dial}${num}`
    // Do not keep the visitor waiting on a slow network: after 4 s they go in and the details are sent next time.
    const sent = await Promise.race([registerVisitor({ name: n, email: em, phone: full }), new Promise<boolean>((r) => setTimeout(() => r(false), 4000))])
    const v: Visitor = { name: n, email: em, dial, phone: num, sent }
    setVisitor(v)
    onDone(v)
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-center overflow-hidden bg-background px-gutter py-space-lg">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex flex-col items-center gap-space-sm text-center">
        <img src="/icon-512.png" alt="" className="h-20 w-20 rounded-2xl object-contain ring-1 ring-primary/40" />
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Welcome</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Tell us a little about you to enter the app.</p>
      </div>

      <form onSubmit={submit} noValidate className="relative mt-space-md flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Email</span>
          <input className={input} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} />
        </label>
        <div className="flex flex-col gap-1">
          <span className="font-label-md text-label-md text-on-surface-variant">Mobile number</span>
          <div className="grid grid-cols-[8.5rem_1fr] gap-2">
            <select aria-label="Dial code" className={input} value={dial} onChange={(e) => setDial(e.target.value)}>
              {COUNTRIES.map(([code, d]) => (
                <option key={code} value={d}>
                  {code} ({d})
                </option>
              ))}
            </select>
            <input className={input} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <label className="flex items-start gap-3 pt-1 font-body-sm text-body-sm text-on-surface-variant">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]" />
          <span>
            I agree that Nordic Affairs Media stores these details, as described in the{' '}
            {SITE_URL ? (
              <a className="text-primary underline" href={`${SITE_URL}/en/privacy`} target="_blank" rel="noreferrer">
                privacy policy
              </a>
            ) : (
              'privacy policy'
            )}
            .
          </span>
        </label>

        {error ? (
          <p role="alert" className="font-body-sm text-body-sm text-error">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 h-12 w-full rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Please wait…' : 'Enter'}
        </button>
      </form>
    </main>
  )
}
