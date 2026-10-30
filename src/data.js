// WHAT IS REAL AND WHAT IS NOT
// Real: place names and coordinates (OpenStreetMap), road routes and distances (OSRM), and the map itself.
// NOT confirmed: fares and travel times. They are estimates and are labeled that way.
// To make them real, collect them at the Bansalan terminals and edit the values below.
import { geoPlaces, geoRoutes } from './geo'
import { geoTowns } from './townsData'
import { geoStreets, geoStreetRoutes } from './streetsData'
import { geoUpland, geoUplandRoutes } from './uplandData'
import { geoPois } from './poiData'

// ---------- Fares ----------
// REPORTED by riders: the usual base fare near Bansalan for each kind of passenger.
// The fare goes up the farther the ride is. A rider's example: Bansalan to Rizal (3.7 km) is +₱20 for everyone
// (high school ₱15 becomes ₱35, college ₱20 becomes ₱40). A grandmother says Rizal costs ₱30 to ₱50 in all.
// So every passenger pays the base fare plus the same add-on per km after the first km, rounded to the nearest ₱5.
export const PASSENGERS = [
  { id: 'elementary', label: 'Elementary student', short: 'Elementary', base: 10 },
  { id: 'highschool', label: 'High school student', short: 'High school', base: 15 },
  { id: 'college', label: 'College student', short: 'College', base: 20 },
  { id: 'senior', label: 'Senior citizen', short: 'Senior', base: 15 },
  { id: 'pwd', label: 'PWD', short: 'PWD', base: 15 },
  { id: 'adult', label: 'Adult', short: 'Adult', base: 20 },
]
const PER_KM = 20 / 2.7 // pesos for each km after the first (about ₱7.4), fitted to the Rizal example
// Short rides by how far it is (told by riders): under 100 m (two digits, like 20 to 50 m) costs ₱10 for everyone;
// 100 m up to 1 km (three digits) costs ₱15. From 1 km the normal fares below apply.
export const TIER_NEAR = { km: 0.1, fare: 10 }
export const TIER_SHORT = { km: 1, fare: 15 }
export const fareFor = (km, id) => {
  if (km < TIER_NEAR.km) return TIER_NEAR.fare
  if (km < TIER_SHORT.km) return TIER_SHORT.fare
  const { base } = PASSENGERS.find((p) => p.id === id)
  return Math.max(base, TIER_SHORT.fare, Math.round((base + PER_KM * Math.max(0, km - 1)) / 5) * 5) // never cheaper than the 100 m to 1 km fare
}
export const estimateFare = (km) => fareFor(km, 'adult')
export const FARE_NOTE = 'Near Bansalan the base fares are reported by riders. Farther rides cost more: Rizal is ₱30 to ₱40 (riders say up to ₱50 at times). Confirm at the terminal.'
// "₱30–50" (cheapest to adult), "₱10" when they are the same, "Ask driver" for motorcycles.
export const fareText = (r) => (r.fare === null ? 'Ask driver' : r.fareMin === r.fare ? `₱${r.fare}` : `₱${r.fareMin}–${r.fare}`)

// Places, barangays and every named street inside Bansalan.
export const places = [...geoPlaces, ...geoStreets, ...geoUpland]
// Shops, hotels, food places, banks, pharmacies and gas stations (OpenStreetMap). They are not routes or stands:
// they show on the map when you switch them on, and any of them can be the end of a fare check.
export const pois = geoPois
export const POI_KINDS = {
  Store: { label: 'Shops', plural: 'Shops and groceries' },
  Hotel: { label: 'Hotels', plural: 'Hotels and lodging' },
  Food: { label: 'Food', plural: 'Restaurants and cafes' },
  Bank: { label: 'Banks', plural: 'Banks and ATMs' },
  Pharmacy: { label: 'Pharmacy', plural: 'Pharmacies' },
  Gas: { label: 'Gas', plural: 'Gas stations' },
}
export const poiById = (id) => pois.find((p) => p.id === id)
export const placeById = (id) => places.find((p) => p.id === id)
export const shortName = (id) => (placeById(id)?.name ?? id).replace('Bansalan ', '')

