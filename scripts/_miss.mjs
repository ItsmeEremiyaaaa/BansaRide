import { readFileSync } from 'node:fs'
import { boundary } from '../src/boundary.js'
const inside = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [yi, xi] = ring[i], [yj, xj] = ring[j]; if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) c = !c } return c }
const els = JSON.parse(readFileSync(new URL('./overpass8.json', import.meta.url), 'utf8')).elements
const seen = new Set()
for (const e of els) {
  const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon
  if (!lat || !e.tags?.name) continue
  const k = e.tags.name + (inside([lat, lon], boundary[0]) ? 'i' : 'o'); if (seen.has(k)) continue; seen.add(k)
  console.log(inside([lat, lon], boundary[0]) ? 'IN ' : 'out', (e.tags.highway || e.tags.place || e.tags.amenity || e.tags.tourism || '-').padEnd(14), lat.toFixed(5), lon.toFixed(5), e.tags.name)
}
