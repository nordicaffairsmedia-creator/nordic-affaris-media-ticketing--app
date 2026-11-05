import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard, FeaturedCard } from '../components/EventCards'
import { Page } from '../components/Layout'
import { Chip, GoldButton, Icon, Loading, Notice } from '../components/ui'
import { configured, SITE_URL } from '../lib/config'
import { isOnSale, matches } from '../lib/events'
import { isUpcoming, monthYear, nextWeekRange, weekendRange } from '../lib/format'
import { useEvents } from '../lib/EventsContext'

type DateFilter = 'all' | 'weekend' | 'nextweek' | string // string = "YYYY-MM"

export default function Discover() {
  const { events, loading, failed, reload } = useEvents()
  const [q, setQ] = useState('')
  const [when, setWhen] = useState<DateFilter>('all')
  const [cat, setCat] = useState('')

  const upcoming = useMemo(() => events.filter((e) => isUpcoming(e.startsAt, e.endsAt)), [events])
  const categories = useMemo(
    () => [...new Set(upcoming.map((e) => e.category).filter((c): c is string => Boolean(c)))],
    [upcoming],
  )
  const months = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of upcoming) {
      if (!e.startsAt) continue
      const key = e.startsAt.slice(0, 7)
      if (!seen.has(key)) seen.set(key, monthYear(e.startsAt))
    }
    return [...seen].slice(0, 4)
  }, [upcoming])

  const list = useMemo(() => {
    return upcoming.filter((e) => {
      if (q && !matches(e, q)) return false
      if (cat && e.category !== cat) return false
      if (when === 'all') return true
      if (!e.startsAt) return false
      const t = new Date(e.startsAt).getTime()
      if (when === 'weekend') {
        const [a, b] = weekendRange()
        return t >= a && t < b
      }
      if (when === 'nextweek') {
        const [a, b] = nextWeekRange()
        return t >= a && t < b
      }
      return e.startsAt.slice(0, 7) === when
    })
  }, [upcoming, q, cat, when])

  const liveCount = upcoming.filter(isOnSale).length
  const featured = list.find(isOnSale) ?? list[0]
  const rest = list.filter((e) => e !== featured)

  if (!configured)
    return (
      <Page>
        <Notice icon="settings" title="App not connected yet">
          Set <code>VITE_CMS_URL</code> and <code>VITE_API_URL</code> (see the README) so events can load.
        </Notice>
      </Page>
    )

  return (
    <Page>
      <div className="flex flex-col gap-space-sm px-gutter pb-space-sm pt-space-md">
        <div className="flex h-12 w-full items-center rounded-lg bg-surface-container px-space-sm shadow-md transition-all focus-within:shadow-[0_0_0_2px_rgba(212,175,55,0.4)]">
          <Icon name="search" className="mr-space-xs text-[20px] text-primary" />
          <input
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder="Search events, artists, venues..."
            aria-label="Search events"
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
          />
          {q ? (
            <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="p-1 text-on-surface-variant hover:text-on-surface">
              <Icon name="close" className="text-[18px]" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <div className="flex items-center gap-1 px-2 py-1 font-label-md text-label-md text-secondary">
            <Icon name="local_activity" className="text-[16px] text-primary" />
            <span>
              {liveCount} {liveCount === 1 ? 'Event' : 'Events'} Live
            </span>
          </div>
        </div>

        <div className="no-scrollbar -mx-gutter flex items-center gap-2 overflow-x-auto px-gutter py-1">
          <Chip active={when === 'all'} onClick={() => setWhen('all')}>All Dates</Chip>
          <Chip active={when === 'weekend'} onClick={() => setWhen('weekend')}>This Weekend</Chip>
          <Chip active={when === 'nextweek'} onClick={() => setWhen('nextweek')}>Next Week</Chip>
          {months.map(([key, label]) => (
            <Chip key={key} active={when === key} onClick={() => setWhen(key)}>{label}</Chip>
          ))}
        </div>

        {categories.length ? (
          <div className="no-scrollbar -mx-gutter flex items-center gap-2 overflow-x-auto px-gutter pb-1">
            {['', ...categories].map((c) => (
              <button
                key={c || 'all'}
                type="button"
                onClick={() => setCat(c)}
                className={`flex-shrink-0 rounded-md px-3 py-1 font-label-sm text-label-sm uppercase tracking-wider transition-colors ${
                  cat === c
                    ? 'bg-surface-container-highest text-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {c ? c : '✦ All Categories'}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {loading ? (
        <Loading label="Loading events…" />
      ) : failed ? (
        <Notice
          icon="cloud_off"
          title="Could not load events"
          action={<GoldButton onClick={reload} className="mt-2 h-10 px-4">Try again</GoldButton>}
        >
          Check your connection and try again.
        </Notice>
      ) : list.length === 0 ? (
        <Notice icon="event_busy" title="No events found">
          {upcoming.length ? 'Try another date or search.' : 'New events will be announced soon.'}
        </Notice>
      ) : (
        <>
          {featured ? <FeaturedCard e={featured} /> : null}
          {rest.length ? (
            <>
              <section className="flex items-end justify-between px-gutter pb-space-sm pt-space-xs">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">Official Schedule</span>
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Upcoming Events</h3>
                </div>
                <Link to="/events" className="font-label-md text-label-md text-secondary underline hover:text-primary">
                  View Calendar
                </Link>
              </section>
              <div className="flex flex-col gap-space-md px-gutter pb-space-xl">
                {rest.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}

      {SITE_URL ? (
        <div className="px-gutter pb-space-lg">
          <div className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon name="support_agent" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Concierge</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Group bookings & enquiries</span>
              </div>
            </div>
            <a
              href={`${SITE_URL}/en/contact`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-surface-container-high px-3 py-2 font-label-md text-label-md text-primary"
            >
              Enquire
            </a>
          </div>
        </div>
      ) : null}
    </Page>
  )
}