// One colour for each kind of ride. The vehicle drawing and its route line on the map use the same colour.
export const MODE_COLOR = { vehicle: '#E8A100', moto: '#067647', bus: '#E5322D', van: '#1560F0', mini: '#1F7A8C' }
export const routeColor = (r) => (r?.vehicle === 'Motor' ? MODE_COLOR.moto : MODE_COLOR.vehicle)
export const vehicleLabel = (v) => (v === 'Motor' ? 'Motorcycles' : 'Tricycle')

// Routes INSIDE Bansalan only. Path and distance are real; fare and time are estimates.
// Tricycle and pedicab are the same ride here. Motorcycles (farm motorcycles) have no fare yet: ask the driver.
// Travel time is an ESTIMATE from the distance. Tricycles and pedicabs stop and go in town (about 18 km/h, plus a minute to
// load). Farm motorcycles go about 25 km/h on the first 5 km, then slow to about 16 km/h on the rough, steep mountain roads.
// Replace these with real times when drivers share them.
export const rideMinutes = (km, vehicle) => {
  if (vehicle === 'Motor') return Math.max(3, Math.round((Math.min(km, 5) / 25 + Math.max(0, km - 5) / 16) * 60))
  return Math.max(2, Math.round((km / 18) * 60) + 1)
}
export const routes = [...geoRoutes, ...geoStreetRoutes, ...geoUplandRoutes].map((r) => ({
  ...r,
  minutes: rideMinutes(r.km, r.vehicle),
  fare: r.vehicle === 'Motor' ? null : estimateFare(r.km), // adult fare
  fareMin: r.vehicle === 'Motor' ? null : fareFor(r.km, 'elementary'),
}))

// ---------- Waiting spots and driver groups ----------
// BTODA = the tricycle/pedicab drivers' association. Riders told us the groups: each school or place has its own
// ("St. Mary's College of Bansalan Inc. BTODA", "UM BTODA", "Salazar Corp BTODA", "St. Therese BTODA").
// Motorcycles are farm motorcycles that go to the farm areas.
// What is real: the places and their map positions (OpenStreetMap). What still needs confirming with the drivers:
// the exact standing spot, the group names that we generated, and contact numbers (add only with permission).
const REPORTED = {
  smcb: "St. Mary's College of Bansalan Inc. BTODA",
  um: 'University of Mindanao Bansalan College BTODA',
  salazar: 'Salazar Corp BTODA',
}
// Short names people use for a group (also searchable).
const ALIASES = { smcb: 'SMCBI BTODA', um: 'UM BTODA' }
// Contact people. Add a number only with that person's permission.
const CONTACTS = {
  smcb: { name: 'Ernesto Falcon Jr.', org: 'SMCBI BTODA', phone: '09309019982' },
}
// Members shared by the group (names only). Add names only with the group's permission.
const MEMBERS = {
  smcb: [
    'Jychem Pergrino', 'Allrock Pedregosa', 'Anthony Balili', 'Edward Sisneros', 'Alfredo Cabariana', 'Darrel Datu',
    'Jeany Reyes', 'Jonard Muyco', 'Jones Pinero', 'Joseph Calagio', 'Joy Pansoy', 'Junoy Reyes', 'Lemmor Yu',
    'Lemuel Solis', 'Mark Anthony Dacay', 'Michael Reyes', 'Navi Benigay', 'Philip Morata', 'Rens Pesidas',
    'Ricson Guitierres', 'Ronnie Singson', 'Roy Enero', 'Sotsot Garcia', 'Winson Rosales',
  ],
}
// Streets and barangays have no group of their own. The nearest stand covers them (see nearestStand).
const uplandIds = new Set(geoUpland.map((p) => p.id))
const standable = places.filter((p) => p.kind !== 'Barangay' && p.kind !== 'Sitio' && p.kind !== 'Street' && !uplandIds.has(p.id))
const todaStations = standable.map((p) => ({
  id: `toda-${p.id}`, type: 'toda', placeId: p.id,
  name: REPORTED[p.id] ?? `${p.name} BTODA`,
  alias: ALIASES[p.id] ?? '',
  source: REPORTED[p.id] ? 'reported' : 'generated',
  landmark: p.id === 'terminal' ? 'Beside MD Drug' : p.note,
  contact: CONTACTS[p.id] ?? null,
  members: MEMBERS[p.id] ?? [],
}))
// Stands mapped on OpenStreetMap inside Bansalan (exact positions). Their groups still need confirming with the drivers.
// Motorcycles are not here on purpose: they all wait at the Public Market (see motor-pangbukid below).
const nearStreet = (lat, lon) => places.filter((p) => p.kind === 'Street')
  .map((p) => ({ p, d: Math.hypot((p.lat - lat) * 111000, (p.lon - lon) * 110000) })).sort((a, b) => a.d - b.d)[0]?.p.name
