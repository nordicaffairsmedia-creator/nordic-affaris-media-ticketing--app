import { Link } from 'react-router-dom'
import type { Community } from '../lib/types'

/** One community on the Communities screen. */
export function CommunityCard({ c, joined }: { c: Community; joined: boolean }) {
  return (
    <Link
      to={`/communities/${c.slug}`}
      className="flex items-center gap-space-md rounded-[22px] border border-primary/20 bg-gradient-to-br from-surface-container to-surface-container-low p-space-md transition-transform active:scale-[0.98]"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">{c.name}</h3>
        <p className="mt-0.5 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">♪ {c.tagline}</p>
      </div>
      <span
        className={`shrink-0 rounded-lg border px-4 py-2 font-label-md text-label-md ${
          joined ? 'border-primary bg-primary/15 text-primary' : 'border-primary/60 text-primary'
        }`}
      >
        {joined ? 'Joined' : 'Open'}
      </span>
    </Link>
  )
}
