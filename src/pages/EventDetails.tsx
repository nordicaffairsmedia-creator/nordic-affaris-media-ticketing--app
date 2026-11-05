import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BottomNavSpacer } from './shared'
import { COLUMN, DetailHeader } from '../components/Layout'
import { GoldButton, Icon, Loading, Notice, Poster } from '../components/ui'
import { fetchAvailability } from '../lib/api'
import { SITE_URL } from '../lib/config'
import { LANGUAGE_NAMES, venueLine } from '../lib/events'
import { dateWithWeekday, mapsLink, money, timeOf, dayNum, monthShort, zoneLabel } from '../lib/format'
import { useEvents } from '../lib/EventsContext'
import { useSaved } from '../lib/storage'
import type { Availability, EventItem, Tier } from '../lib/types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function tierState(t: Tier, a: Availability | null) {
  const row = a?.tiers.find((x) => x.tierId === t.tierId)
  if (!a) return { selectable: false, label: 'Checking availability…', tone: 'muted' as const, remaining: 0 }
  if (!row || !row.onSale) return { selectable: false, label: 'Not on sale right now', tone: 'muted' as const, remaining: 0 }
  if (row.remaining <= 0) return { selectable: false, label: 'Sold out', tone: 'bad' as const, remaining: 0 }
  if (row.remaining <= 20)
    return { selectable: true, label: `${row.remaining} ${row.remaining === 1 ? 'ticket' : 'tickets'} remaining`, tone: 'warn' as const, remaining: row.remaining }
  return { selectable: true, label: 'Available', tone: 'ok' as const, remaining: row.remaining }
}

