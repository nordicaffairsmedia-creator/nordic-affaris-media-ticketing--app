import { Link } from 'react-router-dom'
import { ArrowRightIcon, CalendarIcon, ChevronRightIcon, PeopleIcon, PhotoIcon, TicketIcon } from '../components/icons'
import { getVisitor } from '../lib/storage'

const small = 'flex min-h-[9.25rem] flex-col rounded-[22px] border border-primary/20 bg-gradient-to-br from-surface-container to-surface-container-low p-space-md transition-transform active:scale-[0.97]'

/** Shown once, right after sign-up: tap a card to step into that part of the app. */
export default function Cards({ onSkip }: { onSkip: () => void }) {
  const first = (getVisitor()?.name ?? '').trim().split(/\s+/)[0] || 'there'
  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-background px-gutter pb-space-lg pt-14">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />

      <div className="welcome-rise relative flex items-center gap-space-sm">
        <img src="/icon-512.png" alt="Nordic Affairs Media" width={46} height={46} className="h-[46px] w-[46px] rounded-xl object-contain ring-1 ring-primary/40" />
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-secondary">Nordic Affairs Media</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">You&rsquo;re all set</p>
        </div>
      </div>

      <div className="welcome-rise relative mt-space-lg" style={{ animationDelay: '100ms' }}>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile leading-tight text-on-surface">
          Welcome,
          <br />
          <span className="break-words text-primary">{first}</span>
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">Tap a card to step inside.</p>
      </div>

      <div className="relative mt-space-lg grid grid-cols-2 gap-space-sm">
        <Link
          to="/events"
          className="welcome-rise relative col-span-2 flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-[22px] border border-primary/50 bg-gradient-to-br from-[#3a2f0a] via-surface-container to-surface-container-low p-space-md transition-transform active:scale-[0.98]"
          style={{ animationDelay: '200ms' }}
        >
          <span aria-hidden className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-primary/20" />
          <CalendarIcon width={32} height={32} className="relative text-primary" />
          <div className="relative flex items-end justify-between gap-space-sm">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Upcoming Events</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Concerts &amp; shows · book your tickets</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
              <ArrowRightIcon width={18} height={18} strokeWidth={2.4} />
            </span>
          </div>
        </Link>

        <Link to="/communities" className={`${small} welcome-rise`} style={{ animationDelay: '300ms' }}>
          <PeopleIcon width={32} height={32} className="text-primary" />
          <h2 className="mt-auto pt-space-sm font-headline-sm text-headline-sm text-on-surface">Communities</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Your language, your music</p>
        </Link>

        <Link to="/tickets" className={`${small} welcome-rise`} style={{ animationDelay: '380ms' }}>
          <TicketIcon width={32} height={32} className="text-primary" />
          <h2 className="mt-auto pt-space-sm font-headline-sm text-headline-sm text-on-surface">My Tickets</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Your passes, ready at the gate</p>
        </Link>

        <Link
          to="/#past-events"
          onClick={onSkip}
          className="welcome-rise col-span-2 flex items-center gap-space-md rounded-[22px] border border-primary/20 bg-gradient-to-br from-surface-container to-surface-container-low p-space-md transition-transform active:scale-[0.98]"
          style={{ animationDelay: '460ms' }}
        >
          <PhotoIcon width={32} height={32} className="shrink-0 text-primary" />
          <div className="flex-1">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Past Events</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Relive the best nights</p>
          </div>
          <ChevronRightIcon className="text-primary" />
        </Link>
      </div>

      <button type="button" onClick={onSkip} className="relative mt-auto self-center pt-space-lg font-label-md text-label-md text-on-surface-variant underline">
        Skip to the full app &rsaquo;
      </button>
    </main>
  )
}
