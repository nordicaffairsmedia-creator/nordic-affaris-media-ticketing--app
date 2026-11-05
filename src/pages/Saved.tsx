import { Link } from 'react-router-dom'
import { EventCard } from '../components/EventCards'
import { Page } from '../components/Layout'
import { Loading, Notice } from '../components/ui'
import { useEvents } from '../lib/EventsContext'
import { useSaved } from '../lib/storage'

export default function Saved() {
  const { events, loading } = useEvents()
  const { saved } = useSaved()
  const list = events.filter((e) => saved.includes(e.id))
  return (
    <Page title="Saved">
      <div className="px-gutter pb-space-sm pt-space-md">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Saved Events</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Saved on this device only.</p>
      </div>
      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Notice
          icon="bookmark_border"
          title="Nothing saved yet"
          action={
            <Link to="/" className="mt-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary">
              Discover events
            </Link>
          }
        >
          Tap the bookmark on an event to keep it here.
        </Notice>
      ) : (
        <div className="flex flex-col gap-space-md px-gutter pb-space-xl">
          {list.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      )}
    </Page>
  )
}
