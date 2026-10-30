import { Icon, useApp } from './components'
import { useAuth } from './auth'
import { PASSENGERS, fareFor, walkMinutes, vehicleLabel, fmtDist } from './data'


// "From you": how far this place is from where you are, what a ride there costs, and how long it takes.
export default function FromYou({ ride }) {
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
        <p className="fy-fare ask"><Icon name="moto" />Motorcycle: ask the driver for the fare.</p>
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
