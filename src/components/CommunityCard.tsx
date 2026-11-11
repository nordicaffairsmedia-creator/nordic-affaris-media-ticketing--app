import { Link } from 'react-router-dom'
import type { Community } from '../lib/types'

/** Tile with a few letters of the community language. */
export function ScriptTile({ c, size = 62 }: { c: Community; size?: number }) {
  const tone = c.accent === 'blue' ? 'from-tertiary-container to-[#4d6fd0] text-surface' : 'from-primary to-[#a88512] text-[#2a2000]'
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-[18px] bg-gradient-to-br font-semibold ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden
    >
      {c.script || c.name.slice(0, 2)}
    </div>
  )
}

/** One community on the Communities screen. */
export function CommunityCard({ c, joined }: { c: Community; joined: boolean }) {
  return (
    <Link
      to={`/communities/${c.slug}`}
      className="flex items-center gap-space-md rounded-[22px] border border-primary/20 bg-gradient-to-br from-surface-container to-surface-container-low p-space-sm pr-space-md transition-transform active:scale-[0.98]"
    >
      <ScriptTile c={c} />
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
