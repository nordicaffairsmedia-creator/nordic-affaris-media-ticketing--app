import { useState } from 'react'
import { downloadTicketsPdf, errorText, resendTickets } from '../lib/api'
import { dateWithWeekday, mapsLink, timeOf, zoneLabel } from '../lib/format'
import type { PublicOrder } from '../lib/types'
import { Icon } from './ui'

type Auth = { token?: string; t?: string }

const STATUS = {
  valid: { label: 'Valid', cls: 'bg-surface-container-high text-primary' },
  checked_in: { label: 'Checked in', cls: 'bg-emerald-500/15 text-emerald-300' },
  cancelled: { label: 'Cancelled', cls: 'bg-error-container/50 text-on-error-container' },
} as const

/** One digital ticket: event dossier on top, QR for the gate scanner below, joined by a perforated line. */
export function TicketPass({
  order,
  index,
  total,
}: {
  order: PublicOrder
  index: number
  total: number
}) {
  const ticket = order.tickets[index]
  const st = STATUS[ticket.status]
  const dead = ticket.status === 'cancelled'
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-container shadow-xl">
      <div className="h-1.5 w-full bg-gradient-to-r from-secondary-container via-primary to-secondary" />
      <div className="relative flex flex-col gap-space-md p-space-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/5 blur-3xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="stars" fill className="text-[20px] text-primary" />
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-primary">Nordic Affairs Pass</span>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wider ${st.cls}`}>{st.label}</span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-semibold tracking-tight text-on-surface">{order.event.title}</h2>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-primary">{ticket.tier}</span>
            {total > 1 ? <span className="font-body-sm text-body-sm text-on-surface-variant">• Ticket {index + 1} of {total}</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-space-sm rounded-xl bg-surface-container-high p-space-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Icon name="badge" className="text-[20px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Passholder</span>
            <span className="truncate font-label-lg text-label-lg font-semibold text-on-surface">{ticket.holder || order.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          <Cell label="Date" value={dateOnly(order.event.startsAt)} sub={weekday(order.event.startsAt)} />
          <Cell label="Showtime" value={`${timeOf(order.event.startsAt)} ${zoneLabel(order.event.startsAt)}`} subCls="text-tertiary" />
          <Cell label="Venue" value={order.event.venue || 'See event page'} />
          <Cell label="Seat" value={ticket.seat ?? 'General admission'} sub={ticket.seat ? undefined : 'Open seating'} />
        </div>
      </div>

      <div className="relative flex w-full items-center bg-surface-container px-4">
        <div className="absolute -left-3.5 h-7 w-7 rounded-full bg-surface" />
        <div className="my-2 w-full border-t-2 border-dashed border-outline-variant/60" />
        <div className="absolute -right-3.5 h-7 w-7 rounded-full bg-surface" />
      </div>

      <div className="flex flex-col items-center gap-space-md bg-surface-container-low p-space-lg text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Gate Turnstile Scanning</span>
          <span className="break-all font-label-md text-label-md font-bold text-primary">Ticket ID: {ticket.code}</span>
        </div>
        <div className="flex h-52 w-52 items-center justify-center rounded-xl bg-white p-3 shadow-lg">
          {dead ? (
            <Icon name="block" className="text-[64px] text-error" />
          ) : ticket.qr ? (
            <img src={ticket.qr} alt={`QR code for ticket ${ticket.code}`} className="h-full w-full" />
          ) : (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          )}
        </div>
        <span className="font-body-sm text-body-sm text-on-surface-variant">Order {order.ref} · show this code at the gate</span>
      </div>
    </div>
  )
}

const dateOnly = (iso: string) => {
  // "Friday, 26 March 2027" → "26 March 2027"
  const s = dateWithWeekday(iso)
  return s.includes(', ') ? s.split(', ').slice(1).join(', ') : s
}
const weekday = (iso: string) => dateWithWeekday(iso).split(',')[0]

function Cell({ label, value, sub, subCls = 'text-secondary' }: { label: string; value: string; sub?: string; subCls?: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg bg-surface-container-low p-2.5">
      <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">{label}</span>
      <span className="break-words font-label-lg text-label-lg font-semibold text-on-surface">{value}</span>
      {sub ? <span className={`font-body-sm text-body-sm ${subCls}`}>{sub}</span> : null}
    </div>
  )
}

/** Download / email / navigate actions for one order. */
export function OrderActions({ order, auth }: { order: PublicOrder; auth: Auth }) {
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')
  const paid = order.status === 'paid'

  async function run(kind: 'pdf' | 'mail') {
    setBusy(kind)
    setMsg('')
    try {
      if (kind === 'pdf') await downloadTicketsPdf(order.ref, auth)
      else {
        const r = await resendTickets(order.ref, auth)
        setMsg(r.sent ? `Tickets sent to ${order.email}.` : 'Could not send the email right now.')
      }
    } catch (e) {
      setMsg(errorText(e))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="flex flex-col gap-space-sm">
      {paid ? (
        <div className="grid grid-cols-2 gap-space-sm">
          <button type="button" disabled={busy !== ''} onClick={() => run('pdf')} className="flex items-center justify-center gap-2 rounded-xl bg-surface-container py-3 font-label-md text-label-md text-on-surface disabled:opacity-50">
            <Icon name="download" className="text-[18px]" /> PDF Ticket
          </button>
          <button type="button" disabled={busy !== ''} onClick={() => run('mail')} className="flex items-center justify-center gap-2 rounded-xl bg-surface-container py-3 font-label-md text-label-md text-on-surface disabled:opacity-50">
            <Icon name="mail" className="text-[18px]" /> Email Tickets
          </button>
        </div>
      ) : null}
      <a
        href={mapsLink(order.event.venue)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between rounded-xl bg-surface-container p-space-sm"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon name="location_on" className="text-primary" />
          <span className="truncate font-body-md text-body-md font-semibold text-on-surface">{order.event.venue || 'Venue'}</span>
        </span>
        <span className="flex items-center gap-1 rounded-lg bg-surface-container-high px-3 py-1.5 font-label-md text-label-md text-primary">
          Navigate <Icon name="north_east" className="text-[14px]" />
        </span>
      </a>
      {msg ? <p role="status" className="text-center font-body-sm text-body-sm text-on-surface-variant">{msg}</p> : null}
    </div>
  )
}
