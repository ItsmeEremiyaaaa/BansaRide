// Builds src/geo.js: real place coordinates (OpenStreetMap) and real road routes (OSRM).
// Run once with: node scripts/build-geo.mjs   (needs internet). Output is committed so the app works offline.
// To add a destination: add it to `places` (copy its coordinates from OpenStreetMap) and to `routes`, then re-run.
import { writeFileSync } from 'node:fs'

// Coordinates come from OpenStreetMap (© OpenStreetMap contributors, ODbL).
const places = [
  { id: 'terminal', name: 'Bansalan Bus Terminal', kind: 'Terminal', lat: 6.78732, lon: 125.21218, note: 'Beside MD Drug' },
  { id: 'market', name: 'Public Market', kind: 'Market', lat: 6.78713, lon: 125.21291, note: 'Poblacion' },
  { id: 'hall', name: 'Municipal Hall', kind: 'Government', lat: 6.78765, lon: 125.2112, note: 'Next to the police and fire stations' },
  { id: 'school', name: 'Central Elementary School', kind: 'School', lat: 6.77958, lon: 125.21499, note: 'Poblacion Uno' },
  { id: 'nazareth', name: 'Nazareth High School', kind: 'School', lat: 6.77769, lon: 125.21591, note: 'Near Rizal Park' },
  { id: 'hospital', name: 'Centeno Medical Hospital', kind: 'Hospital', lat: 6.78053, lon: 125.2165, note: 'Poblacion Uno' },
  { id: 'rizal', name: 'Rizal', kind: 'Barangay', lat: 6.78452, lon: 125.19142, note: 'Barangay Rizal' },
  { id: 'dolo', name: 'Dolo', kind: 'Barangay', lat: 6.80872, lon: 125.19309, note: 'Barangay Dolo' },
  { id: 'libertad', name: 'Libertad', kind: 'Barangay', lat: 6.80932, lon: 125.21131, note: 'Barangay Libertad' },
  { id: 'buenavista', name: 'Buenavista', kind: 'Barangay', lat: 6.80124, lon: 125.21994, note: 'Barangay Buenavista' },
  { id: 'tubod', name: 'Tubod', kind: 'Barangay', lat: 6.79901, lon: 125.21128, note: 'Barangay Tubod' },
  { id: 'union', name: 'Union', kind: 'Barangay', lat: 6.79972, lon: 125.23507, note: 'Barangay Union' },
  { id: 'mabunga', name: 'Mabunga', kind: 'Barangay', lat: 6.78476, lon: 125.24163, note: 'Barangay Mabunga' },
  { id: 'mabuhay', name: 'Mabuhay', kind: 'Barangay', lat: 6.76332, lon: 125.23095, note: 'Barangay Mabuhay' },
  { id: 'smcb', name: "St. Mary's College of Bansalan", kind: 'School', lat: 6.78113, lon: 125.21456, note: 'Poblacion Uno' },
  { id: 'um', name: 'University of Mindanao Bansalan College', kind: 'School', lat: 6.78934, lon: 125.2084, note: 'Poblacion Dos' },
  { id: 'salazar', name: 'JK Salazar Grocery', kind: 'Store', lat: 6.78779, lon: 125.21303, note: 'Beside the Public Market' },
  { id: 'balutakay', name: 'Balutakay', kind: 'Barangay', lat: 6.90922, lon: 125.27026, note: 'Mountain barangay, about 1,300 m up' },
  { id: 'newclarin', name: 'New Clarin', kind: 'Barangay', lat: 6.75062, lon: 125.19577, note: 'Barangay New Clarin' },
  { id: 'gagpang', name: 'Gagpang', kind: 'Sitio', lat: 6.88058, lon: 125.22404, note: 'Mountain sitio, about 900 m up' },
  { id: 'alegre', name: 'Alegre', kind: 'Barangay', lat: 6.87699, lon: 125.22134, note: 'Mountain barangay, about 845 m up' },
  { id: 'malupo', name: 'Malupo', kind: 'Sitio', lat: 6.85815, lon: 125.2353, note: 'Mountain sitio, about 780 m up' },
  { id: 'pananag', name: 'Pananag', kind: 'Sitio', lat: 6.84773, lon: 125.24298, note: 'Mountain sitio, about 670 m up' },
  { id: 'lacyo', name: 'Lacyo', kind: 'Sitio', lat: 6.85983, lon: 125.21455, note: 'Mountain sitio, about 620 m up' },
  { id: 'alo', name: 'Alo', kind: 'Sitio', lat: 6.89015, lon: 125.18948, note: 'Mountain sitio, about 600 m up' },
  { id: 'altavista', name: 'Alta Vista', kind: 'Barangay', lat: 6.8774, lon: 125.2031, note: 'Mountain barangay' },
  { id: 'darapuay', name: 'Darapuay', kind: 'Barangay', lat: 6.86867, lon: 125.17594, note: 'Rural barangay' },
  { id: 'kinuskusan', name: 'Kinuskusan', kind: 'Barangay', lat: 6.85958, lon: 125.16798, note: 'Rural barangay' },
  { id: 'balagonon', name: 'Balagonon', kind: 'Sitio', lat: 6.87988, lon: 125.25879, note: 'Mountain sitio' },
  { id: 'newbohol', name: 'New Bohol', kind: 'Sitio', lat: 6.89062, lon: 125.26036, note: 'Mountain sitio' },
  { id: 'linawan', name: 'Linawan', kind: 'Barangay', lat: 6.8295, lon: 125.20048, note: 'Barangay Linawan' },
]

