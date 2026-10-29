import { useApp, BackButton, Icon, Trike, YHeader } from '../components'
import { places, routes, stations, towns } from '../data'

// The full menu: every part of the app with what is inside it, plus how the data works.
export default function Menu() {
  const { go, lang, setLang, online, textSize, setTextSize, t } = useApp()
  const tric = routes.filter((r) => r.vehicle !== 'Motor').length
  const moto = routes.filter((r) => r.vehicle === 'Motor').length
  const streets = places.filter((p) => p.kind === 'Street').length
  const rural = places.filter((p) => p.kind === 'Barangay' || p.kind === 'Sitio').length
  const groups = stations.filter((s) => s.type === 'toda' && !s.streetSpot && !s.id.startsWith('spot-osm')).length
  const streetSpots = stations.filter((s) => s.streetSpot).length

  const items = [
    { title: 'Rides and places', rows: [
      { icon: 'routes', tone: 'blue', name: 'All routes', detail: `${routes.length} real road routes: ${tric} by tricycle or pedicab, ${moto} by motorcycle`, to: ['routes'] },
      { icon: 'vehicle', tone: 'gold', name: 'Tricycle and pedicab', detail: 'The same ride here. Fares are estimates by distance', to: ['routes', { id: 'Tricycle' }] },
      { icon: 'moto', tone: 'green', name: 'Motorcycles', detail: `${moto} upland routes. They stay at the Public Market. Ask the driver for the fare`, to: ['routes', { id: 'Motor' }] },
      { icon: 'road', tone: 'orange', name: 'Streets and roads', detail: `${streets} streets, including Curvada Street (Dama de Noche Street)`, to: ['routes', { id: 'Streets' }] },
      { icon: 'town', tone: 'red', name: 'Barangays and sitios', detail: `${rural} barangays and mountain sitios, with their elevation`, to: ['routes', { id: 'Barangays' }] },
      { icon: 'map', tone: 'blue', name: 'Other towns', detail: `${towns.length} towns and cities from Digos to Cotabato City: distance and travel time`, to: ['towns'] },
    ] },
    { title: 'Drivers and waiting spots', rows: [
      { icon: 'drivers', tone: 'gold', name: 'BTODA groups', detail: `${groups} groups, with members and contacts where shared`, to: ['drivers'] },
      { icon: 'pin', tone: 'blue', name: 'Street waiting spots', detail: `${streetSpots} spots on streets and roads. Open one to see where it is`, to: ['drivers'] },
      { icon: 'plus', tone: 'green', name: 'Add a waiting spot', detail: 'Mark the exact place on the map and send it so everyone can see it', to: ['map'] },
    ] },
    { title: 'You', rows: [
      { icon: 'town', tone: 'green', name: 'Visiting Bansalan', detail: 'First time here? Where to arrive, where tricycles wait and what to expect', to: ['visitor'] },
      { icon: 'alert', tone: 'red', name: 'Report a problem', detail: 'Wrong fare, place, time or number? Tell us so we can fix it', to: ['report'] },
      { icon: 'drivers', tone: 'blue', name: 'Account and discount', detail: 'Students, seniors and PWD: sign in to see your own fare everywhere', to: ['account'] },
    ] },
    { title: 'Tools', rows: [
      { icon: 'ruler', tone: 'coral', name: 'Fare list', detail: 'Common fares on one page. Works offline. Print it or save it as a PDF', to: ['farelist'] },
      { icon: 'calc', tone: 'coral', name: 'Fare check', detail: 'Estimate a fare, split it between riders and check a price', to: ['fares'] },
      { icon: 'search', tone: 'blue', name: 'Find on the map', detail: 'Search any street, barangay or place and see the nearest drivers', to: ['map'] },
    ] },
  ]

  return (
    <>
      <YHeader title="Menu" back={<BackButton to="home" />} />
      <div className="body">
        {items.map((g) => (
          <section key={g.title}>
            <h2 className="sec">{t(g.title)}</h2>
            <div className="list">
              {g.rows.map((r, i) => (
                <button key={r.name} className="row-item menu-row rise" style={{ '--i': i }} onClick={() => go(...r.to)}>
                  <span className={'ico ' + r.tone}><Icon name={r.icon} /></span>
                  <span className="row-main"><span className="row-title">{t(r.name)}</span><span className="row-sub">{r.detail}</span></span>
                  <Icon name="chevron" className="chev" />
                </button>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="sec">Settings</h2>
          <div className="card form">
            <div className="row-between">
              <div><span className="lbl">Language</span><span className="row-sub">Bisaya text is a sample for now</span></div>
              <div className="lang size" role="group" aria-label="Text size">
                {[['normal', 'A'], ['large', 'A+'], ['xlarge', 'A++']].map(([id, label]) => <button key={id} aria-pressed={textSize === id} onClick={() => setTextSize(id)} aria-label={`Text size ${id}`}>{label}</button>)}
              </div>
              <div className="lang" role="group" aria-label="Language">
                <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
                <button aria-pressed={lang === 'bis'} onClick={() => setLang('bis')}>BIS</button>
              </div>
            </div>
            <div className="row-between">
              <div><span className="lbl">Offline</span><span className="row-sub">{online ? 'Routes and places are saved on this phone' : 'You are offline. Saved info is shown'}</span></div>
              <span className={'live ' + (online ? 'on' : 'off')}><i aria-hidden="true" />{online ? 'Ready' : 'Offline'}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="sec">About BansaRide</h2>
          <div className="card about">
            <Trike width={96} height={66} />
            <p><b>A ride and fare guide for Bansalan, Davao del Sur.</b></p>
            <ul>
              <li><b>Real:</b> places, streets and barangays (OpenStreetMap), road routes and distances (OSRM) and the map.</li>
              <li><b>Estimates:</b> fares and travel times, until they are confirmed at the terminals. Motorcycle fares are "ask the driver".</li>
              <li><b>To confirm:</b> group names, exact waiting spots and the positions marked approximate.</li>
              <li><b>Rule:</b> maps and routes cover Bansalan only. Other towns show distance and time.</li>
            </ul>
            <p className="row-sub">Map data © OpenStreetMap contributors.</p>
          </div>
        </section>
      </div>
    </>
  )
}
