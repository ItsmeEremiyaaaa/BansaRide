import { boundary } from '../src/boundary.js'
import { geoPlaces } from '../src/geo.js'
const inside = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [yi, xi] = ring[i], [yj, xj] = ring[j]; if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) c = !c } return c }
for (const p of geoPlaces) console.log(inside([p.lat, p.lon], boundary[0]) ? 'inside ' : 'OUTSIDE', p.name)
