import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EventCard } from '../components/EventCards'
import { CheckIcon, ChatIcon, SpeakerIcon } from '../components/icons'
import { BottomNav, COLUMN, DetailHeader } from '../components/Layout'
import { Notice } from '../components/ui'
import { announceJoin, joinKey, useCommunities, useOrganisations } from '../lib/communities'
import { useEvents } from '../lib/EventsContext'
import { isUpcoming } from '../lib/format'
import { setCommunityTracks, useMusicBus } from '../lib/musicBus'
import { fetchMembers } from '../lib/api'
import { getVisitor, useJoined } from '../lib/storage'

export default function CommunityPage({ kind = 'community' }: { kind?: 'community' | 'organisation' }) {
  const { slug = '' } = useParams()
  const isOrg = kind === 'organisation'
  const communities = useCommunities()
  const orgs = useOrganisations()
  const c = (isOrg ? orgs.list : communities).find((x) => x.slug === slug)
  const back = isOrg ? '/organisations' : '/communities'
  const { events } = useEvents()
  const { isJoined, toggle } = useJoined()
  const bus = useMusicBus()

  // while this page is open, the community's songs replace the app music
  const songKey = c?.songs.join('|') ?? ''
  useEffect(() => {
    if (!c || !c.songs.length) return
    setCommunityTracks(c.songs)
    return () => setCommunityTracks(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songKey])

  const joined = c ? isJoined(joinKey(c)) : false
  const [people, setPeople] = useState<{ count: number; members: string[] } | null>(null)
  useEffect(() => {
    const email = getVisitor()?.email
    if (!c || !joined || !email) {
      setPeople(null)
      return
    }
    let stop = false
    const t = setTimeout(() => {
      fetchMembers(isOrg ? 'organisation' : 'community', c.slug, email).then((r) => {
        if (!stop) setPeople(r)
      })
    }, 900)
    return () => {
      stop = true
      clearTimeout(t)
    }
  }, [joined, isOrg, c?.slug])

  if (!c)
    return (
      <>
        <DetailHeader title={isOrg ? 'Organisation' : 'Community'} />
        <main className={`${COLUMN} min-h-screen pb-24 pt-16`}>
          <div className="px-gutter pt-space-lg">
            <Notice icon="explore_off" title={isOrg ? 'Organisation not found' : 'Community not found'}>
              This {isOrg ? 'organisation' : 'community'} is not available. <Link to={back} className="text-primary underline">See all</Link>
            </Notice>
          </div>
        </main>
        <BottomNav />
      </>
    )

  const key = joinKey(c)
  const upcoming = events.filter((e) => (isOrg ? e.organisation : e.community) === c.slug && isUpcoming(e.startsAt, e.endsAt))
  const hasSongs = c.songs.length > 0

  return (
    <>
      <DetailHeader title={c.name} />
      <main className={`${COLUMN} min-h-screen pb-24 pt-16`}>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1f3560] via-surface-container to-surface px-gutter pb-space-lg pt-space-lg">
          {c.cover ? <img src={c.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" /> : null}
          <div className="relative flex flex-col gap-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">{isOrg ? 'Organisation' : 'Community'}</span>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile leading-tight text-on-surface">
              {isOrg ? <span className="text-primary">{c.name}</span> : <>{c.name} <span className="text-primary">Community</span></>}
            </h1>
            {c.description ? <p className="font-body-md text-body-md text-on-surface-variant">{c.description}</p> : null}
          </div>
        </section>

        {hasSongs ? (
          <div className="relative z-10 mx-gutter -mt-space-md flex items-center gap-space-sm rounded-2xl border border-primary/35 bg-surface-container p-space-sm shadow-xl">
            <div className="flex h-11 w-11 shrink-0 items-end justify-center gap-[3px] rounded-xl bg-gradient-to-br from-primary to-[#a88512] pb-3" aria-hidden>
              {[18, 26, 14, 22].map((h, i) => (
                <i
                  key={i}
                  className="w-1 origin-bottom rounded-sm bg-[#3c2f00]"
                  style={{ height: bus.on ? h : 8, transition: 'height .3s', animation: bus.on ? `eq 0.9s ${i * 0.15}s ease-in-out infinite alternate` : 'none' }}
                />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label-sm text-label-sm uppercase tracking-[0.14em] text-secondary">{bus.on ? 'Now playing' : 'Paused'}</p>
              <p className="truncate font-label-lg text-label-lg text-on-surface">{c.name} songs</p>
            </div>
            <button
              type="button"
              onClick={() => bus.toggle?.()}
              disabled={!bus.toggle}
              aria-label={bus.on ? 'Pause the songs' : 'Play the songs'}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/60 text-white active:scale-95 disabled:opacity-40"
            >
              {bus.on ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
                </svg>
              )}
            </button>
          </div>
        ) : null}

        <div className="flex gap-space-sm px-gutter pt-space-md">
          <button
            type="button"
            onClick={() => {
              if (toggle(key)) announceJoin(c)
            }}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg font-label-lg text-label-lg active:scale-[0.98] ${
              joined ? 'border-[1.5px] border-primary/60 text-primary' : 'bg-primary text-on-primary shadow-[0_4px_16px_rgba(212,175,55,0.35)]'
            }`}
          >
            {joined ? (
              <>
                <CheckIcon width={18} height={18} /> Joined
              </>
            ) : (
              isOrg ? 'Join organisation' : 'Join community'
            )}
          </button>
          {c.groupLink ? (
            <a
              href={c.groupLink}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primary/60 font-label-lg text-label-lg text-primary active:scale-[0.98]"
            >
              <ChatIcon width={18} height={18} /> Group chat
            </a>
          ) : (
            <div
              aria-disabled="true"
              className="flex h-12 flex-1 flex-col items-center justify-center rounded-lg border-[1.5px] border-outline-variant text-on-surface-variant"
            >
              <span className="flex items-center gap-2 font-label-lg text-label-lg">
                <ChatIcon width={18} height={18} /> Group chat
              </span>
              <span className="font-label-sm text-label-sm">Opens soon</span>
            </div>
          )}
        </div>

        {isOrg && (c.city || (c.links && Object.keys(c.links).length)) ? (
          <div className="flex flex-wrap items-center gap-space-xs px-gutter pt-space-md">
            {c.city ? <span className="mr-1 font-label-md text-label-md text-on-surface-variant">{c.city}</span> : null}
            {(
              [
                ['website', 'Website'],
                ['youtube', 'YouTube'],
                ['instagram', 'Instagram'],
                ['facebook', 'Facebook'],
              ] as const
            ).map(([k, label]) =>
              c.links?.[k] ? (
                <a
                  key={k}
                  href={c.links[k]}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-primary/40 px-3 py-1.5 font-label-md text-label-md text-primary active:scale-95"
                >
                  {label} &#8599;
                </a>
              ) : null,
            )}
          </div>
        ) : null}

        {c.announcement ? (
          <div className="mx-gutter mt-space-md flex items-start gap-space-sm rounded-2xl border border-dashed border-primary/35 bg-surface-container-low p-space-sm">
            <SpeakerIcon className="mt-0.5 shrink-0 text-primary" />
            <p className="font-body-sm text-body-sm text-on-surface">
              <b>Announcement</b> · {c.announcement}
            </p>
          </div>
        ) : null}

        {joined && people && people.count > 0 ? (
          <section className="px-gutter pt-space-lg">
            <h2 className="pb-space-sm font-headline-md text-headline-md text-on-surface">
              Members <span className="font-label-md text-label-md text-on-surface-variant">· {people.count}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {people.members.map((m, i) => (
                <span key={`${m}-${i}`} className="flex items-center gap-2 rounded-full bg-surface-container py-1 pl-1 pr-3 font-label-md text-label-md text-on-surface">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-primary">{m.charAt(0).toUpperCase()}</span>
                  {m}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="px-gutter pt-space-lg">
          <h2 className="pb-space-sm font-headline-md text-headline-md text-on-surface">{isOrg ? `Events by ${c.name}` : `Upcoming for ${c.name}`}</h2>
          {upcoming.length ? (
            <div className="flex flex-col gap-space-md">
              {upcoming.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          ) : (
            <Notice icon="event" title="No events yet">
              {isOrg ? 'Events from this organisation' : `${c.name} events`} will appear here. <Link to="/events" className="text-primary underline">See all events</Link>
            </Notice>
          )}
        </section>
      </main>
      <BottomNav />
    </>
  )
}
