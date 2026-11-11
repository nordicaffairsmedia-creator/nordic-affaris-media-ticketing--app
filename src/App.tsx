import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { BackgroundMusic } from './components/BackgroundMusic'
import { Page } from './components/Layout'
import { Notice } from './components/ui'
import { EventsProvider } from './lib/EventsContext'
import Calendar from './pages/Calendar'
import Cards from './pages/Cards'
import Communities from './pages/Communities'
import CommunityPage from './pages/CommunityPage'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import Discover from './pages/Discover'
import EventDetails from './pages/EventDetails'
import Saved from './pages/Saved'
import Tickets from './pages/Tickets'
import Register from './pages/Register'
import Welcome from './pages/Welcome'
import { registerVisitor } from './lib/api'
import { getVisitor, setVisitor, type Visitor } from './lib/storage'

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

/** Visitors give name, email and mobile once, before the app opens. The payment return page is never blocked. */
function Gate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [visitor, setV] = useState<Visitor | null>(getVisitor)
  useEffect(() => {
    // details that could not be sent last time (no network): try again now
    if (!visitor || visitor.sent) return
    registerVisitor({ name: visitor.name, email: visitor.email, phone: `${visitor.dial}${visitor.phone}` }).then((ok) => {
      if (!ok) return
      const done = { ...visitor, sent: true }
      setVisitor(done)
      setV(done)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (visitor || pathname.startsWith('/booking/confirmation')) return <>{children}</>
  return <Register onDone={setV} />
}

const guard = (el: ReactNode) => <Gate>{el}</Gate>

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
  const [known] = useState(() => getVisitor() !== null)
  const [cards, setCards] = useState(false)
  // right after signing up: cards to step into the app (once)
  if (cards) return <Cards onSkip={() => setCards(false)} />
  if (entered) return guard(<Discover />)
  // first visit: logo and welcome, then the sign-up form rise in on the same screen
  if (!known)
    return (
      <Register
        intro
        onDone={() => {
          done()
          setCards(true)
        }}
      />
    )
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
          <Route path="/events" element={guard(<Calendar />)} />
          <Route path="/communities" element={guard(<Communities />)} />
          <Route path="/communities/:slug" element={guard(<CommunityPage />)} />
          <Route path="/events/:slug" element={guard(<EventDetails />)} />
          <Route path="/events/:slug/checkout" element={guard(<Checkout />)} />
          <Route path="/booking/confirmation" element={<Confirmation />} />
          <Route path="/tickets" element={guard(<Tickets />)} />
          <Route path="/saved" element={guard(<Saved />)} />
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
