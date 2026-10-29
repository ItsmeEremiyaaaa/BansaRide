import { readFileSync } from 'node:fs'
import { boundary } from '../src/boundary.js'
const inside = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [yi, xi] = ring[i], [yj, xj] = ring[j]; if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) c = !c } return c }
const T = { lat: 6.78732, lon: 125.21218 }
const els = JSON.parse(readFileSync(new URL('./overpass7.json', import.meta.url), 'utf8')).elements
const rows = els.filter((e) => e.tags?.name).map((e) => {
  const lat = e.lat ?? e.center.lat, lon = e.lon ?? e.center.lon
  return { n: e.tags.name, t: e.tags.place || e.tags.natural || '-', ele: e.tags.ele ?? '', lat, lon, ins: inside([lat, lon], boundary[0]), km: Math.hypot((lat - T.lat) * 111, (lon - T.lon) * 110) }
})
const kai = rows.filter((r) => /kai|kay/i.test(r.n))
console.log('KAILEG-like:', JSON.stringify(kai))
console.log('--- inside Bansalan, rural (hamlet/locality/village/peak), by air distance')
for (const r of rows.filter((x) => x.ins).sort((a, b) => a.km - b.km)) console.log(r.t.padEnd(10), r.km.toFixed(1).padStart(5), 'km', r.lat.toFixed(5), r.lon.toFixed(5), r.ele, r.n)
