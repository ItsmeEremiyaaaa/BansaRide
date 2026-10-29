import { readFileSync } from 'node:fs'
import { boundary } from '../src/boundary.js'
import { geoStreets } from '../src/streetsData.js'
const inside = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [yi, xi] = ring[i], [yj, xj] = ring[j]; if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) c = !c } return c }
const els = JSON.parse(readFileSync(new URL('./overpass6.json', import.meta.url), 'utf8')).elements.filter((e) => e.tags.amenity === 'taxi')
for (const e of els) {
  const lat = e.lat ?? e.center.lat, lon = e.lon ?? e.center.lon
  const near = geoStreets.map((s) => ({ s, d: Math.hypot((s.lat - lat) * 111000, (s.lon - lon) * 110000) })).sort((a, b) => a.d - b.d)[0]
  console.log(inside([lat, lon], boundary[0]) ? 'IN ' : 'out', lat, lon, 'nearest street center:', near.s.name, Math.round(near.d), 'm', JSON.stringify(e.tags))
}