const osmStations = [
  { id: 'spot-osm-tric', type: 'toda', lat: 6.78659, lon: 125.21082, label: 'Tricycle stand' },
].map((o) => ({
  id: o.id, type: o.type, placeId: null, pos: { lat: o.lat, lon: o.lon },
  name: `${o.label} (OpenStreetMap)`, alias: '', source: 'osm',
  landmark: `Near ${nearStreet(o.lat, o.lon)}`, confirmed: false, contact: null, members: [],
  serves: o.type === 'motor' ? [{ label: 'Ask the driver where they go', note: 'The app shows the road to follow' }] : undefined,
}))
// Waiting spots reported on streets and roads. Each sits at its street (OpenStreetMap position).
// A street that is not on the map yet is listed with "location needed".
const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[–—]/g, '-').replace(/[^a-z0-9]+/g, ' ').trim()
const STREET_SPOTS = [
  ['R. Delos Cientos Street', 'Davao–Cotabato Road, Poblacion Dos'], ['Bansalan-Magsaysay Road'], ['Bansalan-Mount Apo National Park Road', 'Managa side'],
  ['Eman-Alegre Road'], ['New Clarin Road'], ['Camanchiles-Bonifacio Road'], ['Libertad-Bitaug Road'], ['Alta Vista Road'], ['Marber-Mabini Road'],
  ['Bonifacio Road'], ['Buenavista Road'], ['Linawan-Alegre Road'], ['Mabuhay Road'], ['Sibayan Road', 'Tinongtongan–Sibayan Road'],
  ['J. P. Laurel Street', 'Near LSV Microtel'], ['Lily Street', 'Near Mama Angging'], ['Dama de Noche Street'], ['A. Metilla Street'], ['P. Gatmaitan Street'],
  ['Roxas Street'], ['Rose Street'], ['Rosal Street'], ['Atis Street'], ['Camia Street'], ['Casoy Street'], ['Dahlia Street'], ['Durian Street'],
  ['Forget Me Not Street'], ['Mangga Street'], ['Marang Street'], ['Orange Street'], ['Green Manor Drive'], ['Ilang-Ilang Street'],
  ['Nazareno Street'], ['Jackfruit Street'], ['Azucena Street'], ['Quirós Street'], ['C.M. Recto Street'],
  ['Andres Awe Road', 'Darapuay'], ['Andagberang Road', 'Darapuay'], ['Andangan Road', 'Alta Vista'],
]
const streetSpots = STREET_SPOTS.map(([q, note]) => {
  const p = places.find((x) => x.kind === 'Street' && !uplandIds.has(x.id) ? norm(x.name) === norm(q) || (x.also && norm(x.also) === norm(q)) : x.id === 'andres-awe' && norm(q) === 'andres awe road')
    ?? places.find((x) => uplandIds.has(x.id) && x.kind === 'Street' && norm(x.name) === norm(q))
  return {
    id: `spot-${norm(q).replace(/ /g, '-')}`, type: 'toda', placeId: p?.id ?? null, name: `${p?.name ?? q} waiting spot`, alias: '',
    source: 'reported', landmark: note ?? (p ? p.note : ''), confirmed: false, contact: null, members: [], streetSpot: true, needsLocation: !p,
  }
})
// Every other street in Bansalan also has a spot (the pedicab and tricycle drivers pick up on the street itself).
// These are generated from the street list, so they are marked "To confirm" until drivers say where exactly they wait.
const listedStreets = new Set(streetSpots.map((s) => s.placeId).filter(Boolean))
const otherStreetSpots = places.filter((p) => p.kind === 'Street' && !listedStreets.has(p.id)).map((p) => ({
  id: `spot-${p.id}`, type: 'toda', placeId: p.id, name: `${p.name} waiting spot`, alias: '',
  source: 'generated', landmark: p.note ?? '', confirmed: false, contact: null, members: [], streetSpot: true, needsLocation: false,
}))
export const stations = [
  ...todaStations,
  ...osmStations,
  ...streetSpots,
  ...otherStreetSpots,
  // reported by a rider, but the place is not on the map yet
  // St. Therese Elementary School BTODA waits at the end of the road in Nebrada. Position is approximate (Lower Nebrada).
  { id: 'toda-sttherese', type: 'toda', placeId: null, pos: { lat: 6.7686, lon: 125.20599, approx: true }, name: 'St. Therese Elementary School BTODA', alias: 'St. Therese BTODA', source: 'reported', landmark: 'End of the road in Nebrada', contact: null, members: [] },
  {
    id: 'motor-pangbukid', type: 'motor', placeId: 'market', name: 'Motorcycles (Public Market)', alias: 'Motor pang-bukid', source: 'reported',
    landmark: 'They stay at the Public Market', confirmed: true, contact: null, members: [],
    // Motorcycles are only for the mountain areas. Routes are generated from the data.
    serves: [
      ...routes.filter((r) => r.vehicle === 'Motor').map((r) => ({ label: shortName(r.to), routeId: r.id, note: placeById(r.to).note })),
      { label: 'Kapatagan', note: 'Digos City, outside Bansalan' },
      { label: 'Kaileg', note: 'Magsaysay, outside Bansalan' },
    ],
  },
]
export const stationById = (id) => stations.find((s) => s.id === id)
// Where a stand is: its place, or its own exact position.
export const stationPlace = (s) => (s.placeId ? placeById(s.placeId) : s.pos ? { id: s.id, name: s.name, kind: 'Waiting spot', note: s.landmark, lat: s.pos.lat, lon: s.pos.lon } : null)
export const stationsAt = (placeId) => stations.filter((s) => s.placeId === placeId)
// A group can confirm its own details: set `verified: true` on its station once a BTODA officer has checked them.
export const stationVerified = (s) => s.verified === true
// Three honest levels: confirmed on the spot, reported by riders and locals, or still to confirm (made from map data).
export const stationStatus = (s) => (stationConfirmed(s) ? 'confirmed' : s.source === 'reported' ? 'reported' : 'toconfirm')
export const stationConfirmed = (s) => (s.placeId === 'terminal' && s.type === 'toda') || s.confirmed === true // confirmed: the bus terminal and the motorcycles at the Public Market

