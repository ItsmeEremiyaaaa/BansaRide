import { BackButton, Icon, YHeader } from '../components'
import Notices from '../Notices'

// Numbers that work all over the Philippines. Local numbers (police, hospital, fire station, MDRRMO) are not listed until they are confirmed.
const NUMBERS = [
  { name: 'National Emergency Hotline', phone: '911', detail: 'Police, fire and ambulance. Free, 24 hours.' },
  { name: 'Philippine Red Cross', phone: '143', detail: 'Ambulance, first aid and disaster help.' },
]

export default function Emergency() {
  return (
    <>
      <YHeader title="Emergency" back={<BackButton to="menu" />} />
      <div className="body">
        <p className="lede">In danger or hurt? Call now. Tell them the place, the street and what happened.</p>
        <section className="card form">
          {NUMBERS.map((n) => (
            <div key={n.phone} className="row-between">
              <div><span className="lbl">{n.name}</span><span className="row-sub">{n.detail}</span></div>
              <a className="btn" href={`tel:${n.phone}`} aria-label={`Call ${n.name} at ${n.phone}`}><Icon name="phone" />{n.phone}</a>
            </div>
          ))}
        </section>
        <h2 className="sec">Notices from the BansaRide team</h2>
        <Notices />
        <p className="hint">Typhoon, flood and road notices appear here and on the map. Bansalan police, hospital and fire station numbers are not listed yet because they are not confirmed.</p>
      </div>
    </>
  )
}
