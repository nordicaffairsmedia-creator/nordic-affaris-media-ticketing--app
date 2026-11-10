import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { registerVisitor } from '../lib/api'
import { SITE_URL } from '../lib/config'
import { COUNTRIES } from '../lib/countries'
import { setVisitor, type Visitor } from '../lib/storage'

const input =
  'h-12 w-full rounded-lg bg-surface-container px-space-sm font-body-md text-body-md text-on-surface outline-none ring-1 ring-outline-variant/60 placeholder:text-outline focus:ring-2 focus:ring-primary/70'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const national = (p: string) => p.replace(/\D/g, '').replace(/^0+/, '')

const INTRO_MS = 1900

/**
 * Asked once, before the app opens: name, email and mobile number. No password, no account.
 * First visit: the logo and welcome message show centered, then glide to the top while the form rises in
 * underneath. The final layout never changes (only transforms animate), so nothing jumps.
 */
export default function Register({ onDone, intro = false }: { onDone: (v: Visitor) => void; intro?: boolean }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [phase, setPhase] = useState<'intro' | 'form'>(intro && !reduce ? 'intro' : 'form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dial, setDial] = useState('+46')
  const [phone, setPhone] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (phase !== 'intro') return
    const t = window.setTimeout(() => setPhase('form'), INTRO_MS)
    return () => window.clearTimeout(t)
  }, [phase])
  const show = phase === 'form'
  const rise = (i: number): CSSProperties => ({
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(28px)',
    visibility: show ? 'visible' : 'hidden',
    transition: reduce ? 'none' : `opacity 650ms ease-out ${300 + i * 110}ms, transform 650ms cubic-bezier(.2,.8,.2,1) ${300 + i * 110}ms`,
  })

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
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col items-center overflow-hidden bg-background px-gutter pb-space-lg pt-14">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

      {/* brand: starts in the middle of the screen, then glides to the top */}
      <div
        className="relative flex h-[12.5rem] w-full flex-col items-center justify-start gap-3 text-center"
        style={{
          transform: show ? 'translateY(0) scale(1)' : 'translateY(calc(50dvh - 9.75rem)) scale(1.18)',
          transition: reduce ? 'none' : 'transform 900ms cubic-bezier(.65,0,.25,1)',
        }}
      >
        <div className="welcome-rise rounded-[1.6rem] p-1 shadow-2xl shadow-primary/20 ring-1 ring-primary/40">
          <img src="/icon-512.png" alt="Nordic Affairs Media" width={80} height={80} className="h-20 w-20 rounded-[1.3rem] object-contain" />
        </div>
        <div className="welcome-rise flex flex-col items-center gap-1" style={{ animationDelay: '120ms' }}>
          <span className="font-label-md text-label-md uppercase tracking-[0.3em] text-secondary">Welcome to</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Nordic Affairs Media</h1>
          <div className="my-0.5 h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <p className="font-headline-sm text-headline-sm text-primary">Events Ticket Booking</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate aria-hidden={!show} className="relative mt-space-md flex w-full flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-xl" style={rise(0)}>
        <p className="text-center font-body-md text-body-md text-on-surface-variant" style={rise(1)}>
          Tell us a little about you to enter the app.
        </p>
        <label className="flex flex-col gap-1" style={rise(2)}>
          <span className="font-label-md text-label-md text-on-surface-variant">Name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} tabIndex={show ? 0 : -1} />
        </label>
        <label className="flex flex-col gap-1" style={rise(3)}>
          <span className="font-label-md text-label-md text-on-surface-variant">Email</span>
          <input className={input} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} tabIndex={show ? 0 : -1} />
        </label>
        <div className="flex flex-col gap-1" style={rise(4)}>
          <span className="font-label-md text-label-md text-on-surface-variant">Mobile number</span>
          <div className="grid grid-cols-[8.5rem_1fr] gap-2">
            <select aria-label="Dial code" className={input} value={dial} onChange={(e) => setDial(e.target.value)} tabIndex={show ? 0 : -1}>
              {COUNTRIES.map(([code, d]) => (
                <option key={code} value={d}>
                  {code} ({d})
                </option>
              ))}
            </select>
            <input className={input} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} tabIndex={show ? 0 : -1} />
          </div>
        </div>

        <label className="flex items-start gap-3 pt-1 font-body-sm text-body-sm text-on-surface-variant" style={rise(5)}>
          <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setError('') }} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]" tabIndex={show ? 0 : -1} />
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
          tabIndex={show ? 0 : -1}
          style={rise(6)}
          className="mt-1 h-12 w-full rounded-lg bg-primary font-label-lg text-label-lg text-on-primary shadow-[0_4px_16px_rgba(212,175,55,0.35)] active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Please wait…' : 'Enter'}
        </button>
      </form>
    </main>
  )
}
