import { readFileSync } from 'node:fs'
import { boundary } from '../src/boundary.js'
const inside = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [yi, xi] = ring[i], [yj, xj] = ring[j]; if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) c = !c } return c }
const d = JSON.parse(readFileSync(new URL('./overpass3.json', import.meta.url), 'utf8')).elements
const seen = new Set()
for (const e of d) {
  const t = e.tags ?? {}, lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon
  if (!lat || !t.name) continue
  const ins = inside([lat, lon], boundary[0])
  const k = t.name + (ins ? 'i' : 'o'); if (seen.has(k)) continue; seen.add(k)
  console.log((ins ? 'IN ' : 'out'), (t.amenity || t.place || t.highway || t.shop || t.office || t.public_transport || '-').padEnd(16), lat.toFixed(5), lon.toFixed(5), t.name)
}
