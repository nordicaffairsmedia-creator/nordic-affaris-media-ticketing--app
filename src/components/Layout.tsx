import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Icon } from './ui'

/** Every page sits in a centred phone-width column; on desktop it simply floats in the middle. */
export const COLUMN = 'mx-auto w-full max-w-xl'

export function Header({ title }: { title?: string }) {
  return (
    <header className="fixed top-0 z-50 w-full bg-surface/80 pt-safe backdrop-blur-xl">
      <div className={`${COLUMN} flex h-16 items-center justify-between gap-space-sm px-gutter`}>
        <Link to="/" className="flex items-center gap-space-sm">
          <img src="/icon-512.png" alt="Nordic Affairs" className="h-9 w-9 rounded-lg object-contain" />
          <div className="flex flex-col">
            {title ? (
              <>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Nordic Affairs</span>
                <span className="line-clamp-1 font-headline-sm text-headline-sm text-on-surface">{title}</span>
              </>
            ) : (
              <span className="font-headline-sm text-headline-sm text-on-surface">Nordic Affairs Media</span>
            )}
          </div>
        </Link>
        <Link
          to="/tickets"
          aria-label="My bookings"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface-container-high text-primary transition-opacity hover:opacity-90"
        >
          <Icon name="person" className="text-[22px]" />
        </Link>
      </div>
    </header>
  )
}

/** Header with a back arrow, used on event, checkout and confirmation pages. */
export function DetailHeader({ title, right }: { title: string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="fixed top-0 z-50 w-full bg-surface/80 pt-safe backdrop-blur-xl">
      <div className={`${COLUMN} flex h-16 items-center justify-between gap-space-sm px-gutter`}>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}
          aria-label="Back"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-on-surface hover:text-primary"
        >
          <Icon name="arrow_back" />
        </button>
        <span className="line-clamp-1 flex-1 text-center font-headline-sm text-headline-sm text-on-surface">{title}</span>
        <div className="flex min-w-[44px] items-center justify-end gap-1">{right}</div>
      </div>
    </header>
  )
}

const TABS = [
  { to: '/', label: 'Discover', icon: 'explore', end: true },
  { to: '/events', label: 'Events', icon: 'calendar_month', end: false },
  { to: '/tickets', label: 'Tickets', icon: 'confirmation_number', end: false },
  { to: '/saved', label: 'Saved', icon: 'bookmark', end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-40 w-full bg-surface-container/95 pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className={`${COLUMN} flex h-16 items-stretch justify-around`}>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex min-w-[64px] flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={t.icon} fill={isActive} className="text-[24px]" />
                <span className="font-label-sm text-label-sm">{t.label}</span>
                {isActive ? <span className="h-1 w-1 rounded-full bg-primary" /> : <span className="h-1 w-1" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** Standard page: header, scrolling content, bottom tabs. */
export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <>
      <Header title={title} />
      <main className={`${COLUMN} min-h-screen pb-24 pt-16`}>{children}</main>
      <BottomNav />
    </>
  )
}