// The closest tricycle stand to any point (a street, a barangay...), with the distance in meters.
export function nearestStand(lat, lon) {
  let best = null
  for (const s of stations) {
    if (s.type !== 'toda') continue
    const p = stationPlace(s)
    if (!p) continue
    const m = Math.round(Math.hypot((p.lat - lat) * 111000, (p.lon - lon) * 110000))
    if (!best || m < best.meters) best = { station: s, meters: m }
  }
  return best
}

// Per place: where drivers wait. Used by the route and map screens.
export const waitingSpots = Object.fromEntries(
  places.map((p) => {
    const here = stationsAt(p.id)
    if (here.length === 0) return [p.id, null]
    const first = here.find((s) => s.type === 'toda') ?? here[0]
    return [p.id, { landmark: `${first.name}${first.landmark ? ` · ${first.landmark}` : ''}`, confirmed: here.every(stationConfirmed), status: here.every((s) => stationStatus(s) === 'confirmed') ? 'confirmed' : here.every((s) => stationStatus(s) !== 'toconfirm') ? 'reported' : 'toconfirm', group: first.name }]
  }).filter(([, v]) => v),
)

// A route between two places, in either direction. `reversed` is true when the stored route runs the other way.
// Only hub routes are stored (Bus Terminal and Public Market to every place). For any other pair we join two stored
// legs through a hub, so every place connects to every other place. The distance is the sum, so it is a little longer
// than a direct road. The joined route is kept so it opens like any other route.
export function routeBetween(a, b) {
  const find = (x, y) => routes.find((r) => (r.from === x && r.to === y) || (r.from === y && r.to === x))
  const direct = find(a, b)
  if (direct) return { route: direct, reversed: direct.from !== a }
  if (a === b) return null
  const id = `via-${a}-${b}`
  const cached = routes.find((r) => r.id === id)
  if (cached) return { route: cached, reversed: false }
  // try every way through one hub, then through both hubs (terminal and market are 0.1 km apart)
  const chains = [['terminal'], ['market'], ['terminal', 'market'], ['market', 'terminal']]
  let best = null
  for (const hubs of chains) {
    const stops = [a, ...hubs, b]
    const legs = []
    for (let i = 0; i < stops.length - 1; i++) {
      const l = find(stops[i], stops[i + 1])
      if (!l) break
      legs.push({ l, rev: l.from !== stops[i] })
    }
    if (legs.length !== stops.length - 1) continue
    const km = legs.reduce((t, x) => t + x.l.km, 0)
    if (!best || km < best.km) best = { legs, km, hubs }
  }
  if (!best) return null
  const motor = best.legs.some((x) => x.l.vehicle === 'Motor') // a farm-motorcycle leg: no fare, ask the driver
  const km = Math.round(best.km * 10) / 10
  const route = { id, from: a, to: b, vehicle: motor ? 'Motor' : 'Tricycle', km, minutes: rideMinutes(km, motor ? 'Motor' : 'Tricycle'),
    path: best.legs.flatMap((x) => (x.rev ? [...x.l.path].reverse() : x.l.path)), via: best.hubs[0],
    fare: motor ? null : estimateFare(km), fareMin: motor ? null : fareFor(km, 'elementary') }
  routes.push(route)
  return { route, reversed: false }
}

