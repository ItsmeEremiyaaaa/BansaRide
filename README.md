# BansaRide

**A ride and fare guide for Bansalan, Davao del Sur.** It shows where to wait for a tricycle, pedicab, motorcycle, bus, van or mini bus, what the ride costs for a student, a senior or an adult, and where the drivers' groups (BTODA) are. It installs on a phone and keeps working without signal.

## What it does

- **Real map of Bansalan only.** OpenStreetMap, limited to the municipal border, with real streets, barangays and sitios. Zoom-out stops at the whole of Bansalan.
- **Routes inside Bansalan.** About 96 real road routes, plus a route between any two places (joined through the Bus Terminal or Public Market, then replaced by the real road when online). Tricycle and pedicab are the same ride. Farm motorcycles serve the mountain areas.
- **Fares by passenger.** Elementary, high school, college, senior, PWD and adult, with the fare growing by distance.
- **Other towns.** Distance, time and bus, van and mini bus hours and fares for 14 towns and cities (Digos to Cotabato City). No routes outside Bansalan.
- **Drivers and waiting spots.** BTODA groups, street waiting spots, members and contacts where shared, and live distance to the nearest stand.
- **Near me.** Live location with walking directions drawn inside the app (OpenStreetMap, no Google Maps).
- **Accounts (optional).** Sign in with an email link. Verified students, seniors and PWD see their own fare everywhere. Guests can use everything else.
- **Fare reports and tips.** Riders post what they paid and short tips. Names and text are filtered for bad words, links and phone numbers, and posts hidden after three reports.
- **Extras.** Onboarding, Bisaya option, text size, "Report a problem", add to home screen.

## Run it

```bash
npm install
npm run dev        # open http://localhost:5173
npm run build      # production build in dist/
npm run preview    # test the built app, including offline mode
```

Accounts and posts are optional. To switch them on, create a [Supabase](https://supabase.com) project, run `supabase/profiles.sql` and then `supabase/community.sql` in its SQL editor, copy `.env.example` to `.env.local` and fill in the project URL and publishable key.

## Ride alerts (push notifications), one-time setup

Riders can turn on a notice 30 minutes before the first ride and 1 hour before the last ride of the big bus, van and mini bus. It works even when the app is closed (Android, the installed app and the APK).

1. In the Supabase SQL editor, run `supabase/push.sql`.
2. Deploy the function `supabase/functions/send-ride-alerts` (Dashboard > Edge Functions > Deploy a new function, paste `index.ts`; or `supabase functions deploy send-ride-alerts`).
3. Add three secrets (Edge Functions > Secrets): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (an email). Create the key pair with `npx web-push generate-vapid-keys`. Never commit the private key.
4. Put the same public key in `.env.local` and in the host's environment variables as `VITE_VAPID_PUBLIC_KEY`.
5. Schedule it: Integrations > Cron > new job, every 5 minutes (`*/5 * * * *`), run the Edge Function `send-ride-alerts`.

Optional usage counts: run `supabase/stats.sql`.

## What is real and what is not

| Item | Status |
|---|---|
| Places, streets, boundary and map | Real, from OpenStreetMap |
| Road routes and distances | Real, from OSRM |
| Tricycle base fares | Reported by riders |
| Longer fares, bus, van, mini bus | Calculated from a few reported fares. Estimates. |
| Travel times | Estimates from distance and speed |
| Bus, van and mini bus hours | Reported by riders |
| Waiting spots and BTODA groups | Partly confirmed. Others are marked "To confirm". |

Estimates are always labelled in the app. Real fares from riders replace them as they are reported.

## Built with

React 19, Vite, a PWA service worker (offline map tiles), Leaflet, OpenStreetMap, OSRM, Supabase (accounts and posts).

## Project layout

- `src/data.js` places, routes, fares, bus and van data, and helpers
- `src/screens/` the screens (Home, Routes, Map, Drivers, Fares, Menu, Account, Report, Onboarding)
- `scripts/` build scripts that fetch the real OpenStreetMap and OSRM data
- `supabase/` database scripts for accounts, posts and moderation

Map data © OpenStreetMap contributors (ODbL).
