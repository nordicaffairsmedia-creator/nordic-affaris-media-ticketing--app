import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../components/Layout'
import { GoldButton, Loading, Notice, Poster } from '../components/ui'
import { fromLabel, venueLine } from '../lib/events'
import { dayNum, isUpcoming, monthShort, monthYear, timeOf } from '../lib/format'
import { useEvents } from '../lib/EventsContext'
import type { EventItem } from '../lib/types'

/** The "Events" tab: every upcoming event grouped by month. */
export default function Calendar() {
  const { events, loading, failed, reload } = useEvents()

  const groups = useMemo(() => {
    const map = new Map<string, EventItem[]>()
    for (const e of events.filter((x) => isUpcoming(x.startsAt, x.endsAt))) {
      const key = e.startsAt ? monthYear(e.startsAt) : 'Date to be announced'
      map.set(key, [...(map.get(key) ?? []), e])
    }
    return [...map]
  }, [events])

  return (
    <Page title="Events">
      <div className="px-gutter pb-space-sm pt-space-md">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">Official Schedule</span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Event Calendar</h1>
      </div>
      {loading ? (
        <Loading />
      ) : failed ? (
        <Notice icon="cloud_off" title="Could not load events" action={<GoldButton onClick={reload} className="mt-2 h-10 px-4">Try again</GoldButton>} />
      ) : groups.length === 0 ? (
        <Notice icon="event_busy" title="No upcoming events">New events will be announced soon.</Notice>
      ) : (
        <div className="flex flex-col gap-space-lg px-gutter pb-space-xl">
          {groups.map(([month, list]) => (
            <section key={month} className="flex flex-col gap-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-secondary">{month}</h2>
              {list.map((e) => (
                <Link
                  key={e.id}
                  to={`/events/${e.slug}`}
                  className="flex items-center gap-space-sm rounded-xl bg-surface-container p-space-sm transition-transform active:scale-[0.99]"
                >
                  <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container-lowest text-center">
                    <span className="font-headline-sm text-headline-sm font-bold leading-tight text-primary">
                      {e.startsAt ? dayNum(e.startsAt) : 'TBA'}
                    </span>
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                      {e.startsAt ? monthShort(e.startsAt) : ''}
                    </span>
                  </div>
                  <Poster src={e.poster} title="" className="h-14 w-14 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 font-body-md text-body-md font-semibold text-on-surface">{e.title}</h3>
                    <p className="line-clamp-1 font-body-sm text-body-sm text-on-surface-variant">
                      {e.startsAt ? `${timeOf(e.startsAt)} · ` : ''}
                      {venueLine(e)}
                    </p>
                    <p className="font-label-md text-label-md text-primary">
                      {e.salesStatus === 'soldOut' ? 'Sold out' : fromLabel(e)}
                    </p>
                  </div>
                </Link>
              ))}
            </section>
          ))}
        </div>
      )}
    </Page>
  )
}
