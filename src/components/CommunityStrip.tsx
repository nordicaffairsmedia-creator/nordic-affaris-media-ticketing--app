import { Link } from 'react-router-dom'
import { useCommunities } from '../lib/communities'
import { useJoined } from '../lib/storage'
import { ChevronRightIcon } from './icons'

/** Communities on Discover; the ones the visitor joined come first. */
export function CommunityStrip() {
  const list = useCommunities()
  const { isJoined } = useJoined()
  const sorted = [...list].sort((a, b) => Number(isJoined(b.slug)) - Number(isJoined(a.slug)))
  return (
    <section className="pb-space-lg">
      <div className="flex items-end justify-between px-gutter pb-space-sm pt-space-xs">
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Communities</h3>
        <Link to="/communities" className="flex items-center gap-1 pb-1 font-label-md text-label-md text-primary">
          See all <ChevronRightIcon width={16} height={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-space-sm px-gutter">
        {sorted.map((c) => (
          <Link
            key={c.slug}
            to={`/communities/${c.slug}`}
            className="flex items-center rounded-2xl border border-primary/20 bg-surface-container p-space-md transition-transform active:scale-[0.97]"
          >
            <div className="min-w-0">
              <p className="truncate font-label-lg text-label-lg text-on-surface">{c.name}</p>
              <p className="font-label-sm text-label-sm text-secondary">{isJoined(c.slug) ? 'Joined' : '♪ Open'}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
