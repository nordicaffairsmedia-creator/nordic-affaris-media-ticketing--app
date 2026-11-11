import { useEffect, useState } from 'react'
import { fetchPastEvents, type PastEvent } from '../lib/api'
import { Icon } from './ui'

/** Past concerts, one under another. Pictures come from the Media library (ticked "Show in the app as a past event"); not for booking. */
export function PastEvents() {
  const [items, setItems] = useState<PastEvent[]>([])
  const [open, setOpen] = useState<PastEvent | null>(null)

  useEffect(() => {
    let alive = true
    fetchPastEvents().then((list) => alive && setItems(list))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // "Past Events" card on the first screen opens Discover at this section
  useEffect(() => {
    if (items.length && window.location.hash === '#past-events') document.getElementById('past-events')?.scrollIntoView()
  }, [items.length])

  if (!items.length) return null

  return (
    <section id="past-events" className="scroll-mt-20 pb-space-lg">
      <div className="px-gutter pb-space-sm pt-space-xs">
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Past Events</h3>
      </div>
      <div className="flex flex-col gap-space-md px-gutter">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setOpen(it)}
            className="w-full overflow-hidden rounded-xl bg-surface-container text-left shadow-lg transition-transform active:scale-[0.98]"
          >
            <div className="aspect-video w-full bg-surface-container-high">
              <img src={it.thumb} alt={it.caption} loading="lazy" className="h-full w-full object-cover" />
            </div>
            {it.caption ? (
              <p className="line-clamp-2 px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant">{it.caption}</p>
            ) : null}
          </button>
        ))}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.caption || 'Past event poster'}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
          >
            <Icon name="close" />
          </button>
          <img src={open.full} alt={open.caption} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
          {open.caption ? <p className="mt-3 text-center font-body-md text-body-md text-on-surface">{open.caption}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
