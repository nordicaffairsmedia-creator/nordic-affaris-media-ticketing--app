const trim = (v: string | undefined) => (v ?? '').trim().replace(/\/$/, '')

const rawCms = trim(import.meta.env.VITE_CMS_URL)
const rawApi = trim(import.meta.env.VITE_API_URL)

/** Website (Next.js + Payload CMS). Events are read from `${CMS_URL}/api/events`. */
export const CMS_URL = import.meta.env.DEV && rawCms ? '/cms-proxy' : rawCms
/** Booking API (apps/api): availability, checkout, tickets, My Bookings. */
export const API_URL = import.meta.env.DEV && rawApi ? '/api-proxy' : rawApi
/** Public website, used for links such as terms, privacy and contact. */
export const SITE_URL = trim(import.meta.env.VITE_SITE_URL) || rawCms

export const configured = Boolean(rawCms && rawApi)

/** Events are listed and sold in Swedish time. */
export const TIME_ZONE = 'Europe/Stockholm'
