import { useCallback, useEffect, useState } from 'react'

/** localStorage can be blocked (private mode) – never let that break the app. */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

const SAVED_KEY = 'nam.saved'
const SESSION_KEY = 'nam.session'

function readSaved(): string[] {
  try {
    const v = JSON.parse(read(SAVED_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Bookmarked events (stored on this device only). */
export function useSaved() {
  const [saved, setSaved] = useState<string[]>(readSaved)
  useEffect(() => {
    const on = () => setSaved(readSaved())
    window.addEventListener('nam-saved', on)
    window.addEventListener('storage', on)
    return () => {
      window.removeEventListener('nam-saved', on)
      window.removeEventListener('storage', on)
    }
  }, [])
  const toggle = useCallback((id: string) => {
    const now = readSaved()
    const next = now.includes(id) ? now.filter((x) => x !== id) : [...now, id]
    write(SAVED_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('nam-saved'))
  }, [])
  return { saved, isSaved: (id: string) => saved.includes(id), toggle }
}

export type Session = { token: string; email: string }

export const getSession = (): Session | null => {
  try {
    const v = JSON.parse(read(SESSION_KEY) ?? 'null')
    return v && typeof v.token === 'string' && typeof v.email === 'string' ? v : null
  } catch {
    return null
  }
}
export const setSession = (s: Session | null) => {
  write(SESSION_KEY, s ? JSON.stringify(s) : null)
  window.dispatchEvent(new Event('nam-session'))
}

export function useSession() {
  const [session, set] = useState<Session | null>(getSession)
  useEffect(() => {
    const on = () => set(getSession())
    window.addEventListener('nam-session', on)
    return () => window.removeEventListener('nam-session', on)
  }, [])
  return session
}

// ---------------------------------------------------------------- visitor details (asked once, before the app opens)

const VISITOR_KEY = 'nam.visitor'

export type Visitor = { name: string; email: string; dial: string; phone: string; sent: boolean }

export const getVisitor = (): Visitor | null => {
  try {
    const v = JSON.parse(read(VISITOR_KEY) ?? 'null')
    if (v && typeof v.name === 'string' && typeof v.email === 'string') {
      return { name: v.name, email: v.email, dial: String(v.dial ?? '+46'), phone: String(v.phone ?? ''), sent: Boolean(v.sent) }
    }
  } catch {
    /* ignore */
  }
  return null
}

export const setVisitor = (v: Visitor | null) => write(VISITOR_KEY, v ? JSON.stringify(v) : null)

/** Full app sign out: forget the details and ticket session, then start again from the details page. */
export function signOutApp() {
  setVisitor(null)
  write(SESSION_KEY, null)
  try {
    sessionStorage.removeItem('nam.welcomed')
  } catch {
    /* ignore */
  }
  window.location.replace('/')
}
