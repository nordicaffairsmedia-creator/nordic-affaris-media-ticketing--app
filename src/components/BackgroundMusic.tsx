import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMusicUrl } from '../lib/api'
import { setMusicState, useMusicBus } from '../lib/musicBus'
import { getVisitor } from '../lib/storage'

const KEY = 'nam-music'

/**
 * Background music of the app: the track ticked "Play in the ticketing app" in the admin (Background music).
 * Phones block sound until the first tap, so it starts on the first touch; the round button
 * at the bottom left pauses and resumes it and remembers the choice.
 */
function Player({ srcs }: { srcs: string[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlocked = useRef(false)
  const userPaused = useRef(false)
  const [on, setOn] = useState(false)
  const [i, setI] = useState(0)
  const firstTrack = useRef(true)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = 0.55
    try {
      userPaused.current = localStorage.getItem(KEY) === 'off'
    } catch {
      /* ignore */
    }
    const sync = () => setOn(!a.paused && !a.muted)
    a.addEventListener('play', sync)
    a.addEventListener('pause', sync)
    a.addEventListener('volumechange', sync)

    const events = ['pointerdown', 'touchstart', 'click', 'keydown'] as const
    const detach = () => events.forEach((e) => window.removeEventListener(e, gesture, true))
    const start = () => {
      if (userPaused.current) return
      a.muted = false
      a.play().then(
        () => {
          unlocked.current = true
          detach()
        },
        () => {
          /* wait for the next gesture */
        },
      )
    }
    function gesture(e: Event) {
      if (unlocked.current || userPaused.current) return
      if (e.target instanceof Element && e.target.closest('[data-music-toggle]')) return
      start()
    }
    events.forEach((e) => window.addEventListener(e, gesture, { capture: true, passive: true }))

    // some browsers allow sound straight away
    if (!userPaused.current) start()

    const onVisible = () => {
      if (document.visibilityState === 'visible' && unlocked.current && a.paused && !userPaused.current) a.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      a.removeEventListener('play', sync)
      a.removeEventListener('pause', sync)
      a.removeEventListener('volumechange', sync)
      document.removeEventListener('visibilitychange', onVisible)
      detach()
    }
  }, [])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (!a.paused && !a.muted) {
      userPaused.current = true
      try {
        localStorage.setItem(KEY, 'off')
      } catch {
        /* ignore */
      }
      a.pause()
    } else {
      userPaused.current = false
      try {
        localStorage.setItem(KEY, 'on')
      } catch {
        /* ignore */
      }
      a.muted = false
      unlocked.current = true
      a.play().catch(() => {})
    }
  }, [])

  // several songs (a community page): when one ends the next starts, and the list loops
  useEffect(() => {
    if (firstTrack.current) {
      firstTrack.current = false
      return
    }
    const a = audioRef.current
    if (a && !userPaused.current) a.play().catch(() => {})
  }, [i])

  // lets a community page show and control the same player
  useEffect(() => {
    setMusicState(on, toggle)
    return () => setMusicState(false, null)
  }, [on, toggle])

  return (
    <>
      <audio
        ref={audioRef}
        src={srcs[i % srcs.length]}
        loop={srcs.length === 1}
        onEnded={() => setI((n) => (n + 1) % srcs.length)}
        preload="auto"
        playsInline
        aria-hidden="true"
        className="hidden"
      />
      <button
        type="button"
        data-music-toggle
        onClick={toggle}
        aria-label={on ? 'Pause background music' : 'Play background music'}
        aria-pressed={on}
        className="fixed z-[60] grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-surface-container/90 text-white shadow-lg backdrop-blur-md active:scale-95"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.875rem)', right: 'max(4.75rem, calc(50% - 13.25rem))' }}
      >
        {on ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        )}
      </button>
    </>
  )
}

/** Waits for the page to finish loading, then looks up the track ticked "Play in the ticketing app" in the admin. None ticked = no player, no button. */
export function BackgroundMusic() {
  const [src, setSrc] = useState<string | null>(null)
  // the music and its button only exist once the visitor has entered their details
  const [entered, setEntered] = useState(() => getVisitor() !== null)
  useEffect(() => {
    const on = () => setEntered(getVisitor() !== null)
    window.addEventListener('nam-visitor', on)
    return () => window.removeEventListener('nam-visitor', on)
  }, [])
  useEffect(() => {
    if (!entered) return
    let alive = true
    const go = () => {
      fetchMusicUrl().then((u) => alive && setSrc(u))
    }
    const t = setTimeout(go, 1200)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [entered])
  // a community page can replace the app music with its own songs while it is open
  const bus = useMusicBus()
  const tracks = bus.tracks ?? (src ? [src] : null)
  return entered && tracks ? <Player key={tracks.join('|')} srcs={tracks} /> : null
}
