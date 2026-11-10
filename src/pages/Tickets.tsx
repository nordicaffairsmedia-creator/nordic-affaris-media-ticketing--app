import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Page } from '../components/Layout'
import { OrderActions, TicketPass } from '../components/TicketPass'
import { GoldButton, Icon, Loading, Notice } from '../components/ui'
import { errorText, fetchOrder, myOrders, requestCode, signOutRemote, verifyCode } from '../lib/api'
import { configured } from '../lib/config'
import { isUpcoming } from '../lib/format'
import { getVisitor, setSession, signOutApp, useSession } from '../lib/storage'
import type { PublicOrder } from '../lib/types'

const field =
  'h-12 w-full rounded-lg bg-surface-container px-space-sm font-body-md text-body-md text-on-surface outline-none ring-1 ring-outline-variant/60 placeholder:text-outline focus:ring-2 focus:ring-primary/70'

/** No account: the buyer asks for a one-time code by email and gets their tickets. */
function SignIn() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send(ev: FormEvent) {
    ev.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    setBusy(true)
    try {
      await requestCode(email.trim().toLowerCase())
      setStep('code')
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  async function verify(ev: FormEvent) {
    ev.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await verifyCode(email.trim().toLowerCase(), code.trim())
      setSession({ token: r.token, email: r.email })
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }

  return (
    <div className="px-gutter pt-space-md">
      <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container p-space-lg">
        <Icon name="mark_email_read" className="text-[32px] text-primary" />
        <h2 className="font-headline-md text-headline-md text-on-surface">Find your tickets</h2>
        {step === 'email' ? (
          <form onSubmit={send} className="flex flex-col gap-space-sm" noValidate>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Enter the email you booked with. We will send a 6-digit code – no password needed.
            </p>
            <input className={field} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {error ? <p role="alert" className="font-body-sm text-body-sm text-error">{error}</p> : null}
            <GoldButton type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</GoldButton>
          </form>
        ) : (
          <form onSubmit={verify} className="flex flex-col gap-space-sm" noValidate>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              If <strong className="text-on-surface">{email}</strong> has bookings, a code is on its way. It expires in 10 minutes.
            </p>
            <input className={`${field} text-center font-headline-sm tracking-[0.5em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" aria-label="6-digit code" />
            {error ? <p role="alert" className="font-body-sm text-body-sm text-error">{error}</p> : null}
            <GoldButton type="submit" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Show my tickets'}</GoldButton>
            <button type="button" onClick={() => { setStep('email'); setCode(''); setError('') }} className="font-label-md text-label-md text-secondary underline">
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

/** One booking: loads the QR codes when opened. */
function OrderBlock({ summary, token, open: initiallyOpen }: { summary: PublicOrder; token: string; open: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open || order) return
    fetchOrder(summary.ref, { token }).then(setOrder).catch(() => setFailed(true))
  }, [open, order, summary.ref, token])

  const count = summary.tickets.length

  return (
    <div className="flex flex-col gap-space-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container p-space-sm text-left"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-body-md text-body-md font-semibold text-on-surface">{summary.event.title}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {count} {count === 1 ? 'ticket' : 'tickets'} · {summary.ref}
            {summary.status !== 'paid' ? ` · ${summary.status.replace('_', ' ')}` : ''}
          </span>
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-primary" />
      </button>
      {open ? (
        failed ? (
          <p className="font-body-sm text-body-sm text-error">Could not load these tickets. Please try again.</p>
        ) : !order ? (
          <Loading label="Loading tickets…" />
        ) : (
          <>
            {order.tickets.map((_, i) => (
              <TicketPass key={order.tickets[i].code} order={order} index={i} total={order.tickets.length} />
            ))}
            <OrderActions order={order} auth={{ token }} />
          </>
        )
      ) : null}
    </div>
  )
}

/** Who is using the app, with the sign out that returns to the details page. */
function AccountCard() {
  const v = getVisitor()
  if (!v) return null
  return (
    <div className="mx-gutter mt-space-md flex items-center justify-between gap-space-sm rounded-2xl bg-surface-container p-space-sm">
      <div className="flex min-w-0 items-center gap-space-sm">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-label-lg text-label-lg uppercase text-primary">{v.name.trim().charAt(0) || '?'}</span>
        <div className="min-w-0">
          <p className="truncate font-label-lg text-label-lg text-on-surface">{v.name}</p>
          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{v.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Sign out? You will need to enter your details again.')) signOutApp()
        }}
        className="shrink-0 rounded-lg border border-primary/50 px-3 py-2 font-label-md text-label-md text-primary active:scale-95"
      >
        Sign out
      </button>
    </div>
  )
}

export default function Tickets() {
  const session = useSession()
  const [orders, setOrders] = useState<PublicOrder[] | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const load = useCallback(() => {
    if (!session) return
    setError('')
    myOrders(session.token)
      .then((r) => setOrders(r.orders))
      .catch((e) => {
        if (e?.status === 401) setSession(null)
        else setError(errorText(e))
      })
  }, [session])

  useEffect(() => {
    setOrders(null)
    load()
  }, [load])

  if (!configured)
    return (
      <Page title="Tickets">
        <Notice icon="settings" title="App not connected yet">Set the API address (see the README).</Notice>
      </Page>
    )

  if (!session)
    return (
      <Page title="My Bookings">
        <AccountCard />
        <div className="px-gutter pt-space-md">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Concierge Gate Access</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">My Bookings & Passes</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Present your digital pass at the gate for entry.</p>
        </div>
        <SignIn />
      </Page>
    )

  const upcoming = (orders ?? []).filter((o) => isUpcoming(o.event.startsAt))
  const past = (orders ?? []).filter((o) => !isUpcoming(o.event.startsAt))
  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <Page title="My Bookings">
      <AccountCard />
      <div className="flex flex-col gap-space-lg px-gutter pt-space-xs">
        <div className="flex flex-col gap-space-xs pt-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Concierge Gate Access</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Gate Verified
            </span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">My Bookings & Passes</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Present this digital pass at the gate for entry. Signed in as {session.email}.</p>
        </div>

        <div className="flex rounded-xl bg-surface-container-lowest p-1" role="tablist">
          {(['upcoming', 'past'] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-label-md text-label-md transition-all ${
                tab === k ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon name={k === 'upcoming' ? 'confirmation_number' : 'history'} className="text-[16px]" />
              {k === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past Events (${past.length})`}
            </button>
          ))}
        </div>

        {error ? (
          <Notice icon="cloud_off" title="Could not load your bookings" action={<GoldButton onClick={load} className="mt-2 h-10 px-4">Try again</GoldButton>}>{error}</Notice>
        ) : orders === null ? (
          <Loading />
        ) : shown.length === 0 ? (
          <Notice icon="confirmation_number" title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past events'}>
            {tab === 'upcoming' ? 'Book tickets from the Discover tab and they will appear here.' : 'Events you have attended will appear here.'}
          </Notice>
        ) : (
          <div className="flex flex-col gap-space-lg">
            {shown.map((o, i) => (
              <OrderBlock key={o.ref} summary={o} token={session.token} open={tab === 'upcoming' && i === 0} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            void signOutRemote(session.token)
            setSession(null)
          }}
          className="self-center pb-space-lg font-label-md text-label-md text-secondary underline"
        >
          Sign out
        </button>
      </div>
    </Page>
  )
}
