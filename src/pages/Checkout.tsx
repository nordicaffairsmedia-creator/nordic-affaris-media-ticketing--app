import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { COLUMN, DetailHeader } from '../components/Layout'
import { GoldButton, Icon, Loading, Notice } from '../components/ui'
import { errorText, fetchAvailability, fetchQuote, startCheckout } from '../lib/api'
import { SITE_URL } from '../lib/config'
import { COUNTRIES, countryName } from '../lib/countries'
import { dateWithWeekday, money, moneyMinor, timeOf } from '../lib/format'
import { useEvents } from '../lib/EventsContext'
import type { Availability, Quote, ServiceKey } from '../lib/types'

type Step = 'tickets' | 'buyer' | 'services' | 'payment'
type Method = 'card' | 'klarna' | 'swish'

const input =
  'h-12 w-full rounded-lg bg-surface-container px-space-sm font-body-md text-body-md text-on-surface outline-none ring-1 ring-outline-variant/60 placeholder:text-outline focus:ring-2 focus:ring-primary/70'
const card = 'rounded-xl bg-surface-container p-space-md'

const SVC: Record<ServiceKey, { title: string; text: string; no: string }> = {
  smsTickets: {
    title: 'Get your tickets sent via SMS',
    text: 'Avoid the hassle of finding your tickets. Receive your tickets as a direct link on your phone via SMS.',
    no: "No, I don't need it.",
  },
  refundProtection: {
    title: 'Get your money back in case of illness',
    text: 'If illness stops you from coming, cancel before the event starts and your tickets and fees are refunded automatically. The cost of this service is not refunded.',
    no: "No, I'll take the risk.",
  },
  reminder: {
    title: 'Get a reminder about the event',
    text: 'Do you want to avoid forgetting the event? You will get an SMS with a reminder and the important details within 24 hours before the event starts.',
    no: "No, I don't need it.",
  },
}
const SMS_KEYS: ServiceKey[] = ['smsTickets', 'reminder']

