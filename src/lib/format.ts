import { TIME_ZONE } from './config'

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, ...opts }).format(new Date(iso))

export const dayNum = (iso: string) => fmt(iso, { day: 'numeric' })
export const monthShort = (iso: string) => fmt(iso, { month: 'short' }).toUpperCase()
export const yearNum = (iso: string) => fmt(iso, { year: 'numeric' })
export const timeOf = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false })
export const weekdayLong = (iso: string) => fmt(iso, { weekday: 'long' })
export const dateLong = (iso: string) => fmt(iso, { day: 'numeric', month: 'long', year: 'numeric' })
export const dateWithWeekday = (iso: string) => `${weekdayLong(iso)}, ${dateLong(iso)}`
export const monthYear = (iso: string) => fmt(iso, { month: 'long', year: 'numeric' })

/** "CET" or "CEST" depending on the date. */
export function zoneLabel(iso: string): string {
  const part = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'short' })
    .formatToParts(new Date(iso))
    .find((p) => p.type === 'timeZoneName')
  return part?.value ?? 'CET'
}

/** Price in major units, e.g. 250 → "SEK 250". */
export function money(major: number, currency: string): string {
  const n = Number.isInteger(major) ? String(major) : major.toFixed(2)
  return `${currency} ${n.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
}

/** Amount in minor units (öre/cents) from the booking API. */
export const moneyMinor = (minor: number, currency: string) => money(minor / 100, currency)

export function isUpcoming(iso: string | null, endIso?: string | null): boolean {
  if (!iso) return true
  const end = endIso ? new Date(endIso).getTime() : new Date(iso).getTime() + 4 * 3600_000
  return end > Date.now()
}

/** Next Saturday 00:00 – Sunday 24:00 window (Stockholm time is close enough for filtering). */
export function weekendRange(now = new Date()): [number, number] {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 Sun … 6 Sat
  const toSat = day === 0 ? -1 : 6 - day
  const sat = new Date(d)
  sat.setDate(d.getDate() + toSat)
  const mon = new Date(sat)
  mon.setDate(sat.getDate() + 2)
  return [sat.getTime(), mon.getTime()]
}

export function nextWeekRange(now = new Date()): [number, number] {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const toMon = ((8 - d.getDay()) % 7) || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() + toMon)
  const end = new Date(mon)
  end.setDate(mon.getDate() + 7)
  return [mon.getTime(), end.getTime()]
}

export const mapsLink = (q: string, lat?: number | null, lng?: number | null) =>
  lat != null && lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
