import { useEffect, useMemo, useState } from 'react'
import { nearestPlace, metersBetween, routes, rideMinutes } from './data'

// What a ride from where you stand to a place would be: distance, time and the road to draw.
// Offline it uses the routes saved in the app. Online it asks the road router for the exact road and remembers the answer.
const KEY = 'bansaride.mero.v1'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? {} } catch { return {} } }
const write = (o) => { try { const keys = Object.keys(o); if (keys.length > 40) delete o[keys[0]]; localStorage.setItem(KEY, JSON.stringify(o)) } catch { /* optional */ } }
const roadFactor = (p) => (p.kind === 'Barangay' || p.kind === 'Sitio' ? 1.6 : 1.35) // roads are longer than a straight line

export function offlineRide(me, dest) {
  const np = nearestPlace(me[0], me[1])
  const straight = metersBetween(me, [dest.lat, dest.lon])
  // a route saved in the app from the place nearest to you (works with no signal)
  const direct = np.place.id !== dest.id
    ? routes.find((r) => !r.via && ((r.from === np.place.id && r.to === dest.id) || (r.from === dest.id && r.to === np.place.id)))
    : null
  const motorOnly = routes.some((r) => r.vehicle === 'Motor' && (r.to === dest.id || r.from === dest.id)) && !routes.some((r) => r.vehicle !== 'Motor' && (r.to === dest.id || r.from === dest.id))
  const vehicle = direct?.vehicle ?? (motorOnly ? 'Motor' : 'Tricycle')
  const km = Math.max(0.1, direct ? direct.km + (np.meters / 1000) * 1.3 : (straight / 1000) * roadFactor(dest))
  const stored = direct ? (direct.from === np.place.id ? direct.path : [...direct.path].reverse()) : null
  return { km: Math.round(km * 10) / 10, minutes: rideMinutes(km, vehicle), vehicle, path: stored ? [me, ...stored] : null, straight, exact: false }
}

// Hook: the ride estimate for `dest`, improved to the real road when there is a signal.
export function useRideFromMe(me, dest) {
  const key = me && dest ? `${me[0].toFixed(3)},${me[1].toFixed(3)}|${dest.id}` : ''
  const base = useMemo(() => (me && dest ? offlineRide(me, dest) : null), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const [exact, setExact] = useState(null)

  useEffect(() => {
    setExact(null)
    if (!key) return
    const saved = read()[key]
    if (saved) { setExact(saved); return }
    if (!navigator.onLine) return
    let cancelled = false
    fetch(`https://router.project-osrm.org/route/v1/driving/${me[1]},${me[0]};${dest.lon},${dest.lat}?overview=full&geometries=geojson`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || j.code !== 'Ok') return
        const leg = j.routes[0]
        const km = Math.max(0.1, Math.round(leg.distance / 100) / 10)
        const result = { km, minutes: rideMinutes(km, base.vehicle), vehicle: base.vehicle, path: leg.geometry.coordinates.map(([x, y]) => [y, x]), straight: base.straight, exact: true }
        const all = read(); all[key] = result; write(all)
        setExact(result)
      })
      .catch(() => {}) // no signal: the saved-route estimate stays
    return () => { cancelled = true }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return exact ?? base
}