// Popular destinations from the Bus Terminal, shown as signboards on Home.
export const popularIds = ['rizal', 'market', 'dolo', 'libertad', 'buenavista', 'tubod', 'union', 'mabunga', 'mabuhay', 'linawan']
export const popularRoutes = popularIds.map((id) => routes.find((r) => r.from === 'terminal' && r.to === id)).filter(Boolean)

// Other towns and cities: distance, travel time and fare only. No map or steps outside Bansalan.
// Distances are real road distances from the Bansalan terminal. Travel times are estimates.
// `fare: null` means not confirmed yet. Set a number here once confirmed at the terminal.
const FARES = {} // example: { digos: 45 }
const REFS = { davao: 'A bus company advisory listed an air-con bus fare of ₱205 from Davao City to Bansalan (date unknown).' }
const PROVINCE = { davao: 'Davao Region' }
export const towns = geoTowns.map((t) => ({
  ...t,
  province: PROVINCE[t.id] ?? t.group,
  fare: FARES[t.id] ?? null,
  vehicle: t.km > 100 ? 'Bus' : 'Van or bus',
  ref: REFS[t.id] ?? '',
  inProvince: t.group === 'Davao del Sur',
}))
export const townGroups = ['Davao del Sur', 'Other cities']

// ---------- where a point is, compared with Bansalan ----------
import { boundary } from './boundary'
export const insideBansalan = (lat, lon) => {
  const ring = boundary[0]
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
// The closest named place or street to a point, with the distance in meters.
export function nearestPlace(lat, lon) {
  let best = null
  for (const p of places) {
    const m = Math.round(Math.hypot((p.lat - lat) * 111000, (p.lon - lon) * 110000))
    if (!best || m < best.meters) best = { place: p, meters: m }
  }
  return best
}

// ---------- live distance and direction ----------
export const metersBetween = (a, b) => Math.round(Math.hypot((a[0] - b[0]) * 111000, (a[1] - b[1]) * 110500))
export function bearingTo(from, to) {
  const rad = Math.PI / 180
  const dLon = (to[1] - from[1]) * rad
  const y = Math.sin(dLon) * Math.cos(to[0] * rad)
  const x = Math.cos(from[0] * rad) * Math.sin(to[0] * rad) - Math.sin(from[0] * rad) * Math.cos(to[0] * rad) * Math.cos(dLon)
  return (Math.atan2(y, x) / rad + 360) % 360
}
export const compassName = (deg) => ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.round(deg / 45) % 8]
export const walkMinutes = (m) => Math.max(1, Math.round(m / 80)) // about 80 m a minute
export const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`)
// The closest waiting spots to a point (a person), nearest first.
export function nearestStands(ll, count = 3, type) {
  return stations
    .filter((s) => (!type || s.type === type) && stationPlace(s))
    .map((s) => { const p = stationPlace(s); return { station: s, place: p, meters: metersBetween(ll, [p.lat, p.lon]), bearing: bearingTo(ll, [p.lat, p.lon]) } })
    .sort((a, b) => a.meters - b.meters)
    .slice(0, count)
}

// The best stored route to a destination for someone standing at `ll`: the one whose pickup is closest to them.
export function bestRouteFrom(ll, destId) {
  let best = null
  for (const r of routes) {
    if (r.to !== destId && r.from !== destId) continue
    const reversed = r.from === destId
    const start = placeById(reversed ? r.to : r.from)
    const meters = metersBetween(ll, [start.lat, start.lon])
    if (!best || meters < best.meters) best = { route: r, reversed, meters }
  }
  return best
}

// Walking directions drawn inside the app: the route and the turns come from the OpenStreetMap road router (OSRM).
const TURN = { left: 'Turn left', right: 'Turn right', 'slight left': 'Bear left', 'slight right': 'Bear right', 'sharp left': 'Turn sharp left', 'sharp right': 'Turn sharp right', straight: 'Continue straight', uturn: 'Make a U-turn' }
export async function walkRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/foot/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`
  const j = await (await fetch(url)).json()
  if (j.code !== 'Ok') throw new Error(j.code)
  const leg = j.routes[0]
  const steps = leg.legs[0].steps.map((s) => {
    const { type, modifier } = s.maneuver
    const road = s.name ? s.name : ''
    const text = type === 'arrive' ? 'You have arrived' : type === 'depart' ? `Head out${road ? ` along ${road}` : ''}` : `${TURN[modifier] ?? 'Continue'}${road ? ` onto ${road}` : ''}`
    return { text, meters: Math.round(s.distance) }
  })
  return { meters: Math.round(leg.distance), minutes: Math.max(1, Math.round(leg.duration / 60)), path: leg.geometry.coordinates.map(([lon, lat]) => [lat, lon]), steps }
}

