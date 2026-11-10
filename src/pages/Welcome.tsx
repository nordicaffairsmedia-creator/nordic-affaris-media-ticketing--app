import { useEffect, useState } from 'react'

/** Splash shown for a moment when the app opens, then goes straight into the app. */
const SHOW_MS = 2600
const FADE_MS = 450

export default function Welcome({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const a = window.setTimeout(() => setLeaving(true), reduce ? 1200 : SHOW_MS)
    const b = window.setTimeout(onDone, (reduce ? 1200 : SHOW_MS) + FADE_MS)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [onDone])

  return (
    <main
      aria-label="Welcome to Nordic Affairs Media"
      className={`relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-gutter text-center transition-opacity ease-out ${leaving ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-[-6rem] h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-space-md">
        <div className="welcome-rise rounded-[2rem] p-1.5 shadow-2xl shadow-primary/20 ring-1 ring-primary/40">
          <img src="/icon-512.png" alt="Nordic Affairs Media" className="h-40 w-40 rounded-[1.6rem] object-contain" />
        </div>

        <div className="welcome-rise flex flex-col items-center gap-2" style={{ animationDelay: '150ms' }}>
          <span className="font-label-md text-label-md uppercase tracking-[0.3em] text-secondary">Welcome to</span>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface">Nordic Affairs Media</h1>
          <div className="my-1 h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        <div className="welcome-rise mt-2 h-0.5 w-24 overflow-hidden rounded-full bg-surface-container-high" style={{ animationDelay: '300ms' }} aria-hidden>
          <div className="welcome-bar h-full rounded-full bg-primary" style={{ animationDuration: `${SHOW_MS}ms` }} />
        </div>
      </div>
    </main>
  )
}
