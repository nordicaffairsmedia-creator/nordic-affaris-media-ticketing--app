import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { BackgroundMusic } from './components/BackgroundMusic'
import { Page } from './components/Layout'
import { Notice } from './components/ui'
import { EventsProvider } from './lib/EventsContext'
import Calendar from './pages/Calendar'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import Discover from './pages/Discover'
import EventDetails from './pages/EventDetails'
import Saved from './pages/Saved'
import Tickets from './pages/Tickets'
import Welcome from './pages/Welcome'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** The booking API's return links look like /en/booking/confirmation – drop the language prefix. */
function StripLocale() {
  const { '*': rest = '' } = useParams()
  const { search } = useLocation()
  return <Navigate to={`/${rest}${search}`} replace />
}

const WELCOME_KEY = 'nam.welcomed'
const seenWelcome = () => {
  try {
    return sessionStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return false
  }
}

/** The first screen of a visit: logo and welcome message for a moment, then straight into the app. Links to other pages skip it. */
function Home() {
  const [entered, setEntered] = useState(seenWelcome)
  const done = useCallback(() => {
    try {
      sessionStorage.setItem(WELCOME_KEY, '1')
    } catch {
      /* ignore */
    }
    setEntered(true)
  }, [])
  if (entered) return <Discover />
  return <Welcome onDone={done} />
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <BackgroundMusic />
      <EventsProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Calendar />} />
          <Route path="/events/:slug" element={<EventDetails />} />
          <Route path="/events/:slug/checkout" element={<Checkout />} />
          <Route path="/booking/confirmation" element={<Confirmation />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/saved" element={<Saved />} />
          {['en', 'sv', 'ta', 'ml'].map((l) => (
            <Route key={l} path={`/${l}/*`} element={<StripLocale />} />
          ))}
          <Route
            path="*"
            element={
              <Page title="Not found">
                <Notice icon="explore_off" title="Page not found">That page does not exist.</Notice>
              </Page>
            }
          />
        </Routes>
      </EventsProvider>
    </BrowserRouter>
  )
}
