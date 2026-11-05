import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { COLUMN, DetailHeader } from '../components/Layout'
import { OrderActions, TicketPass } from '../components/TicketPass'
import { Icon, Loading, Notice } from '../components/ui'
import { ApiError, confirmOrder, errorText, fetchOrder } from '../lib/api'
import type { PublicOrder } from '../lib/types'

/**
 * Where Stripe (or a free booking) sends the buyer back to. The link carries the order and its
 * private access token, so no sign-in is needed. We ask Stripe-side status to be confirmed first so
 * the page never waits for the payment webhook.
 */
export default function Confirmation() {
  const [sp] = useSearchParams()
  const ref = sp.get('order') ?? ''
  const t = sp.get('t') ?? ''
  const returned = sp.get('session_id')
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ref || !t) return
    let live = true
    let tries = 0
    async function run() {
      try {
        if (returned) await confirmOrder(ref, t).catch(() => undefined)
        for (;;) {
          const o = await fetchOrder(ref, { t })
          if (!live) return
          setOrder(o)
          if (o.status !== 'pending' || ++tries >= 8) return
          await new Promise((r) => setTimeout(r, 2000))
          if (!live) return
        }
      } catch (e) {
        if (live) setError(e instanceof ApiError && e.status === 404 ? 'We could not find this order.' : errorText(e))
      }
    }
    void run()
    return () => {
      live = false
    }
  }, [ref, t, returned])

  return (
    <>
      <DetailHeader title="Booking" />
      <main className={`${COLUMN} px-gutter pb-12 pt-20`}>
        {!ref || !t ? (
          <Notice icon="link_off" title="This link is incomplete" action={<Link to="/tickets" className="mt-2 rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary">My bookings</Link>} />
        ) : error ? (
          <Notice icon="error" title="Could not open your booking">{error}</Notice>
        ) : !order ? (
          <Loading label="Confirming your booking…" />
        ) : order.status === 'pending' ? (
          <Notice icon="hourglass_top" title="Waiting for your payment">
            We have not received the payment yet. This page updates automatically; you will also get your tickets by email.
          </Notice>
        ) : order.status === 'expired' || order.status === 'cancelled' ? (
          <Notice icon="event_busy" title="This booking is no longer active">
            The payment was not completed in time or the booking was cancelled.
          </Notice>
        ) : (
          <div className="flex flex-col gap-space-md">
            <div className="flex flex-col items-center gap-1 pb-space-sm text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon name="check_circle" fill className="text-[36px]" />
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">You’re going!</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Your tickets are confirmed and have been sent to {order.email}.
              </p>
            </div>
            {order.tickets.map((tk, i) => (
              <TicketPass key={tk.code} order={order} index={i} total={order.tickets.length} />
            ))}
            <OrderActions order={order} auth={{ t }} />
            <Link to="/" className="self-center pt-space-sm font-label-md text-label-md text-secondary underline">Back to events</Link>
          </div>
        )}
      </main>
    </>
  )
}
