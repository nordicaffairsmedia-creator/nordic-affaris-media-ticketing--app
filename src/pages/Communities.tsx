import { CommunityCard } from '../components/CommunityCard'
import { Page } from '../components/Layout'
import { useCommunities } from '../lib/communities'
import { useJoined } from '../lib/storage'

export default function Communities() {
  const list = useCommunities()
  const { isJoined } = useJoined()
  return (
    <Page title="Communities">
      <div className="flex flex-col gap-space-sm px-gutter pt-space-md">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-surface">
          Find your people.
          <br />
          <span className="text-primary">Hear your music.</span>
        </h1>
      </div>
      <div className="flex flex-col gap-space-sm px-gutter pt-space-md">
        {list.map((c) => (
          <CommunityCard key={c.slug} c={c} joined={isJoined(c.slug)} />
        ))}
      </div>
    </Page>
  )
}
