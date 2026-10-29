import { readFileSync } from 'node:fs'
import { boundary } from '../src/boundary.js'
const inside = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [yi, xi] = ring[i], [yj, xj] = ring[j]; if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) c = !c } return c }
const els = JSON.parse(readFileSync(new URL('./overpass4.json', import.meta.url), 'utf8')).elements
const byName = new Map()
for (const e of els) {
  const lat = e.center?.lat, lon = e.center?.lon
  if (!lat || !inside([lat, lon], boundary[0])) continue
  const n = e.tags.name
  byName.set(n, [...(byName.get(n) ?? []), { lat, lon, hw: e.tags.highway }])
}
console.log('named ways inside:', els.length, 'unique street names inside:', byName.size)
const hit = [...byName.keys()].filter((n) => /curvada|dama|noche|therese/i.test(n))
console.log('matches:', hit)
console.log([...byName.keys()].sort().slice(0, 400).join(' | '))
