import { Link } from 'react-router-dom'
import { dayNum, monthShort, timeOf, zoneLabel } from '../lib/format'
import { fromLabel, isOnSale, venueLine } from '../lib/events'
import { useSaved } from '../lib/storage'
import type { EventItem } from '../lib/types'
import { Icon, Poster } from './ui'

function BookmarkButton({ id, className }: { id: string; className: string }) {
  const { isSaved, toggle } = useSaved()
  const on = isSaved(id)
  return (
    <button
      type="button"
      aria-label={on ? 'Remove from saved' : 'Save event'}
      aria-pressed={on}
      onClick={() => toggle(id)}
      className={className}
    >
      <Icon name={on ? 'bookmark' : 'bookmark_border'} fill={on} className={`text-[20px] ${on ? 'text-primary' : ''}`} />
    </button>
  )
}

function StatusTag({ e }: { e: EventItem }) {
  if (e.salesStatus === 'onSale')
    return (
      <>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface">On Sale</span>
      </>
    )
  if (e.salesStatus === 'soldOut')
    return <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-error">Sold Out</span>
  return (
    <>
      <Icon name="schedule" className="text-[14px] text-primary" />
      <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">Coming Soon</span>
    </>
  )
}

/** Large hero card at the top of Discover. */
export function FeaturedCard({ e }: { e: EventItem }) {
  return (
    <section className="px-gutter pb-space-md pt-space-xs">
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low shadow-xl">
        <Poster src={e.poster} title={e.title} className="h-80 w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/80 via-transparent to-transparent" />
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 font-label-sm text-label-sm uppercase tracking-wider text-primary backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Featured
          </span>
          <BookmarkButton
            id={e.id}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest/80 text-primary-fixed shadow-md backdrop-blur-md transition-transform active:scale-95"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1.5 p-space-md">
          <div className="flex items-center gap-2">
            {e.category ? (
              <>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">{e.category}</span>
                <span className="h-1 w-1 rounded-full bg-outline" />
              </>
            ) : null}
            <span className="line-clamp-1 font-label-sm text-label-sm text-tertiary">{venueLine(e)}</span>
          </div>
          <h2 className="line-clamp-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{e.title}</h2>
          {e.summary ? (
            <p className="line-clamp-2 pr-4 font-body-sm text-body-sm text-on-surface-variant">{e.summary}</p>
          ) : null}
          <div className="mt-1 flex items-center justify-between gap-space-sm pt-2">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Admission</span>
              <span className="font-headline-sm text-headline-sm text-primary">{fromLabel(e)}</span>
            </div>
            <Link
              to={`/events/${e.slug}`}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-lg text-label-lg text-on-primary shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-transform hover:bg-primary-fixed active:scale-95"
            >
              <span>{isOnSale(e) ? 'Reserve Now' : 'View Event'}</span>
              <Icon name="confirmation_number" className="text-[18px]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Standard event card used in lists. */
export function EventCard({ e }: { e: EventItem }) {
  const cta = e.salesStatus === 'onSale' ? 'Book Tickets' : e.salesStatus === 'soldOut' ? 'Sold Out' : 'Details'
  return (
    <article className="relative overflow-hidden rounded-xl bg-surface-container shadow-lg transition-transform active:scale-[0.99]">
      <Link to={`/events/${e.slug}`} className="block">
        <Poster src={e.poster} title={e.title} className="h-56 w-full" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-t from-surface-container via-surface-container/30 to-transparent" />
      </Link>
      <div className="pointer-events-none absolute left-3 top-3 flex h-14 w-12 flex-col items-center justify-center rounded-lg bg-surface-container-lowest/90 text-center shadow-md backdrop-blur-md">
        {e.startsAt ? (
          <>
            <span className="font-headline-sm text-headline-sm font-bold leading-tight text-primary">{dayNum(e.startsAt)}</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{monthShort(e.startsAt)}</span>
          </>
        ) : (
          <>
            <span className="font-headline-sm text-headline-sm font-bold leading-tight text-secondary">TBA</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Date</span>
          </>
        )}
      </div>
      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-surface-container-lowest/80 px-2.5 py-1 shadow-sm backdrop-blur-md">
        <StatusTag e={e} />
      </div>

      <div className="flex flex-col gap-space-xs p-space-md">
        <div className="flex items-center gap-2">
          {e.category ? (
            <span className="rounded bg-surface-container-highest px-2 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              {e.category}
            </span>
          ) : null}
          {e.startsAt ? (
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
              <Icon name="schedule" className="text-[14px] text-primary" />
              {timeOf(e.startsAt)} {zoneLabel(e.startsAt)}
            </span>
          ) : null}
        </div>
        <Link to={`/events/${e.slug}`}>
          <h4 className="mt-0.5 line-clamp-1 font-headline-md text-headline-md text-on-surface">{e.title}</h4>
        </Link>
        {e.summary ? <p className="line-clamp-1 font-body-sm text-body-sm text-on-surface-variant">{e.summary}</p> : null}
        <div className="flex items-center gap-1.5 py-1 text-on-surface-variant">
          <Icon name="location_on" className="text-[18px] text-primary" />
          <span className="truncate font-body-sm text-body-sm">{venueLine(e)}</span>
        </div>
        <div className="my-2 h-px w-full bg-surface-container-highest" />
        <div className="flex items-center justify-between pt-0.5">
          <div>
            <span className="block font-label-sm text-label-sm uppercase text-outline">
              {e.salesStatus === 'onSale' ? 'Passes starting at' : 'Admission'}
            </span>
            <span className="font-headline-sm text-headline-sm text-primary">{fromLabel(e)}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton
              id={e.id}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-colors hover:text-primary active:scale-95"
            />
            <Link
              to={`/events/${e.slug}`}
              className={`rounded-lg px-4 py-2 font-label-md text-label-md shadow-md transition-all active:scale-95 ${
                e.salesStatus === 'onSale'
                  ? 'bg-primary text-on-primary hover:bg-primary-fixed'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

