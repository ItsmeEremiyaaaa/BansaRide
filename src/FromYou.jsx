import { Icon, useApp } from './components'
import { useAuth } from './auth'
import { PASSENGERS, fareFor, walkMinutes, vehicleLabel, fmtDist, nearestStands, compassName, routes, stationsAt, stationConfirmed, placeById, shortName } from './data'


// Motorcycles have no fixed fare. This says where to ask: the motorcycle stand nearest to you, and the route they take.
export function AskDriver({ me, destId }) {
  const { go } = useApp()
  // the motorcycles stay at the Public Market: prefer the confirmed stand over generic map entries
  const stands = me ? nearestStands(me, 8, 'motor') : []
  const stand = stands.find((x) => stationConfirmed(x.station)) ?? stands[0] ?? null
  const fallback = stationsAt('market').find((s) => s.type === 'motor')
  const route = routes.find((r) => r.vehicle === 'Motor' && !r.via && (r.to === destId || r.from === destId))
  const st = stand?.station ?? fallback
  if (!st) return null
  return (
    <div className="ask-driver">
      <b className="ask-title"><Icon name="moto" />Ask the driver · {placeById(destId)?.name}</b>
      <p className="ask-text">Farm motorcycles have no fixed fare. Ask at the motorcycle stand before you ride.</p>
      <button className="ask-stand" onClick={() => go('station', { id: st.id })}>
        <span className="tl-k">Where to ask</span>
        <b>{st.name}</b>
        <span className="row-sub">{stand ? `At ${stand.place.name} · ${fmtDist(stand.meters)} ${compassName(stand.bearing)} of you · about ${walkMinutes(stand.meters)} min walk` : 'At the Public Market'}</span>
        <Icon name="chevron" className="chev" />
      </button>
      {route && (
        <button className="ask-route" onClick={() => go('route', route.from === destId ? { id: route.id, rev: true } : { id: route.id })}>
          <Icon name="routes" />Motorcycle route from {shortName(route.from === destId ? route.to : route.from)} · {route.km} km · about {route.minutes} min
        </button>
      )}
    </div>
  )
}

// "From you": how far this place is from where you are, what a ride there costs, and how long it takes.
export default function FromYou({ ride, me, destId }) {
  const { online } = useApp()
  const { discount } = useAuth()
  if (!ride) return null
  const motor = ride.vehicle === 'Motor'
  const mine = discount && PASSENGERS.find((p) => p.id === discount)
  const fare = (id) => fareFor(ride.km, id)
  return (
    <section className="from-you" aria-label="From your location">
      <div className="fy-top">
        <span className="tl-k">From you · live</span>
        <span className={'fy-tag' + (ride.exact ? ' exact' : '')}>{ride.exact ? 'Exact road' : online ? 'Estimate' : 'Estimate · offline'}</span>
      </div>
      <div className="fy-stats">
        <div><b>{fmtDist(ride.straight)}</b><span>straight line · {walkMinutes(ride.straight)} min walk</span></div>
        <div><b>{ride.km} km</b><span>by {vehicleLabel(ride.vehicle).toLowerCase()} · about {ride.minutes} min</span></div>
      </div>
      {motor ? (
        <AskDriver me={me} destId={destId} />
      ) : (
        <div className="fy-fare">
          {mine && <span className="fy-chip mine"><em>Your fare</em>₱{fare(mine.id)}</span>}
          <span className="fy-chip"><em>Adult</em>₱{fare('adult')}</span>
          <span className="fy-chip"><em>Student</em>₱{fare('elementary')}–{fare('college')}</span>
        </div>
      )}
      {!ride.exact && <p className="fy-note">{online ? 'Finding the exact road…' : 'No signal: estimated from the routes saved in the app.'}</p>}
    </section>
  )
}
