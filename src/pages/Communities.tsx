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
          <Notice icon="groups" title="Organisations are coming soon">
            Associations and clubs will appear here.
          </Notice>
        )}
      </div>
    </Page>
  )
}