export default function Checkout() {
  const { slug = '' } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { events, loading } = useEvents()
  const event = useMemo(() => events.find((e) => e.slug === slug), [events, slug])

  const [step, setStep] = useState<Step>('tickets')
  const [avail, setAvail] = useState<Availability | null>(null)
  const [availFailed, setAvailFailed] = useState(false)
  const [qty, setQty] = useState<Record<string, number>>({})
  const [promoText, setPromoText] = useState('')
  const [promo, setPromo] = useState('')
  const [promoMsg, setPromoMsg] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteError, setQuoteError] = useState('')
  const [services, setServices] = useState<Record<ServiceKey, boolean>>({ smsTickets: false, refundProtection: false, reminder: false })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dial, setDial] = useState('+46')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('SE')
  const [postal, setPostal] = useState('')
  const [company, setCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [marketing, setMarketing] = useState(false)
  const [promoter, setPromoter] = useState(false)
  const [terms, setTerms] = useState(false)

  const [method, setMethod] = useState<Method>('card')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!event) return
    fetchAvailability(event.id).then(setAvail).catch(() => setAvailFailed(true))
  }, [event])

  // Start with the pass chosen on the event page (if any).
  const [seeded, setSeeded] = useState(false)
  useEffect(() => {
    if (!event || seeded) return
    setSeeded(true)
    const t = event.tiers.find((x) => x.tierId === sp.get('tier'))
    if (t) setQty({ [t.tierId]: Math.max(1, Math.min(50, Number(sp.get('qty')) || 1)) })
  }, [event, seeded, sp])

  const lines = useMemo(
    () => (event?.tiers ?? []).filter((t) => (qty[t.tierId] ?? 0) > 0).map((t) => ({ tier: t, quantity: qty[t.tierId] })),
    [event, qty],
  )
  const totalQty = lines.reduce((s, x) => s + x.quantity, 0)
  const max = avail?.maxPerOrder ?? event?.maxPerOrder ?? 10
  const offered = avail?.services ?? []
  const hasPhone = /^\+[1-9]\d{6,14}$/.test(phone.trim() ? `${dial}${phone.replace(/\D/g, '').replace(/^0+/, '')}` : '')
  const fullPhone = phone.trim() ? `${dial}${phone.replace(/\D/g, '').replace(/^0+/, '')}` : ''
  const phoneOk = !fullPhone || hasPhone

  // The server prices the order (fees, VAT, promo, services) – the app only shows what it returns.
  useEffect(() => {
    if (!event || totalQty === 0) {
      setQuote(null)
      return
    }
    let live = true
    setQuoteError('')
    fetchQuote({
      eventId: event.id,
      items: lines.map((x) => ({ tierId: x.tier.tierId, quantity: x.quantity })),
      promoCode: promo || undefined,
      services,
    })
      .then((q) => live && setQuote(q))
      .catch((e) => {
        if (!live) return
        if (promo) {
          setPromo('')
          setPromoMsg(errorText(e))
        } else {
          setQuote(null)
          setQuoteError(errorText(e))
        }
      })
    return () => {
      live = false
    }
  }, [event, lines, promo, services, totalQty])

  // Order countdown (steps 2–4).
  useEffect(() => {
    if (!expiresAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [expiresAt])
  useEffect(() => {
    if (expiresAt && now >= expiresAt) {
      setExpiresAt(null)
      setStep('tickets')
      setError('Your order time ran out. Please choose your tickets again.')
    }
  }, [now, expiresAt])
  const left = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0
  const clock = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`

  if (loading && !event) return (<><DetailHeader title="Checkout" /><main className={`${COLUMN} pt-16`}><Loading /></main></>)
  if (!event)
    return (
      <>
        <DetailHeader title="Checkout" />
        <main className={`${COLUMN} pt-16`}>
          <Notice icon="event_busy" title="Event not found" action={<Link to="/" className="mt-2 rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary">Browse events</Link>}>
            This event is no longer available.
          </Notice>
        </main>
      </>
    )

  const remainingOf = (id: string) => {
    const a = avail?.tiers.find((t) => t.tierId === id)
    return a && a.onSale ? a.remaining : 0
  }
  const change = (id: string, d: number) =>
    setQty((q) => {
      const n = Math.max(0, (q[id] ?? 0) + d)
      return { ...q, [id]: n }
    })

  const free = quote?.total === 0
  const stepList: { id: Step; label: string }[] = [
    { id: 'tickets', label: 'Tickets' },
    { id: 'buyer', label: "Buyer's information" },
    ...(offered.length > 0 ? [{ id: 'services' as Step, label: 'Services' }] : []),
    { id: 'payment', label: 'Payment' },
  ]
  const stepIndex = stepList.findIndex((s) => s.id === step)

  function startTimer() {
    if (expiresAt) return
    setExpiresAt(Date.now() + (avail?.holdMinutes ?? 15) * 60_000)
    setNow(Date.now())
  }

  function goBack() {
    setError('')
    setStep(step === 'payment' ? (offered.length > 0 ? 'services' : 'buyer') : step === 'services' ? 'buyer' : 'tickets')
  }

  function nextFromTickets() {
    setError('')
    if (totalQty === 0) return setError('Choose at least one ticket.')
    if (event && event.reservedSeating) return setError('This event uses reserved seating. Please book it on our website.')
    startTimer()
    setStep('buyer')
  }

  function submitBuyer(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (!phoneOk) return setError('Please enter a valid phone number.')
    if (!terms) return setError('Please accept the terms to continue.')
    if (!hasPhone) setServices((s) => ({ ...s, smsTickets: false, reminder: false }))
    setStep(offered.length > 0 ? 'services' : 'payment')
  }

  function applyPromo() {
    const code = promoText.trim().toUpperCase()
    if (!code) return
    setPromoMsg('')
    setPromo(code)
  }

  async function pay() {
    if (!event) return
    setError('')
    setBusy(true)
    try {
      const r = await startCheckout({
        eventId: event.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        items: lines.map((x) => ({ tierId: x.tier.tierId, quantity: x.quantity })),
        promoCode: promo || undefined,
        paymentMethod: free ? undefined : method,
        ...(hasPhone ? { phone: fullPhone } : {}),
        country,
        ...(postal.trim() ? { postalCode: postal.trim() } : {}),
        ...(company && companyName.trim() ? { companyName: companyName.trim() } : {}),
        consent: { marketing, promoter },
        services,
      })
      // Free tickets come back as a confirmation link. Open it inside this app (whatever address the
      // server put in the link) so the buyer sees their passes here, not on the website.
      let target: URL | null = null
      try { target = new URL(r.url, window.location.origin) } catch { /* keep null */ }
      if (target && /\/booking\/confirmation\/?$/.test(target.pathname) && !target.searchParams.get('session_id')) {
        nav(`/booking/confirmation${target.search}`, { replace: true })
      } else {
        // Stripe's secure payment page.
        window.location.assign(r.url)
      }
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
      if (e instanceof Error && e.message === 'sold_out') setStep('tickets')
    }
  }

  const cur = event.currency
  const primaryLabel =
    step === 'payment' ? (busy ? 'Processing…' : free ? 'Confirm booking' : 'Pay securely') : 'Next'

  return (
    <>
      <DetailHeader title="Checkout" />
      <main className={`${COLUMN} px-gutter pb-40 pt-20`}>
        {/* Stepper */}
        <ol className="mb-space-md flex items-start justify-between gap-1" aria-label="Checkout steps">
          {stepList.map((s, i) => (
            <li key={s.id} className="flex flex-1 flex-col items-center gap-1 text-center" aria-current={i === stepIndex ? 'step' : undefined}>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full font-label-md text-label-md font-bold ${
                  i === stepIndex ? 'bg-primary text-on-primary' : i < stepIndex ? 'bg-primary/30 text-primary' : 'bg-surface-container-high text-outline'
                }`}
              >
                {i < stepIndex ? <Icon name="check" className="text-[18px]" /> : i + 1}
              </span>
              <span className={`font-label-sm text-label-sm ${i === stepIndex ? 'font-semibold text-on-surface' : 'text-outline'}`}>{s.label}</span>
            </li>
          ))}
        </ol>

        <div className="mb-space-sm">
          <h1 className="font-headline-md text-headline-md text-on-surface">{event.title}</h1>
          {event.startsAt ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">{dateWithWeekday(event.startsAt)} · {timeOf(event.startsAt)}</p>
          ) : null}
        </div>

        {step !== 'tickets' && expiresAt ? (
          <p role="timer" className="mb-space-sm flex items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 py-3 font-body-sm text-body-sm text-on-surface">
            Your order will expire: <span className="font-semibold tabular-nums text-primary">{clock}</span>
          </p>
        ) : null}

        <div className="flex flex-col gap-space-md">
          {/* STEP 1 – tickets */}
          {step === 'tickets' ? (
            <>
              {availFailed ? (
                <p className="rounded-lg bg-error-container/40 p-space-sm font-body-sm text-body-sm text-on-error-container">
                  We could not reach the booking service. It may be waking up – please try again in a moment.
                </p>
              ) : null}
              <ul className="flex flex-col gap-space-sm" aria-label="Tickets">
                {event.tiers.map((t) => {
                  const n = qty[t.tierId] ?? 0
                  const rem = remainingOf(t.tierId)
                  const a = avail?.tiers.find((x) => x.tierId === t.tierId)
                  const closed = avail !== null && a !== undefined && !a.onSale
                  const soldOut = avail !== null && rem === 0 && !closed
                  return (
                    <li key={t.tierId} className={`${card} ${n > 0 ? 'ring-1 ring-primary/60' : ''}`}>
                      <p className="font-label-md text-label-md font-bold uppercase tracking-wide text-on-surface">{t.name}</p>
                      {t.description ? <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{t.description}</p> : null}
                      <div className="mt-space-sm flex items-end justify-between gap-4">
                        <div>
                          <p className="font-headline-sm text-headline-sm font-semibold text-primary">{t.price === 0 ? 'Free' : money(t.price, cur)}</p>
                          {closed || soldOut || (avail && rem <= 20) ? (
                            <p className={`font-label-sm text-label-sm ${closed || soldOut ? 'text-error' : 'text-outline'}`}>
                              {closed ? 'Not on sale' : soldOut ? 'Sold out' : `${rem} left`}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2" role="group" aria-label={t.name}>
                          <button type="button" aria-label="Remove one" onClick={() => change(t.tierId, -1)} disabled={n === 0 || busy}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-high text-on-surface disabled:opacity-30">
                            <Icon name="remove" />
                          </button>
                          <output aria-live="polite" className="w-8 text-center font-body-md text-body-md font-semibold text-on-surface">{n}</output>
                          <button type="button" aria-label="Add one" onClick={() => change(t.tierId, 1)}
                            disabled={soldOut || closed || n >= rem || totalQty >= max || busy || !avail}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-30">
                            <Icon name="add" />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {avail?.promoCodes ? (
                <div className={card}>
                  <p className="font-body-sm text-body-sm font-semibold text-primary">Do you have a discount or promo code? Enter it below.</p>
                  <div className="mt-space-sm flex gap-2">
                    <input aria-label="Promo code" className={`${input} uppercase`} value={promoText} maxLength={40} autoComplete="off"
                      onChange={(e) => { setPromoText(e.target.value); if (promo && e.target.value.trim().toUpperCase() !== promo) setPromo('') }} />
                    <button type="button" onClick={applyPromo} disabled={!promoText.trim() || totalQty === 0}
                      className="shrink-0 rounded-lg bg-surface-container-high px-4 font-label-md text-label-md text-primary disabled:opacity-40">
                      Add to cart
                    </button>
                  </div>
                  {promoMsg ? <p className="mt-2 font-body-sm text-body-sm text-error">{promoMsg}</p> : null}
                  {promo && quote?.promoCode ? <p className="mt-2 font-body-sm text-body-sm text-emerald-400">Discount: {promo}</p> : null}
                </div>
              ) : null}
            </>
          ) : null}

          {/* STEP 2 – buyer */}
          {step === 'buyer' ? (
            <form id="buyer-form" onSubmit={submitBuyer} className={`${card} flex flex-col gap-space-sm`} noValidate>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Buyer's information</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Tickets and receipts are sent to this email.</p>
              <label className="flex flex-col gap-1">
                <span className="font-label-md text-label-md text-on-surface-variant">Full name</span>
                <input className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label-md text-label-md text-on-surface-variant">Email</span>
                <input className={input} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} />
              </label>
              <div className="flex flex-col gap-1">
                <span className="font-label-md text-label-md text-on-surface-variant">Phone number</span>
                <div className="grid grid-cols-[8.5rem_1fr] gap-2">
                  <select aria-label="Dial code" className={input} value={dial} onChange={(e) => setDial(e.target.value)}>
                    {COUNTRIES.map(([code, d]) => (<option key={code} value={d}>{code} ({d})</option>))}
                  </select>
                  <input className={input} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">Country</span>
                  <select className={input} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country">
                    {COUNTRIES.map(([code]) => (<option key={code} value={code}>{countryName(code)}</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">Postal code</span>
                  <input className={input} maxLength={12} autoComplete="postal-code" value={postal} onChange={(e) => setPostal(e.target.value)} />
                </label>
              </div>
              <label className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                <input type="checkbox" checked={company} onChange={(e) => setCompany(e.target.checked)} className="h-5 w-5 accent-[#d4af37]" />
                I buy as a company
              </label>
              {company ? (
                <label className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">Company name</span>
                  <input className={input} maxLength={80} autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </label>
              ) : null}
              <div className="mt-1 flex flex-col gap-3 border-t border-surface-container-highest pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]" />
                  <span>Send me news and offers about similar events from Nordic Affairs Media.</span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={promoter} onChange={(e) => setPromoter(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]" />
                  <span>I agree that the promoter may send me emails and SMS about similar events.</span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d4af37]" />
                  <span>
                    I accept the{' '}
                    {SITE_URL ? <a className="text-primary underline" href={`${SITE_URL}/en/terms`} target="_blank" rel="noreferrer">terms</a> : 'terms'} ·{' '}
                    {SITE_URL ? <a className="text-primary underline" href={`${SITE_URL}/en/privacy`} target="_blank" rel="noreferrer">privacy policy</a> : 'privacy policy'}.
                  </span>
                </label>
              </div>
            </form>
          ) : null}

          {/* STEP 3 – services */}
          {step === 'services' ? (
            <section className={`${card} flex flex-col gap-space-sm`} aria-label="Additional services">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Additional services</h2>
                <button type="button" className="font-label-md text-label-md font-semibold text-primary"
                  onClick={() => setServices({
                    smsTickets: hasPhone && offered.some((o) => o.key === 'smsTickets'),
                    refundProtection: offered.some((o) => o.key === 'refundProtection'),
                    reminder: hasPhone && offered.some((o) => o.key === 'reminder'),
                  })}>
                  Add all services
                </button>
              </div>
              {offered.map((svc) => {
                const blocked = SMS_KEYS.includes(svc.key) && !hasPhone
                const on = services[svc.key]
                const txt = SVC[svc.key]
                return (
                  <fieldset key={svc.key} className="flex flex-col gap-2 rounded-lg border border-outline-variant/40 p-space-sm">
                    <legend className="sr-only">{txt.title}</legend>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-body-md text-body-md font-semibold text-on-surface">{txt.title}</p>
                      <p className="shrink-0 font-body-md text-body-md font-semibold text-primary">{moneyMinor(svc.price, cur)}</p>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{txt.text}</p>
                    {blocked ? <p className="font-label-sm text-label-sm text-error">Add your phone number in the previous step to use the SMS services.</p> : null}
                    <div className="grid grid-cols-2 gap-2 font-body-sm text-body-sm">
                      <label className={`flex items-center gap-2 rounded-lg border p-3 ${on ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/40 text-on-surface-variant'} ${blocked ? 'opacity-40' : ''}`}>
                        <input type="radio" name={`svc-${svc.key}`} checked={on} disabled={blocked} onChange={() => setServices((s) => ({ ...s, [svc.key]: true }))} className="accent-[#d4af37]" />
                        Yes please
                      </label>
                      <label className={`flex items-center gap-2 rounded-lg border p-3 ${!on ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/40 text-on-surface-variant'}`}>
                        <input type="radio" name={`svc-${svc.key}`} checked={!on} onChange={() => setServices((s) => ({ ...s, [svc.key]: false }))} className="accent-[#d4af37]" />
                        {txt.no}
                      </label>
                    </div>
                  </fieldset>
                )
              })}
            </section>
          ) : null}

          {/* STEP 4 – payment */}
          {step === 'payment' ? (
            <section className={`${card} flex flex-col gap-space-sm`} aria-label="Choose your payment method">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Choose your payment method</h2>
                <span className="font-label-sm text-label-sm text-outline">Safe</span>
              </div>
              {free ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">Your tickets are free. Confirm your booking to receive them by email.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ['card', 'Card', 'Visa · Mastercard · Apple Pay · Google Pay'],
                      ['klarna', 'Klarna', 'Pay later'],
                      ['swish', 'Swish', 'Sweden'],
                    ] as const).map(([k, label, sub]) => (
                      <button key={k} type="button" aria-pressed={method === k} onClick={() => setMethod(k)}
                        className={`rounded-lg border p-space-sm text-left transition ${method === k ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/50'}`}>
                        <span className="block font-body-sm text-body-sm font-semibold">{label}</span>
                        <span className="block font-label-sm text-label-sm opacity-80">{sub}</span>
                      </button>
                    ))}
                  </div>
                  <p className="font-label-sm text-label-sm text-outline">You pay on the secure Stripe page. The methods offered depend on your country and device.</p>
                </>
              )}
            </section>
          ) : null}

          {/* Order summary */}
          <section className={card} aria-label="Order Summary">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Order Summary</h2>
            {lines.length === 0 ? (
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">No tickets selected yet.</p>
            ) : (
              <dl className="mt-space-sm flex flex-col gap-2 border-t border-surface-container-highest pt-space-sm font-body-sm text-body-sm text-on-surface">
                {lines.map((x) => (
                  <div key={x.tier.tierId} className="flex justify-between gap-4">
                    <dt>{x.quantity} × {event.title} - {x.tier.name}</dt>
                    <dd className="shrink-0 font-semibold">{money(x.tier.price * x.quantity, cur)}</dd>
                  </div>
                ))}
                {quote && quote.fees > 0 ? (
                  <div className="flex justify-between gap-4"><dt>Ticket fee</dt><dd className="font-semibold">{moneyMinor(quote.fees, quote.currency)}</dd></div>
                ) : null}
                {quote && quote.discount > 0 ? (
                  <div className="flex justify-between gap-4 text-emerald-400"><dt>Discount{quote.promoCode ? ` (${quote.promoCode})` : ''}</dt><dd className="font-semibold">− {moneyMinor(quote.discount, quote.currency)}</dd></div>
                ) : null}
                {quote?.services?.map((s) => (
                  <div key={s.key} className="flex justify-between gap-4"><dt>{SVC[s.key].title}</dt><dd className="font-semibold">{moneyMinor(s.price, quote.currency)}</dd></div>
                ))}
              </dl>
            )}
            <div className="mt-space-sm flex items-baseline justify-between gap-4 border-t border-surface-container-highest pt-space-sm">
              <span className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">Order Amount</span>
              <span className="font-headline-md text-headline-md font-bold text-primary">{quote ? (free ? 'Free' : moneyMinor(quote.total, quote.currency)) : money(0, cur)}</span>
            </div>
            {quote && quote.vatAmount > 0 ? (
              <p className="text-right font-label-sm text-label-sm text-outline">incl. VAT {moneyMinor(quote.vatAmount, quote.currency)}</p>
            ) : null}
            {quoteError ? <p className="pt-1 font-body-sm text-body-sm text-error">{quoteError}</p> : null}
            {step === 'tickets' && totalQty > 0 ? (
              <p className="mt-2 font-label-sm text-label-sm text-outline">Tickets in your cart are not reserved until you pay.</p>
            ) : null}
          </section>

          {error ? (
            <p role="alert" className="rounded-lg bg-error-container/40 p-space-sm font-body-sm text-body-sm text-on-error-container">{error}</p>
          ) : null}

          {step !== 'tickets' ? (
            <button type="button" onClick={goBack} disabled={busy} className="self-start font-label-md text-label-md font-semibold text-primary">
              ← Back
            </button>
          ) : null}
        </div>
      </main>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-container-highest bg-surface/95 px-gutter pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur">
        <div className={`${COLUMN} flex items-center gap-4`}>
          <div className="min-w-0">
            <span className="block font-label-sm text-label-sm uppercase tracking-wider text-outline">Total</span>
            <span className="block font-headline-sm text-headline-sm font-bold text-primary">{quote ? (free ? 'Free' : moneyMinor(quote.total, quote.currency)) : money(0, cur)}</span>
          </div>
          <GoldButton
            type="button"
            className="flex-1"
            disabled={busy || (step === 'tickets' && totalQty === 0) || (step === 'payment' && !quote)}
            onClick={() => {
              if (step === 'tickets') nextFromTickets()
              else if (step === 'buyer') (document.getElementById('buyer-form') as HTMLFormElement | null)?.requestSubmit()
              else if (step === 'services') { setError(''); setStep('payment') }
              else void pay()
            }}
          >
            {step === 'payment' ? <Icon name="lock" className="text-[18px]" /> : null}
            {primaryLabel}
          </GoldButton>
        </div>
      </div>
    </>
  )
}
