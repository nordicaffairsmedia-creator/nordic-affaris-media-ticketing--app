import { money } from './format'
import type { EventItem } from './types'

export const minPrice = (e: EventItem): number | null =>
  e.tiers.length ? Math.min(...e.tiers.map((t) => t.price)) : null

export function fromLabel(e: EventItem): string {
  const p = minPrice(e)
  if (p === null) return 'Tickets soon'
  return p === 0 && e.tiers.every((t) => t.price === 0) ? 'Free entry' : `From ${money(p, e.currency)}`
}

export const venueLine = (e: EventItem): string =>
  e.venue ? [e.venue.name, e.venue.city].filter(Boolean).join(', ') : 'Venue to be announced'

export const isOnSale = (e: EventItem) => e.salesStatus === 'onSale'

/** Search over title, summary, venue, category and artists. */
export function matches(e: EventItem, q: string): boolean {
  const hay = [e.title, e.summary, e.category, e.venue?.name, e.venue?.city, ...e.lineup.map((l) => l.name)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w))
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  sv: 'Swedish',
  ta: 'Tamil',
  ml: 'Malayalam',
  other: 'Other',
}
