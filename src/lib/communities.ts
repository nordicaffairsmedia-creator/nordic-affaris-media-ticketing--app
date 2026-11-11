import { useEffect, useState } from 'react'
import { fetchCommunityRecords, normaliseCommunity, postJoin } from './api'
import { configured } from './config'
import { getVisitor } from './storage'
import type { Community } from './types'

/** The five communities every install starts with. The admin (Communities) adds songs, links and more to them. */
const DEFAULTS: Community[] = [
  { slug: 'malayali', name: 'Malayali', script: 'മല', tagline: 'Malayalam songs · events', accent: 'gold', order: 1 },
  { slug: 'tamil', name: 'Tamil', script: 'தமி', tagline: 'Tamil songs · events', accent: 'blue', order: 2 },
  { slug: 'telugu', name: 'Telugu', script: 'తె', tagline: 'Telugu songs · events', accent: 'gold', order: 3 },
  { slug: 'kannada', name: 'Kannada', script: 'ಕನ್', tagline: 'Kannada songs · events', accent: 'blue', order: 4 },
  { slug: 'north-indian', name: 'North Indian', script: 'हिं', tagline: 'Hindi & Punjabi songs · events', accent: 'gold', order: 5 },
].map((d) => ({
  description: '',
  cover: null,
  songs: [],
  groupLink: null,
  announcement: '',
  ...d,
})) as Community[]

let cache: Community[] | null = null
let pending: Promise<Community[]> | null = null

async function load(): Promise<Community[]> {
  const recs = (await fetchCommunityRecords()).map(normaliseCommunity).filter((c): c is NonNullable<typeof c> => !!c)
  const bySlug = new Map(recs.map((r) => [r.slug, r]))
  const out: Community[] = []
  for (const d of DEFAULTS) {
    const r = bySlug.get(d.slug)
    bySlug.delete(d.slug)
    if (!r) out.push(d)
    else if (r.active) out.push({ ...d, ...r, tagline: d.tagline, script: r.script || d.script })
  }
  for (const r of bySlug.values()) if (r.active) out.push({ ...r, tagline: r.tagline || 'Songs · events' })
  return out.sort((a, b) => a.order - b.order)
}

/** Communities for the app: the defaults at once, replaced by the admin's list when it arrives. */
export function useCommunities() {
  const [list, setList] = useState<Community[]>(cache ?? DEFAULTS)
  useEffect(() => {
    if (!configured) return
    let alive = true
    pending ??= load().finally(() => {
      pending = null
    })
    pending.then((l) => {
      cache = l
      if (alive) setList(l)
    })
    return () => {
      alive = false
    }
  }, [])
  return list
}

/** Tells the admin about a new member (best effort). */
export function announceJoin(c: Community) {
  const v = getVisitor()
  if (v) void postJoin(c, { name: v.name, email: v.email })
}
