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
