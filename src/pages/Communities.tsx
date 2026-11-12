import { Link } from 'react-router-dom'
import { CommunityCard } from '../components/CommunityCard'
import { Page } from '../components/Layout'
import { Loading, Notice } from '../components/ui'
import { joinKey, useCommunities, useOrganisations } from '../lib/communities'
import { useJoined } from '../lib/storage'

/** Communities tab (kind = community) and Organisations tab (kind = organisation). */
export default function Communities({ kind = 'community' }: { kind?: 'community' | 'organisation' }) {
  const communities = useCommunities()
  const orgs = useOrganisations()
  const { isJoined } = useJoined()
  const isOrg = kind === 'organisation'
  const list = isOrg ? orgs.list : communities

  return (
    <Page title={isOrg ? 'Organisations' : 'Connect'}>
      <div className="flex flex-col gap-space-xs px-gutter pt-space-md">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight text-primary">{isOrg ? 'Organisations' : 'Connect'}</h1>
      </div>

      <div className="flex flex-col gap-space-sm px-gutter pt-space-md">
        {isOrg && orgs.loading ? (
          <Loading />
        ) : list.length ? (
          list.map((c) => <CommunityCard key={`${c.kind}-${c.slug}`} c={c} joined={isJoined(joinKey(c))} />)
        ) : (
          <Notice icon="groups" title="No organisations yet">
            Associations and clubs will appear here.
          </Notice>
        )}

        {isOrg ? (
          <Link
            to="/organisations/register"
            className="mt-space-xs flex items-center gap-space-md rounded-[22px] border border-primary/50 bg-gradient-to-br from-[#3a2f0a] via-surface-container to-surface-container-low p-space-md transition-transform active:scale-[0.98]"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Register your organisation</h3>
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">Add your profile, website and links</p>
            </div>
            <span className="shrink-0 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary">Start</span>
          </Link>
        ) : null}
      </div>
    </Page>
  )
}
