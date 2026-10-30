import { useMemo, useState } from 'react'
import { useApp, BackButton, Icon, RouteRow, Tag, StatusTag, StandPill, ClosedNotice, YHeader, Trike, Moto } from '../components'
import MapView from '../MapView'
import Feedback from '../Feedback'
import { standNow, nearestStands, stations, stationById, stationConfirmed, stationStatus, stationVerified, stationPlace, routes, shortName, metersBetween, bearingTo, compassName, walkMinutes, walkRoute } from '../data'
import { fmtDist } from './RouteScreens'

const kindLabel = (s) => (s.type === 'motor' ? 'Motorcycles' : 'Tricycle / pedicab')
const formatPhone = (n) => n.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3')
// Phone links do not always work inside a browser, so the number can also be copied.
function copyNumber(n, say) {
  const done = () => say(`Copied ${formatPhone(n)}`)
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(n).then(done, () => say(`Number: ${formatPhone(n)}`))
  else say(`Number: ${formatPhone(n)}`)
}

function StationRow({ s, onOpen, index }) {
  const p = stationPlace(s)
  return (
    <button className="row-item rise" style={{ '--i': Math.min(index, 8) }} onClick={() => onOpen(s.id)}>
      {s.type === 'motor' ? <span className="badge-line moto"><Moto width={34} height={24} /></span> : <span className="badge-line trike"><Trike width={34} height={24} /></span>}
      <span className="row-main">
        <span className="row-title">{s.name}</span>
        <span className="row-sub">{p ? `At ${p.name}` : 'Location needed'} · {kindLabel(s)}{s.members?.length ? ` · ${s.members.length} members` : ''}</span>
      </span>
      <StandPill s={s} />
      <Icon name="chevron" className="chev" />
    </button>
  )
}

// Driver groups (BTODA) and motorcycles stands.
export function DriversList() {
  const { go } = useApp()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('All')
  const term = q.trim().toLowerCase()
  const match = (s) => !term || s.name.toLowerCase().includes(term) || (s.alias && s.alias.toLowerCase().includes(term)) || (s.contact && s.contact.name.toLowerCase().includes(term)) || (stationPlace(s)?.name.toLowerCase().includes(term))
  const toda = stations.filter((s) => s.type === 'toda' && !s.streetSpot && match(s))
  const streetSpots = stations.filter((s) => s.streetSpot && match(s))
  const motor = stations.filter((s) => s.type === 'motor' && match(s))
  const open = (id) => go('station', { id })
  const showToda = (kind === 'All' || kind === 'Tricycle') && toda.length > 0
  const showStreets = (kind === 'All' || kind === 'Streets') && streetSpots.length > 0
  const showMotor = (kind === 'All' || kind === 'Motor') && motor.length > 0
  return (
    <>
      <YHeader title="Drivers">
        <label className="search-input">
          <Icon name="search" />
          <input type="search" placeholder="Search a group or place" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </label>
      </YHeader>
      <div className="body">
        <p className="lede">Where the tricycle and pedicab groups (BTODA) and the motorcycles wait. Motorcycles are for the mountain areas. Tap a group to see where it goes and how to get there.</p>
        <div className="chips scroll" role="group" aria-label="Filter">
          {[['All', 'All'], ['Tricycle', 'BTODA groups'], ['Streets', 'Street spots'], ['Motor', 'Motorcycles']].map(([k, label]) => (
            <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{label}</button>
          ))}
        </div>
        {!showToda && !showStreets && !showMotor && <p className="hint">No group matches “{q}”.</p>}
        {showToda && (
          <section>
            <h2 className="sec">Tricycle and pedicab · BTODA groups</h2>
            <div className="list">{toda.map((s, i) => <StationRow key={s.id} s={s} onOpen={open} index={i} />)}</div>
          </section>
        )}
        {showStreets && (
          <section>
            <h2 className="sec">Waiting spots on streets and roads · {streetSpots.length}</h2>
            <div className="list">{streetSpots.map((s, i) => <StationRow key={s.id} s={s} onOpen={open} index={i} />)}</div>
          </section>
        )}
        {showMotor && (
          <section>
            <h2 className="sec">Motorcycles</h2>
            <div className="list">{motor.map((s, i) => <StationRow key={s.id} s={s} onOpen={open} index={i} />)}</div>
          </section>
        )}
        <div className="note static">
          <Icon name="info" />
          <span><b>Help us confirm these</b><span className="row-sub">Group names, exact waiting spots and contact people still need to be confirmed with the drivers. Only add a phone number with the driver's permission.</span></span>
        </div>
      </div>
    </>
  )
}

