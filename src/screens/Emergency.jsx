import { BackButton, Icon, YHeader } from '../components'
import Notices, { useNotices } from '../Notices'

// Numbers that work all over the Philippines, then Bansalan's own. The Bansalan numbers are the ones the Municipality of Bansalan
// publishes at bansalan.gov.ph/emergency-contact-hotlines (copied 2026-11-02, not checked by calling): check them again now and then.
const NATIONAL = [
  { name: 'National Emergency Hotline', phone: '911', detail: 'Police, fire and ambulance. Free, 24 hours.' },
  { name: 'Philippine Red Cross', phone: '143', detail: 'Ambulance, first aid and disaster help.' },
]
const BANSALAN = [
  { name: 'MDRRMO Bansalan', phone: '09815243940', show: '0981-524-3940', detail: 'Disaster and rescue.' },
  { name: 'Bansalan Municipal Police', phone: '09630558375', show: '0963-055-8375', detail: 'Police help.' },
  { name: 'Bansalan Fire Station', phone: '09498218200', show: '0949-821-8200', detail: 'Fire.' },
  { name: 'Municipal Health Office', phone: '09647595567', show: '0964-759-5567', detail: 'Medical emergencies.' },
]

const Rows = ({ list }) => list.map((n) => (
  <div key={n.phone} className="row-between">
    <div><span className="lbl">{n.name}</span><span className="row-sub">{n.detail}</span></div>
    <a className="btn" href={`tel:${n.phone}`} aria-label={`Call ${n.name} at ${n.show ?? n.phone}`}><Icon name="phone" />{n.show ?? n.phone}</a>
  </div>
))

export default function Emergency() {
  const [notices] = useNotices()
  return (
    <>
      <YHeader title="Emergency" back={<BackButton to="menu" />} />
      <div className="body">
        <p className="lede">In danger or hurt? Call now. Tell them the place, the street and what happened.</p>
        <h2 className="sec">All of the Philippines</h2>
        <section className="card form"><Rows list={NATIONAL} /></section>
        <h2 className="sec">In Bansalan</h2>
        <section className="card form"><Rows list={BANSALAN} /></section>
        {notices.length > 0 && <h2 className="sec">Notices from the BansaRide team</h2>}
        <Notices />
        <p className="hint">The Bansalan numbers are from the Municipality of Bansalan's website (bansalan.gov.ph). Numbers can change: if nobody answers, call 911. Typhoon, flood and road notices appear here and on the map.</p>
      </div>
    </>
  )
}