// Walking directions on OpenStreetMap (a link that opens a new tab; the app now draws the route itself). Starts from where the person is when known.
export const osmDirections = (from, to) =>
  `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from ? `${from[0].toFixed(5)}%2C${from[1].toFixed(5)}` : ''}%3B${to[0].toFixed(5)}%2C${to[1].toFixed(5)}`

// ---------- Buses, vans and mini buses ----------
// REPORTED by riders: hours, and these fares.
//   Big bus to Davao City (73.2 km): ₱200, or ₱140 for a student. Vans save about ₱15 on the same trip.
//   Mini bus to Kapatagan (33.4 km): ₱80 to ₱100 for a student.
// Everything else is CALCULATED from those: the fare grows with the distance, rounded to the nearest ₱5.
const round5 = (n) => Math.round(n / 5) * 5
const DAVAO_KM = 73.2
const KAPATAGAN_KM = 33.4
// The two ride alerts (pop-up in the app, notification when it is closed): minutes before the first and last ride.
export const ALERT_FIRST_BEFORE = 30
export const ALERT_LAST_BEFORE = 60
export const TRANSIT = {
  bus: { id: 'bus', label: 'Big bus', first: 3 * 60, last: 23 * 60, firstText: '3:00 AM', lastText: '11:00 PM', where: 'Digos, Davao, Kidapawan and other cities', stop: 'Leaves from the Bus Terminal' },
  van: { id: 'van', label: 'Van', first: 5 * 60, last: 21 * 60, firstText: '5:00 AM', lastText: '9:00 PM', where: 'Cities and towns, a little cheaper than the bus', stop: 'Leaves when it is full' },
  mini: { id: 'mini', label: 'Mini bus', first: 8 * 60, last: 18 * 60, firstText: '8:00 AM', lastText: '6:00 PM', where: 'Rural areas with a good road', stop: 'Waits at the Public Market' },
}
// { adult, student } for a trip of `km`. Students, seniors and PWD get the discount.
// Which fare column a passenger pays on a bus, van or mini bus: students, seniors and PWD get the discount.
export const transitKind = (passengerId) => (!passengerId || passengerId === 'adult' ? 'adult' : 'student')
export function transitFare(mode, km) {
  const bus = { adult: Math.max(15, round5((200 / DAVAO_KM) * km)), student: Math.max(10, round5((140 / DAVAO_KM) * km)) }
  if (mode === 'bus') return bus
  if (mode === 'van') {
    const save = round5((15 / DAVAO_KM) * km) // about ₱15 off at Davao, less on shorter trips
    return { adult: Math.max(15, bus.adult - save), student: Math.max(10, bus.student - save) }
  }
  const student = Math.max(10, round5((90 / KAPATAGAN_KM) * km)) // ₱90 is the middle of ₱80 to ₱100
  return { adult: Math.max(15, round5(student / 0.8)), student }
}
// Is it running now? Returns text like "Running now · last ride 11:00 PM" or "Closed · first ride 3:00 AM".
export function transitStatus(m, now = new Date()) {
  const t = now.getHours() * 60 + now.getMinutes()
  const open = t >= m.first && t <= m.last
  const left = open ? m.last - t : 0 // minutes until the last ride
  return { open, left, ending: open && left <= 60, text: open ? `Running now · last ride ${m.lastText}` : `Not running · first ride ${m.firstText}` }
}
// Which towns and barangays a mini bus serves (rural, good road). Still to confirm with the drivers.
export const MINI_TOWNS = ['kapatagan', 'magsaysay', 'digos', 'santa-cruz']
export const MINI_PLACES = ['dolo', 'darapuay', 'linawan', 'alegre', 'altavista']
// Towns with their own rules. Kapatagan (told by a rider who lives there): only the mini bus goes there, and the fare is not
// fixed: it differs from bus to bus, so you ask the conductor. The ₱80 to ₱100 student price is only a guide.
export const TOWN_RIDES = {
  kapatagan: { modes: ['mini'], ask: true, guide: { student: [80, 100] }, note: 'The fare is not fixed. It differs from bus to bus, so ask the conductor before you ride.' },
}
export const townAsksFare = (id) => !!TOWN_RIDES[id]?.ask
// The rule (told by riders): the big bus goes only to cities. Every other town has only the mini bus.
// Cities also have vans, and Digos City also has the mini bus.
export const isCity = (t) => /\bCity$/.test(t?.name ?? '')
const townById = (id) => towns.find((t) => t.id === id)
export const transitModesForTown = (id) => {
  if (TOWN_RIDES[id]?.modes) return TOWN_RIDES[id].modes
  if (!isCity(townById(id))) return ['mini']
  return id === 'digos' ? ['bus', 'van', 'mini'] : ['bus', 'van']
}
// A short text for the main fare of a town: "₱65–90", or "Ask the conductor" where the fare is not fixed.
// A mini bus fare is never fixed, so it always says "ask the conductor". The possible fare is only a guide:
// the reported ₱80 to ₱100 for students to Kapatagan, and an estimate scaled from it for the other towns.
export const miniPossible = (townId, km) => {
  const g = TOWN_RIDES[townId]?.guide
  const f = transitFare('mini', km)
  return { student: g ? g.student : [f.student, f.student], regular: f.adult, text: g ? `students ₱${g.student[0]}–${g.student[1]}` : `₱${f.student}–${f.adult}` }
}
export const townFareText = (t) => {
  if (!isCity(t)) return 'Ask the conductor'
  const f = transitFare('bus', t.km)
  return `₱${f.student}–${f.adult}`
}

