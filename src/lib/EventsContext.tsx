import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { configured } from './config'
import { fetchEvents } from './api'
import type { EventItem } from './types'

type State = {
  events: EventItem[]
  loading: boolean
  failed: boolean
  reload: () => void
}

const Ctx = createContext<State>({ events: [], loading: true, failed: false, reload: () => undefined })

/** Loads the event list once and shares it with every screen. */
export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(configured)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    if (!configured) return
    setLoading(true)
    setFailed(false)
    fetchEvents()
      .then(setEvents)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return <Ctx.Provider value={{ events, loading, failed, reload: load }}>{children}</Ctx.Provider>
}

export const useEvents = () => useContext(Ctx)
