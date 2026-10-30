import { Icon, useApp } from './components'
import { useAuth } from './auth'
import { motorPossible, pesoRange, PASSENGERS, fareFor, walkMinutes, fmtDist, nearestStands, compassName, routes, stationsAt, stationConfirmed, placeById, shortName } from './data'


// Motorcycles have no fixed fare. This says where to ask: the motorcycle stand nearest to you, and the route they take.
export function AskDriver({ me, destId, compact, km }) {
  const { go } = useApp()
  // the motorcycles stay at the Public Market: prefer the confirmed stand over generic map entries
  const stands = me ? nearestStands(me, 8, 'motor') : []
  const stand = stands.find((x) => stationConfirmed(x.station)) ?? stands[0] ?? null
  const fallback = stationsAt('market').find((s) => s.type === 'motor')
  const route = routes.find((r) => r.vehicle === 'Motor' && !r.via && (r.to === destId || r.from === destId))
  const st = stand?.station ?? fallback
  if (!st) return null
  // on the map card: one slim line, so the map stays visible
  if (compact) return (
    <button className="ask-slim" onClick={() => go('station', { id: st.id })}>
      <Icon name="moto" /><span><b>Ask the driver</b>{km ? ` · possible ${motorPossible(km)}` : ''} at {st.placeId ? placeById(st.placeId)?.name : st.name}{stand ? ` · ${fmtDist(stand.meters)} away` : ''}</span><Icon name="chevron" className="chev" />
    </button>
  )
  return (
    <div className="ask-driver">
      <b className="ask-title"><Icon name="moto" />Ask the driver · {placeById(destId)?.name}</b>
      <p className="ask-text">Farm motorcycles have no fixed fare. Ask at the motorcycle stand before you ride.</p>
      {(km || route) && <p className="ask-possible"><span>Possible fare</span><b>{motorPossible(km ?? route.km)}</b><em>a guide only: the driver sets the price</em></p>}
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
export default function FromYou({ ride, me, destId, compact }) {
  const { online } = useApp()
  const { discount } = useAuth()
  if (!ride) return null
  const motor = ride.vehicle === 'Motor'
  const mine = discount && PASSENGERS.find((p) => p.id === discount)
  const fare = (id) => fareFor(ride.kmExact ?? ride.km, id) // by the exact distance, so 79 m and 150 m land in the right tier
  return (
    <section className="from-you" aria-label="From your location">
      <div className="fy-top">
        <span className="tl-k">Getting there</span>
        {!ride.exact && <span className="fy-tag">{online ? 'Estimate' : 'Estimate · offline'}</span>}
      </div>
      <ul className="fy-lines">
        <li><Icon name="locate" /><span><b>Walk {walkMinutes(ride.straight)} min</b> · {fmtDist(ride.straight)} ({(ride.straight / 1609.34).toFixed(2)} mi), about {Math.round(ride.straight / 0.75).toLocaleString()} steps</span></li>
        <li><Icon name={motor ? 'moto' : 'vehicle'} /><span><b>{motor ? 'Motorcycle' : 'Tricycle'} about {ride.minutes} min</b> · {ride.km} km by road</span></li>
      </ul>
      {motor ? (
        <AskDriver me={me} destId={destId} compact={compact} km={ride.kmExact ?? ride.km} />
      ) : (
        <div className="fy-fare">
          {mine && <span className="fy-chip mine"><em>Your fare</em>₱{fare(mine.id)}</span>}
          <span className="fy-chip"><em>Adult</em>₱{fare('adult')}</span>
          <span className="fy-chip"><em>Student</em>{pesoRange(fare('elementary'), fare('college'))}</span>
        </div>
      )}
      {!ride.exact && !online && <p className="fy-note">No signal: estimated from the routes saved in the app.</p>}
    </section>
  )
}