// ---------- exact roads for joined routes ----------
// A joined route (via a hub) is only an estimate: it is longer and doubles back. When there is a signal we ask the
// OpenStreetMap road router (OSRM) for the real direct road and keep the answer, so it also works offline later.
const EXACT_KEY = 'bansaride.exact.v1'
const readExact = () => { try { return JSON.parse(localStorage.getItem(EXACT_KEY)) ?? {} } catch { return {} } }
const applyExact = (route, e) => {
  Object.assign(route, e, { exact: true, fare: route.vehicle === 'Motor' ? null : estimateFare(e.km), fareMin: route.vehicle === 'Motor' ? null : fareFor(e.km, 'elementary') })
  return route
}
// Use a road we already saved when a joined route is created.
const _exact = readExact()
routes.forEach((r) => { if (r.via && _exact[r.id]) applyExact(r, _exact[r.id]) })
export async function refineRoute(route) {
  if (!route.via || route.exact) return route
  const a = placeById(route.from), b = placeById(route.to)
  const saved = readExact()[route.id]
  if (saved) return applyExact(route, saved)
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`
  const j = await (await fetch(url)).json()
  if (j.code !== 'Ok') throw new Error(j.code)
  const leg = j.routes[0]
  const km = Math.round(leg.distance / 100) / 10
  const e = { km, minutes: rideMinutes(km, route.vehicle), path: leg.geometry.coordinates.map(([lon, lat]) => [Number(lat.toFixed(4)), Number(lon.toFixed(4))]) }
  try { localStorage.setItem(EXACT_KEY, JSON.stringify({ ...readExact(), [route.id]: e })) } catch { /* storage is optional */ }
  return applyExact(route, e)
}
