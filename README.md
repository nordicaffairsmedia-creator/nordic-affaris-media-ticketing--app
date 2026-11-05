# Nordic Affairs – Tickets (customer booking app)

Standalone, no-login customer app (Nocturne Royale design): Discover, Event details, Checkout (Stripe), Digital ticket passes, My Bookings (email one-time code), Saved events.

## Run
```
npm install
cp .env.example .env     # set the 3 URLs
npm run dev              # http://localhost:5173
npm run build            # output in dist/
```

## Environment
- `VITE_CMS_URL`  – Payload CMS base URL (events)
- `VITE_API_URL`  – booking API base URL
- `VITE_SITE_URL` – main website (concierge + reserved-seating links)

## Deploy
Static site (Vercel / Render / Netlify). `vercel.json` and `public/_redirects` already provide the SPA rewrite.

## Required after deploy
1. Add the new site origin to the API `ALLOWED_ORIGINS` (Stripe return URL uses it).
2. Add the same origin to the CMS CORS list (`allowedOrigins()`).

## Notes
- English only. Reserved-seating events open the main website (no seat map here).
- Sales/refund statistics are intentionally not in this public app; keep them behind `/staff` login.

## Events without CORS (Vercel)
`vercel.json` forwards `/cms/*` to the website, so the browser reads events from the app's own address (no CORS needed).
Set `VITE_CMS_URL=/cms` on Vercel (instead of the full website address) and redeploy.
If your website address is not `https://nordicaffairsmedia.com`, change the `destination` in `vercel.json`.
