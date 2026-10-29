# BansaRide

Ride and fare guide for Bansalan, Davao del Sur. A React + Vite web app that installs on a phone and works offline.

## Run it

```bash
npm install
npm run dev        # open http://localhost:5173
npm run build      # production build in dist/
npm run preview    # test the built app, including offline mode
```

## What is real and what is not

| Item | Status |
|---|---|
| Place names and locations | Real. From OpenStreetMap. |
| Map | Real OpenStreetMap map (Leaflet). |
| Routes and distances inside Bansalan | Real roads, computed with OSRM. |
| Fares | **Estimates.** Formula in `src/data.js` (`estimateFare`). Confirm at the terminals. |
| Travel times | **Estimates** (about 20 km/h in town). |
| Other-town fares (Digos, Kidapawan, Davao) | **Not confirmed.** Shown as "Ask at the terminal". |
| Waiting spots | Only the Bus Terminal is confirmed on the map. |

Everything the screens show comes from `src/data.js` and `src/geo.js`.

## Removed on purpose

The placeholder drivers list, demo student rides, "My week" and the sample trip-share link were removed because they were not real. They can come back once there is real data and a database (Supabase).

## Make the data real

1. Visit the terminals. Write down real fares, vehicle types, first and last trips and exact waiting spots.
2. Edit `src/data.js`: replace `estimateFare`, set `fare` for each town, add real waiting spots.
3. Popular destinations on Home are listed in `popularIds` in `src/data.js`. Tricycle and pedicab are treated as one ride.
4. Add more places or routes in `scripts/build-geo.mjs`, then run `node scripts/build-geo.mjs` (needs internet). It rewrites `src/geo.js`.
5. When fares are confirmed, remove the "Estimate" tags in the screens.

Rules:
- Routes, maps and waiting spots cover Bansalan only.
- Other towns show distance, travel time and fare only.
- Only list a driver's phone number with the driver's permission.

## Offline

The app and its data are saved on the phone after the first visit. Map pictures (tiles) are saved as people browse, so places already viewed still show offline. Pins and route lines always show. We do not bulk-download tiles because OpenStreetMap's public servers do not allow it. For fully offline maps later, host our own map file.

## Fares and live location

- **Reported by riders** (base fares): elementary student ₱10, high school ₱15, college ₱20, senior citizen ₱15, adult ₱20.
- **The fare goes up with distance.** Reported example: Bansalan to Rizal (3.7 km) is +₱20 for everyone (high school ₱15 becomes ₱35, college ₱20 becomes ₱40). A grandmother says Rizal costs ₱30 to ₱50 in all. So fare = base + ₱7.4 for each km after the first, rounded to the nearest ₱5 (see `fareFor` in `src/data.js`). Rizal gives elementary ₱30, high school ₱35, college ₱40, senior ₱35, adult ₱40. Beyond about 4 km the numbers are extrapolated, so confirm another real fare (for example Linawan) to improve them.
- **Motorcycles:** no fare, ask the driver.
- **Live location:** the app watches the phone's location while it is open (it pauses when the app is in the background). Home shows the 3 nearest waiting spots with distance, direction and walking time; the Map and station pages update the same way. Directions open OpenStreetMap (walking route from the person's position).

## Upland motorcycles and street waiting spots

- Upland places and roads that need a motorcycle are built by `node scripts/build-upland.mjs` (27 routes from the Public Market). Andres Awe, Andagberang and Andangan roads and Ilang-Ilang Street are not in OpenStreetMap: they are placed inside their barangay and marked approximate.
- 41 street and road waiting spots come from the riders (`STREET_SPOTS` in `src/data.js`). Five streets (Nazareno, Jackfruit, Azucena, Quirós, C.M. Recto) have no map position yet and show "location needed".
- St. Therese Elementary School BTODA waits at the end of the road in Nebrada (approximate position).
- Kapatagan (Digos City) and Kaileg (Magsaysay) are outside Bansalan, so they are listed without a route.

## Streets, motorcycles and the map

- **Streets:** all 50 named streets inside the Bansalan border are searchable destinations (from OpenStreetMap). Curvada Street is the local name for Dama de Noche Street. A street has no group of its own: the app shows the nearest drivers' stand and its distance. Rebuild with `node scripts/build-streets.mjs`.
- **Motorcycles** are only for the mountain areas. They stay at the Public Market. The routes (Balutakay, Gagpang, Alegre, Malupo, Pananag, Lacyo, Alo, Alta Vista, Darapuay, Kinuskusan, Balagonon, New Bohol, New Clarin) are real roads from OpenStreetMap; the fare is "ask the driver". Kapatagan (Digos City) and Kaileg (location needed) are listed without a route.
- **Waiting spots:** two exact stands come from OpenStreetMap (a motorcycle stand and a tricycle stand near Via Aldi and J. P. Laurel Streets). To add more exact spots, use the + button on the Map tab: tap where the drivers wait (or use your location), then Copy details and send it to the app maker.
- **Home:** the chip on the map shows where the person is (display only). It says "outside Bansalan" when they are elsewhere.

## Drivers and waiting spots

The Drivers tab lists the tricycle/pedicab groups (BTODA) and the motor pang-bukid stand. They live in `stations` in `src/data.js`.
- SMCBI BTODA has a contact person and its member names (names only). Add names and numbers only with permission.
- Reported by riders: St. Mary's College of Bansalan Inc. BTODA (also called SMCBI BTODA), UM BTODA, Salazar Corp BTODA (placed at JK Salazar Grocery), St. Therese BTODA (no map location yet) and the motor pang-bukid.
- Generated: a BTODA entry at every other place, marked "Group name to confirm". Rename or remove them after checking with the drivers.
- Motor pang-bukid go to Balutakay and New Clarin (real road routes from the Public Market, fare: ask the driver). Kapatagan is in Digos City, outside Bansalan, so it has no route. Names of the other farm corners are still needed.
- Contacts live in `CONTACTS` in `src/data.js`. Add a phone number only with the person's permission, because the app is public.

## Other towns

13 towns and cities (all 9 Davao del Sur municipalities plus Davao City, Kidapawan, General Santos and Cotabato City) show real road distances from the Bus Terminal. Travel times are estimates (about 1.4x car time). Fares are not confirmed: set them in `FARES` in `src/data.js`. Add or change towns in `scripts/build-towns.mjs`, then run `node scripts/build-towns.mjs`.

## Map limits

The map is limited to Bansalan, Davao del Sur: it cannot be panned away, the area outside the municipal border is dimmed, and barangay names show from zoom 13. The border and barangay names come from OpenStreetMap (`node scripts/build-boundary.mjs`). Every destination must be inside the border; check with `node scripts/check-inside.mjs`.

## Credits

Map data © OpenStreetMap contributors (ODbL). Routing by OSRM.