// Tricycle and pedicab are the same ride here, so every route uses one vehicle.
const V = 'Tricycle'
const routes = [
  ['market', 'terminal'], ['rizal', 'terminal'], ['dolo', 'terminal'], ['libertad', 'terminal'], ['buenavista', 'terminal'],
  ['tubod', 'terminal'], ['union', 'terminal'], ['mabunga', 'terminal'], ['mabuhay', 'terminal'], ['linawan', 'terminal'],
  ['school', 'terminal'], ['nazareth', 'market'], ['hospital', 'terminal'], ['market', 'hall'], ['school', 'market'],
  ['smcb', 'terminal'], ['um', 'terminal'], ['salazar', 'terminal'],
  ['balutakay', 'market', 'Motor'], ['newclarin', 'market', 'Motor'],
  ['gagpang', 'market', 'Motor'], ['alegre', 'market', 'Motor'], ['malupo', 'market', 'Motor'], ['pananag', 'market', 'Motor'], ['lacyo', 'market', 'Motor'], ['alo', 'market', 'Motor'], ['altavista', 'market', 'Motor'], ['darapuay', 'market', 'Motor'], ['kinuskusan', 'market', 'Motor'], ['balagonon', 'market', 'Motor'], ['newbohol', 'market', 'Motor'],
].map(([to, from, vehicle]) => ({ id: `${from}-${to}`, from, to, vehicle: vehicle ?? V }))

const by = Object.fromEntries(places.map((p) => [p.id, p]))
const out = []
for (const r of routes) {
  const a = by[r.from], b = by[r.to]
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`
  const res = await fetch(url, { headers: { 'User-Agent': 'BansaRide-dev/0.1 (local project)' } })
  const j = await res.json()
  if (j.code !== 'Ok') throw new Error(`${r.id}: ${j.code}`)
  const leg = j.routes[0]
  const km = Math.round(leg.distance / 100) / 10
  out.push({
    ...r,
    km,
    // tricycles average about 20 km/h; motorcycles on the mountain roads about 25 km/h
    minutes: Math.max(2, Math.round((km / (r.vehicle === 'Motor' ? 25 : 20)) * 60) + 1),
    path: leg.geometry.coordinates.map(([lon, lat]) => [Number(lat.toFixed(4)), Number(lon.toFixed(4))]),
  })
  console.log(r.id, km, 'km', leg.geometry.coordinates.length, 'points')
  await new Promise((s) => setTimeout(s, 1200))
}

const file = `// GENERATED by scripts/build-geo.mjs. Places © OpenStreetMap contributors (ODbL). Routes from OSRM.
export const geoPlaces = ${JSON.stringify(places, null, 2)}

export const geoRoutes = ${JSON.stringify(out)}
`
writeFileSync(new URL('../src/geo.js', import.meta.url), file)
console.log('wrote src/geo.js')