export default function EventDetails() {
  const { slug = '' } = useParams()
  const nav = useNavigate()
  const { events, loading } = useEvents()
  const event: EventItem | undefined = useMemo(() => events.find((e) => e.slug === slug), [events, slug])
  const [avail, setAvail] = useState<Availability | null>(null)
  const [availFailed, setAvailFailed] = useState(false)
  const [tierId, setTierId] = useState('')
  const [qty, setQty] = useState(1)
  const [more, setMore] = useState(false)
  const { isSaved, toggle } = useSaved()

  useEffect(() => {
    if (!event) return
    let live = true
    setAvail(null)
    setAvailFailed(false)
    fetchAvailability(event.id)
      .then((a) => live && setAvail(a))
      .catch(() => live && setAvailFailed(true))
    return () => {
      live = false
    }
  }, [event])

  // Pre-select the first pass that can be bought.
  useEffect(() => {
    if (!event || !avail || tierId) return
    const first = event.tiers.find((t) => tierState(t, avail).selectable)
    if (first) setTierId(first.tierId)
  }, [event, avail, tierId])

  if (loading && !event) return (<><DetailHeader title="Event" /><main className={`${COLUMN} pt-16`}><Loading /></main></>)
  if (!event)
    return (
      <>
        <DetailHeader title="Event" />
        <main className={`${COLUMN} pt-16`}>
          <Notice icon="event_busy" title="Event not found" action={<Link to="/" className="mt-2 rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary">Back to events</Link>}>
            It may have ended or been removed.
          </Notice>
        </main>
      </>
    )

  const tier = event.tiers.find((t) => t.tierId === tierId)
  const tierSt = tier ? tierState(tier, avail) : null
  const maxQty = Math.max(1, Math.min(avail?.maxPerOrder ?? event.maxPerOrder, tierSt?.remaining ?? 1))
  const canBuy = event.salesStatus === 'onSale' && avail?.onSale !== false && Boolean(tier && tierSt?.selectable)
  const seatsOnWebsite = event.reservedSeating
  const v = event.venue

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: event!.title, url })
      else await navigator.clipboard.writeText(url)
    } catch {
      /* user cancelled */
    }
  }

  const statusNote =
    event.salesStatus === 'soldOut'
      ? 'This event is sold out.'
      : event.salesStatus === 'announced'
        ? 'Tickets are not on sale yet.'
        : avail && avail.onSale === false
          ? 'Ticket sales are currently closed.'
          : null

  return (
    <>
      <DetailHeader
        title={event.title}
        right={
          <>
            <button type="button" aria-label="Save event" aria-pressed={isSaved(event.id)} onClick={() => toggle(event.id)} className="flex h-10 w-10 items-center justify-center rounded-full text-primary-fixed">
              <Icon name={isSaved(event.id) ? 'bookmark' : 'bookmark_border'} fill={isSaved(event.id)} />
            </button>
            <button type="button" aria-label="Share" onClick={share} className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:text-primary">
              <Icon name="share" />
            </button>
          </>
        }
      />
      <main className={`${COLUMN} pb-40 pt-16`}>
        <section className="px-gutter pt-space-sm">
          <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-xl">
            <Poster src={event.poster} title={event.title} className="aspect-[4/5] w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent" />
            {event.startsAt ? (
              <div className="absolute left-3 top-3 flex h-14 w-12 flex-col items-center justify-center rounded-lg bg-surface-container-lowest/90 text-center shadow-md backdrop-blur-md">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{monthShort(event.startsAt)}</span>
                <span className="font-headline-sm text-headline-sm font-bold leading-tight text-primary">{dayNum(event.startsAt)}</span>
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-space-md">
              {event.category ? (
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">{event.category}</span>
              ) : null}
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{event.title}</h1>
              {event.summary ? <p className="font-body-sm text-body-sm text-on-surface-variant">{event.summary}</p> : null}
            </div>
          </div>
        </section>

        <section className="px-gutter pt-space-md">
          <div className="flex flex-col gap-space-md rounded-xl bg-surface-container p-space-md">
            <div className="flex items-start gap-space-sm">
              <Icon name="calendar_month" className="text-primary" />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Date & Schedule</span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">
                  {event.startsAt ? dateWithWeekday(event.startsAt) : 'Date to be announced'}
                </span>
                {event.startsAt ? (
                  <span className="font-body-sm text-body-sm text-secondary">
                    Starts {timeOf(event.startsAt)} {zoneLabel(event.startsAt)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-start gap-space-sm">
              <Icon name="location_on" className="text-primary" />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Venue</span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">{v ? v.name || venueLine(event) : 'Venue to be announced'}</span>
                {v?.address ? <span className="font-body-sm text-body-sm text-on-surface-variant">{v.address}</span> : null}
              </div>
            </div>
            {event.languages.length ? (
              <div className="flex items-start gap-space-sm">
                <Icon name="translate" className="text-primary" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Language</span>
                  <span className="font-body-md text-body-md font-semibold text-on-surface">
                    {event.languages.map((l) => LANGUAGE_NAMES[l] ?? l).join(' · ')}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {event.lineup.length ? (
          <section className="pt-space-lg">
            <div className="flex items-center justify-between px-gutter pb-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Lead Artists & Performers</h2>
              <span className="font-label-sm text-label-sm uppercase text-secondary">{event.lineup.length} {event.lineup.length === 1 ? 'Artist' : 'Artists'}</span>
            </div>
            <div className="no-scrollbar flex gap-space-sm overflow-x-auto px-gutter">
              {event.lineup.map((a, i) => (
                <div key={`${a.name}-${i}`} className="flex w-32 shrink-0 flex-col items-center gap-1 rounded-xl bg-surface-container p-space-sm text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-secondary-container to-surface-container-highest font-headline-md text-headline-md text-primary">
                    {initials(a.name)}
                  </div>
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">{a.name}</span>
                  {a.role ? <span className="font-label-sm text-label-sm uppercase text-secondary">{a.role}</span> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {event.description.length ? (
          <section className="px-gutter pt-space-lg">
            <h2 className="pb-space-sm font-headline-sm text-headline-sm text-on-surface">About The Showcase</h2>
            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-md font-body-md text-body-md text-on-surface-variant">
              {(more ? event.description : event.description.slice(0, 2)).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {event.description.length > 2 ? (
                <button type="button" onClick={() => setMore(!more)} className="flex items-center gap-1 self-start font-label-md text-label-md text-primary">
                  {more ? 'Show Less' : 'Read Full Synopsis'}
                  <Icon name={more ? 'expand_less' : 'expand_more'} className="text-[16px]" />
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {v && (v.lat != null || v.address) ? (
          <section className="px-gutter pt-space-lg">
            <div className="flex items-center justify-between pb-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Venue & Location</h2>
              <span className="font-label-sm text-label-sm uppercase text-secondary">{v.city}</span>
            </div>
            <div className="relative h-44 overflow-hidden rounded-xl bg-surface-container">
              {v.lat != null && v.lng != null ? (
                <iframe
                  title="Map"
                  loading="lazy"
                  className="h-full w-full border-0 opacity-90 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.5)]"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${v.lng - 0.01}%2C${v.lat - 0.006}%2C${v.lng + 0.01}%2C${v.lat + 0.006}&layer=mapnik&marker=${v.lat}%2C${v.lng}`}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-on-surface-variant"><Icon name="map" className="text-[40px]" /></div>
              )}
            </div>
            <a
              href={v.mapUrl ?? mapsLink(`${v.name} ${v.address}`, v.lat, v.lng)}
              target="_blank"
              rel="noreferrer"
              className="mt-space-sm flex items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 py-3 font-label-md text-label-md text-primary"
            >
              <Icon name="near_me" className="text-[18px]" /> Open in Maps
            </a>
          </section>
        ) : null}

        <section className="flex flex-col gap-space-sm px-gutter pt-space-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Available Passes</h2>
            {seatsOnWebsite ? <span className="font-label-sm text-label-sm uppercase text-secondary">Numbered Seating</span> : null}
          </div>
          {statusNote ? <p className="rounded-lg bg-surface-container p-space-sm font-body-sm text-body-sm text-on-surface-variant">{statusNote}</p> : null}
          {availFailed ? (
            <p className="rounded-lg bg-error-container/40 p-space-sm font-body-sm text-body-sm text-on-error-container">
              Could not check ticket availability. Please reload.
            </p>
          ) : null}
          {event.tiers.length === 0 ? (
            <p className="rounded-lg bg-surface-container p-space-sm font-body-sm text-body-sm text-on-surface-variant">Passes will be announced soon.</p>
          ) : (
            <div className="flex flex-col gap-space-sm" role="radiogroup" aria-label="Choose a pass">
              {event.tiers.map((t) => {
                const st = tierState(t, avail)
                const active = t.tierId === tierId
                return (
                  <div
                    key={t.tierId}
                    role="radio"
                    aria-checked={active}
                    aria-disabled={!st.selectable}
                    tabIndex={st.selectable ? 0 : -1}
                    onClick={() => {
                      if (!st.selectable) return
                      setTierId(t.tierId)
                      setQty((q) => Math.min(q, Math.max(1, st.remaining)))
                    }}
                    onKeyDown={(ev) => {
                      if ((ev.key === 'Enter' || ev.key === ' ') && st.selectable) {
                        ev.preventDefault()
                        setTierId(t.tierId)
                      }
                    }}
                    className={`relative rounded-xl p-space-md shadow-md transition-all duration-200 ${
                      active ? 'bg-surface-container shadow-primary/10 ring-1 ring-primary/60' : 'bg-surface-container-low'
                    } ${st.selectable ? 'cursor-pointer' : 'opacity-60'}`}
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="flex min-w-0 items-center gap-space-sm">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${active ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-primary'}`}>
                          <Icon name="confirmation_number" className="text-[20px]" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="font-body-md text-body-md font-semibold text-on-surface">{t.name}</span>
                          {t.description ? <span className="font-body-sm text-body-sm text-on-surface-variant">{t.description}</span> : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-headline-sm text-headline-sm font-bold text-primary">{t.price === 0 ? 'Free' : t.price}</span>
                        {t.price > 0 ? <span className="block font-label-sm text-label-sm uppercase text-on-surface-variant">{event.currency}</span> : null}
                      </div>
                    </div>
                    <div className="mt-space-sm flex items-center justify-between pt-space-xs">
                      <span className={`flex items-center gap-1 font-label-sm text-label-sm ${st.tone === 'bad' ? 'text-error' : st.tone === 'warn' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        <Icon name={st.tone === 'bad' ? 'block' : 'local_activity'} className="text-[14px]" />
                        {st.label}
                      </span>
                      {active && canBuy && !seatsOnWebsite ? (
                        <div className="flex items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                          <button type="button" aria-label="Fewer tickets" disabled={qty <= 1} onClick={() => setQty(qty - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary disabled:opacity-30">
                            <Icon name="remove" className="text-[18px]" />
                          </button>
                          <span className="w-5 text-center font-label-lg text-label-lg text-on-surface" aria-live="polite">{qty}</span>
                          <button type="button" aria-label="More tickets" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary disabled:opacity-30">
                            <Icon name="add" className="text-[18px]" />
                          </button>
                        </div>
                      ) : (
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-primary' : 'bg-surface-container-high'}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-surface-container-lowest' : 'bg-transparent'}`} />
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="px-gutter pt-space-lg">
          <div className="flex items-center justify-between rounded-xl bg-surface-container p-space-md">
            <div className="flex items-center gap-space-sm">
              <Icon name="verified_user" className="text-[28px] text-primary" />
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">100% Authentic Tickets</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Organized by Nordic Affairs Media</span>
              </div>
            </div>
            <Icon name="lock" className="text-[18px] text-on-surface-variant" />
          </div>
        </section>
        <BottomNavSpacer />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-surface-container/95 px-gutter py-space-sm pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className={`${COLUMN} flex items-center justify-between gap-space-md`}>
          <div className="flex min-w-0 flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Current Selection</span>
            {tier ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-md text-headline-md font-bold text-primary">
                    {tier.price === 0 ? 'Free' : money(tier.price * (seatsOnWebsite ? 1 : qty), event.currency)}
                  </span>
                  {tier.price > 0 ? (
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{seatsOnWebsite || qty === 1 ? '/ ticket' : `for ${qty}`}</span>
                  ) : null}
                </div>
                <span className="truncate font-body-sm text-body-sm text-secondary">{tier.name}</span>
              </>
            ) : (
              <span className="font-body-sm text-body-sm text-on-surface-variant">{avail || availFailed ? 'No pass available' : 'Checking…'}</span>
            )}
          </div>
          {seatsOnWebsite ? (
            <a
              href={`${SITE_URL}/en/events/${event.slug}/tickets`}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-secondary to-primary px-5 font-label-lg text-label-lg font-bold text-on-primary shadow-lg shadow-primary/20"
            >
              Choose Seats <Icon name="open_in_new" className="text-[18px]" />
            </a>
          ) : (
            <GoldButton
              disabled={!canBuy}
              className="shrink-0"
              onClick={() => nav(`/events/${event.slug}/checkout?tier=${encodeURIComponent(tierId)}&qty=${qty}`)}
            >
              <span>{event.salesStatus === 'soldOut' ? 'Sold Out' : 'Continue'}</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </GoldButton>
          )}
        </div>
      </div>
    </>
  )
}
