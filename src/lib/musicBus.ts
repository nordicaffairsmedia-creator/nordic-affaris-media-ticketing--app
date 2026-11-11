import { useSyncExternalStore } from 'react'

/**
 * Lets a community page take over the background music while it is open, and shows the player's state
 * (playing or paused) to the page's "Now playing" bar.
 */
type State = { tracks: string[] | null; on: boolean; toggle: (() => void) | null }

let state: State = { tracks: null, on: false, toggle: null }
const subs = new Set<() => void>()
const emit = () => {
  state = { ...state }
  subs.forEach((f) => f())
}

export function setCommunityTracks(tracks: string[] | null) {
  const next = tracks && tracks.length ? tracks : null
  if (JSON.stringify(next) === JSON.stringify(state.tracks)) return
  state.tracks = next
  emit()
}

export function setMusicState(on: boolean, toggle: (() => void) | null) {
  if (state.on === on && state.toggle === toggle) return
  state.on = on
  state.toggle = toggle
  emit()
}

export const useMusicBus = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => state,
  )
