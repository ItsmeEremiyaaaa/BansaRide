import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { BackButton, Icon, Trike, YHeader, useApp } from '../components'
import { PASSENGERS, fareFor, towns, transitFare, miniPossible, isCity, TRANSIT, popularRoutes, shortName, stationById, stationPlace, stations } from '../data'

const KMS = [0.5, 1, 2, 3, 4, 5, 7, 10]
const SHORT = { elementary: 'Elem', highschool: 'HS', college: 'Col', senior: 'Sen', pwd: 'PWD', adult: 'Adult' } // short so all six fit on a phone

// A fare list that works offline and can be printed or saved as a PDF, to post at a waiting spot or show a driver.
export function FareSheet() {
  const printIt = () => window.print()
  return (
    <>
      <YHeader title="Fare list" back={<BackButton to="menu" />} />
      <div className="body sheet-page">
        <p className="lede">Common fares in and around Bansalan. They are estimates from fares riders told us. Ask the driver to confirm.</p>
        <section className="card">
          <h2 className="sec">Tricycle and pedicab, by distance</h2>
          <div className="table-wrap">
            <table className="ftable">
              <thead><tr><th>Km</th>{PASSENGERS.map((p) => <th key={p.id}>{SHORT[p.id]}</th>)}</tr></thead>
              <tbody>{KMS.map((km) => <tr key={km}><th>{km}</th>{PASSENGERS.map((p) => <td key={p.id}>₱{fareFor(km, p.id)}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="hint">Elem = elementary student · HS = high school student · Col = college student · Sen = senior citizen.</p>
          <p className="hint">Popular: {popularRoutes.slice(0, 5).map((r) => `${shortName(r.to)} ${r.km} km`).join(' · ')}</p>
        </section>
        <section className="card">
          <h2 className="sec">Bus, van and mini bus from Bansalan</h2>
          <div className="table-wrap">
            <table className="ftable">
              <thead><tr><th>To</th><th>Km</th><th>Bus</th><th>Van</th></tr></thead>
              <tbody>{towns.map((t) => { if (!isCity(t)) return <tr key={t.id}><th>{t.name}</th><td>{t.km}</td><td colSpan="2">Mini bus · ask · possible {miniPossible(t.id, t.km).text}</td></tr>
                const b = transitFare('bus', t.km), v = transitFare('van', t.km); return <tr key={t.id}><th>{t.name.replace(' City', '')}</th><td>{t.km}</td><td>₱{b.student}–{b.adult}</td><td>₱{v.student}–{v.adult}</td></tr> })}</tbody>
            </table>
          </div>
          <p className="hint">Hours: bus {TRANSIT.bus.firstText} to {TRANSIT.bus.lastText}, van {TRANSIT.van.firstText} to {TRANSIT.van.lastText}, mini bus {TRANSIT.mini.firstText} to {TRANSIT.mini.lastText}. First number is the student fare.</p>
        </section>
        <button className="btn no-print" onClick={printIt}><Icon name="check" />Print or save as PDF</button>
        <p className="foot">BansaRide · estimates, not official prices</p>
      </div>
    </>
  )
}

const GUIDE = [
  ['Arriving by bus', 'Buses from Davao, Digos and Kidapawan stop at the Bansalan Bus Terminal, beside MD Drug, in the town centre.'],
  ['Getting around town', 'Tricycles and pedicabs wait at the terminal and along the main streets. A short ride in town is about ₱10 to ₱20.'],
  ['The Public Market', 'It is 100 metres from the terminal. Farm motorcycles for the mountain barangays wait here. Ask the driver for the price.'],
  ['Going to the barangays', 'Rizal, Dolo, Libertad and Tubod are a short tricycle ride. Farther places, such as Darapuay or Linawan, may use a mini bus.'],
  ['Money and time', 'Bring small bills for fares. The last bus to Davao leaves late, but vans stop earlier, so check the hours.'],
]
// A short page for visitors who do not know the town.
export function Visitor() {
  const { go } = useApp()
  return (
    <>
      <YHeader title="Visiting Bansalan" back={<BackButton to="menu" />} />
      <div className="body">
        <p className="lede">New here? These are the first things to know.</p>
        {GUIDE.map(([h, t]) => <section className="card guide" key={h}><h2 className="sec">{h}</h2><p>{t}</p></section>)}
        <div className="cta-row">
          <button className="btn" onClick={() => go('map', { id: 'terminal' })}><Icon name="map" />Show the Bus Terminal</button>
          <button className="btn secondary" onClick={() => go('place', { id: 'market' })}><Icon name="town" />Public Market tips</button>
        </div>
      </div>
    </>
  )
}

const STEPS = [
  ['map', 'Find where you are', 'Open the Map. The blue dot is you. Tap the 3D button for a tilted view. The map follows the real time and weather in Bansalan: morning, evening, night and rain.'],
  ['search', 'Pick where you go', 'Search any street, barangay, shop or hotel. The card shows how long it takes to walk or ride, and the fare.'],
  ['vehicle', 'Know who to ask', 'Tricycle and pedicab wait at the waiting spots on the map. Farm motorcycles wait at the Public Market and have no fixed fare: ask the driver.'],
  ['calc', 'Check the price', 'Fare list and Fare check show prices for students, seniors, PWD and adults. Sign in to see your own fare everywhere.'],
  ['clock', 'Buses and vans', 'Big buses and vans go to the cities, mini buses to the towns. Turn on Ride alerts to get a notice before the first and last ride.'],
  ['alert', 'Something wrong?', 'Use Report a problem or Help us add data in the Menu. Real prices from riders make the app better for everyone.'],
]
// A short guide with pictures-in-words, for first-time users.
export function HowTo() {
  return (
    <>
      <YHeader title="How it works" back={<BackButton to="menu" />} />
      <div className="body">
        <p className="lede">Six steps. You can use all of it as a guest.</p>
        {STEPS.map(([icon, h, t], i) => (
          <section className="card how" key={h}>
            <span className="how-n">{i + 1}</span>
            <span className="how-ico"><Icon name={icon} /></span>
            <div><h2 className="sec">{h}</h2><p>{t}</p></div>
          </section>
        ))}
      </div>
    </>
  )
}

// A printable poster for a waiting spot: a QR code that opens the group's page, so riders need no app and drivers need no phone.
export function Poster() {
  const { params } = useApp()
  const s = stationById(params.id) ?? stations[0]
  const p = stationPlace(s)
  const [svg, setSvg] = useState('')
  const url = `${window.location.origin}/#/station/${s.id}`
  useEffect(() => { QRCode.toString(url, { type: 'svg', margin: 1, width: 280, errorCorrectionLevel: 'M' }).then(setSvg) }, [url])
  return (
    <>
      <YHeader title="Poster" back={<BackButton to="station" params={{ id: s.id }} />} />
      <div className="body sheet-page">
        <section className="poster">
          <Trike width={120} height={82} />
          <h1>{s.name}</h1>
          {p && <p className="poster-sub">Waits at {p.name}</p>}
          <div className="poster-qr" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="poster-cta">Scan to see the fares, where this group goes and who to call.</p>
          <p className="poster-url">{url.replace(/^https?:\/\//, '')}</p>
          <b className="poster-brand">BansaRide</b>
        </section>
        <button className="btn no-print" onClick={() => window.print()}><Icon name="check" />Print the poster</button>
        <p className="hint no-print">Print it, put it in a plastic sleeve, and stick it at the waiting spot. The QR opens the live page, so changes show up on their own.</p>
      </div>
    </>
  )
}
