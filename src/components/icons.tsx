import type { SVGProps } from 'react'

/** Small line icons used by the community screens (drawn here so they do not depend on the icon font). */
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const
type P = SVGProps<SVGSVGElement>

export const CalendarIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)
export const PeopleIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <circle cx="17" cy="9.5" r="2.4" />
    <path d="M3.5 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5M15 14.4c2.6-.4 4.7.9 5.5 4.1" />
  </svg>
)
export const TicketIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 8.5a2 2 0 0 1 0 3.5 2 2 0 0 1 0 3.5V17a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 17v-1.5a2 2 0 0 1 0-3.5 2 2 0 0 1 0-3.5V7A1.5 1.5 0 0 0 18.5 5.5h-13A1.5 1.5 0 0 0 4 7z" />
    <path d="M14 6v12" strokeDasharray="1.6 2.4" />
  </svg>
)
export const PhotoIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.7" />
    <path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" />
  </svg>
)
export const ChatIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5.5h16v10.5H9.5L5 20v-4H4z" />
  </svg>
)
export const ArrowRightIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const ChevronRightIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)
export const SpeakerIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 11v2a1 1 0 0 0 1 1h2l5 4V6L7 10H5a1 1 0 0 0-1 1zM16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" />
  </svg>
)
export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