// One group: where it waits, where it goes, how to get there.
export function Station() {
  const { go, params, loc, retryLocation } = useApp()
  const s = stationById(params.id) ?? stations[0]
  const p = stationPlace(s)
  // live: updates as the person moves
  const me = loc.state === 'ok' ? loc.ll : null
  const dist = me && p ? metersBetween(me, [p.lat, p.lon]) : null
  const bearing = me && p ? bearingTo(me, [p.lat, p.lon]) : null
  const [walk, setWalk] = useState(null) // directions shown inside the app: { state, data }
  const showDirections = () => {
    if (!me || !p) { retryLocation(); say('Turn on your location to get directions.'); return }
    setWalk({ state: 'loading' })
    walkRoute(me, [p.lat, p.lon]).then((data) => setWalk({ state: 'ok', data }), () => setWalk({ state: 'error' }))
  }
  const markers = useMemo(() => (p ? [{ id: p.id, lat: p.lat, lon: p.lon, kind: 'spot', label: '', title: p.name }] : []), [p])
  const links = useMemo(() => (me && p && walk?.state !== 'ok' ? [[me, [p.lat, p.lon]]] : []), [me, p, walk])
  const now = standNow(s) // drivers around, a few, closed or not known
  const nearOpen = now.state === 'closed' && p ? nearestStands([p.lat, p.lon], 1, 'toda')[0] : null
  const goes = routes.filter((r) => p && (r.from === p.id || r.to === p.id) && (s.type === 'motor' ? r.vehicle === 'Motor' : r.vehicle !== 'Motor'))

  return (
    <>
      {p ? (
        <div className="mapbox short">
          <MapView markers={markers} zoom={17} me={me} links={links} route={walk?.state === 'ok' ? walk.data.path : undefined} routeColor="#1560F0" label={`Map of where ${s.name} waits`} />
          <div className="float l"><BackButton /></div>
        </div>
      ) : (
        <div className="noloc">
          <BackButton />
          <p><b>Location needed</b>This group is not on the map yet. Tell us where it waits and we will add it.</p>
        </div>
      )}
      <div className="sheet station-sheet">
        <div className="grab" aria-hidden="true" />
        <div>
          <div className="mapcard-tags">
            <Tag tone={s.type === 'motor' ? 'green' : 'gold'}>{kindLabel(s)}</Tag>
            {stationVerified(s) && <Tag tone="green">Verified by BTODA</Tag>}
            <StatusTag status={stationStatus(s)} />
            {s.source === 'generated' && <Tag tone="grey">Group name to confirm</Tag>}
            {s.pos?.approx && <Tag tone="grey">Approximate position</Tag>}
          </div>
          <div className="st-hero">
            <span className="st-badge">{s.type === 'motor' ? <Moto width={64} height={44} /> : <Trike width={64} height={44} />}</span>
            <div className="st-titles"><h1 className="route-title">{s.name}</h1><StandPill s={s} /></div>
          </div>
          {s.alias && <p className="row-sub">Also called {s.alias}</p>}
          <p className="row-sub">{p ? `Waits at ${p.name}${s.landmark ? ` · ${s.landmark}` : ''}` : 'Waiting spot not on the map yet'}</p>
        </div>

        <ClosedNotice now={now} near={nearOpen} onNear={() => nearOpen && go('station', { id: nearOpen.station.id })} />

        {p && (
          <div className={'nav-card' + (now.state === 'closed' ? ' dimmed' : '')} aria-disabled={now.state === 'closed'}>
            <div className="row between">
              <div>
                <span className="stat-k">How far from you</span>
                <b className="nav-dist">{dist !== null ? fmtDist(dist) : loc.state === 'finding' ? 'Finding you…' : 'Location is off'}</b>
                {dist !== null && <span className="row-sub"><Icon name="arrow" className="inline" style={{ transform: `rotate(${Math.round(bearing - 90)}deg)` }} /> {compassName(bearing)} · about {walkMinutes(dist)} min walk · within {loc.accuracy} m</span>}
              </div>
              {dist === null && <button className="pill action" onClick={retryLocation}><Icon name="locate" />Find me</button>}
            </div>
            <div className="cta-row">
              <button className="btn" onClick={() => go('map', { id: s.placeId ?? s.id })}><Icon name="map" />Show on map</button>
              <button className="btn secondary" onClick={walk?.state === 'ok' ? () => setWalk(null) : showDirections} disabled={walk?.state === 'loading'}><Icon name="arrow" />{walk?.state === 'loading' ? 'Finding the way…' : walk?.state === 'ok' ? 'Hide directions' : 'Directions'}</button>
            </div>
            {walk?.state === 'error' && <p className="hint">Could not get directions. They need a signal. The dashed line on the map still points to the stand.</p>}
            {walk?.state === 'ok' && (
              <div className="steps">
                <p className="steps-head"><b>{fmtDist(walk.data.meters)}</b> · about {walk.data.minutes} min walk</p>
                <ol>{walk.data.steps.map((st, n) => <li key={n}><span>{st.text}</span>{st.meters > 0 && <em>{fmtDist(st.meters)}</em>}</li>)}</ol>
              </div>
            )}
            {!walk && <p className="hint">Directions are drawn on this map as a walking route from where you are. They need a signal.</p>}
          </div>
        )}

        {s.type === 'motor' && (
          <div className="note static">
            <Icon name="info" />
            <span><b>Ask the driver</b><span className="row-sub">The motorcycles stay at the Public Market. Ask the driver for the fare and where they will take you. BansaRide shows the route to follow.</span></span>
          </div>
        )}

        <section>
          <h2 className="sec">Where they go</h2>
          {s.type === 'motor' ? (
            <div className="list">
              {s.serves.map((x) => (
                x.routeId
                  ? <button key={x.label} className="row-item compact" onClick={() => go('route', { id: x.routeId })}><span className="row-main"><span className="row-title">{x.label}</span><span className="row-sub">See the road and distance</span></span><Icon name="chevron" className="chev" /></button>
                  : <div key={x.label} className="row-item compact static"><span className="row-main"><span className="row-title">{x.label}</span><span className="row-sub">{x.note}</span></span></div>
              ))}
            </div>
          ) : goes.length > 0 ? (
            <div className="list">{goes.map((r, i) => <RouteRow key={r.id} route={r} onOpen={(id) => go('route', { id })} index={i} />)}</div>
          ) : (
            <p className="hint">{p ? `No fixed routes are listed from ${p.name} yet. Riders here take passengers to nearby places. Ask the driver.` : 'Routes will show once the location is added.'}</p>
          )}
        </section>

        <Feedback scope={{ stationId: s.id }} />

        <button className="btn secondary" onClick={() => go('poster', { id: s.id })}><Icon name="check" />Make a poster for this stand</button>

        <section className="contact-card">
          <h2 className="sec">Contact</h2>
          {s.contact ? (
            <div className="contact-person">
              <span className="avatar-lg" aria-hidden="true">{s.contact.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
              <span className="row-main">
                <b>{s.contact.name}</b>
                <span className="row-sub">{s.contact.org}</span>
                <span className="phone-num">{formatPhone(s.contact.phone)}</span>
              </span>
            </div>
          ) : (
            <p className="row-sub">No contact number saved yet. Ask the group's president or a driver. Only add a number with the person's permission.</p>
          )}
          {s.contact && (
            <div className="cta-row">
              <a className="btn" href={`tel:${s.contact.phone}`}><Icon name="phone" />Call</a>
              <button className="btn secondary" onClick={() => copyNumber(s.contact.phone, say)}><Icon name="check" />Copy number</button>
            </div>
          )}
        </section>

        {s.members?.length > 0 && (
          <section>
            <h2 className="sec">Members · {s.members.length}</h2>
            <ul className="member-grid">
              {s.members.map((n) => <li key={n}><span className="mini-av" aria-hidden="true">{n.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>{n}</li>)}
            </ul>
            <p className="hint">Names shared by the group.</p>
          </section>
        )}
      </div>
    </>
  )
}
