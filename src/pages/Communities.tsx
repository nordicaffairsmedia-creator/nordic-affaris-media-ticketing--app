import { Link } from 'react-router-dom'
import { CommunityCard } from '../components/CommunityCard'
import { Page } from '../components/Layout'
import { Loading, Notice } from '../components/ui'
import { joinKey, useCommunities, useOrganisations } from '../lib/communities'
import { useJoined } from '../lib/storage'

/** "Connect": the communities, and (second tab) the organisations. */
export default function Communities({ kind = 'community' }: { kind?: 'community' | 'organisation' }) {
  const communities = useCommunities()
  const orgs = useOrganisations()
  const { isJoined } = useJoined()
  const isOrg = kind === 'organisation'
  const list = isOrg ? orgs.list : communities

  return (
    <Page title="Connect">
      <div className="flex flex-col gap-space-sm px-gutter pt-space-md">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight text-primary">Connect</h1>
        <div className="flex rounded-xl bg-surface-container-lowest p-1" role="tablist">
          {(
            [
              ['/communities', 'Communities', !isOrg],
              ['/organisations', 'Organisations', isOrg],
            ] as const
          ).map(([to, label, on]) => (
            <Link
              key={to}
              to={to}
              replace
              role="tab"
              aria-selected={on}
              className={`flex flex-1 items-center justify-center rounded-lg py-2 font-label-md text-label-md transition-all ${
                on ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-space-sm px-gutter pt-space-md">
        {isOrg && orgs.loading ? (
          <Loading />
        ) : list.length ? (
          list.map((c) => <CommunityCard key={`${c.kind}-${c.slug}`} c={c} joined={isJoined(joinKey(c))} />)
        ) : (
          <Notice icon="groups" title="Organisations are coming soon">
            Associations and clubs will appear here.
          </Notice>
        )}
      </div>
    </Page>
  )
}
