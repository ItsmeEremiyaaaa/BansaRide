import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp, BackButton, Icon, RouteRow, Tag, CountUp, Trike, Moto, YHeader } from '../components'
import MapView from '../MapView'
import Picker from '../Picker'
import Transit from '../Transit'
import TransitPop from '../TransitPop'
import Feedback from '../Feedback'
import { useAuth } from '../auth'
import { MINI_PLACES, refineRoute, routeColor } from '../data'
import { places, placeById, shortName, routes, stations, stationsAt, stationPlace, stationById, nearestStand, nearestStands, bearingTo, compassName, walkMinutes, waitingSpots, vehicleLabel, fareText, fareFor, PASSENGERS, FARE_NOTE } from '../data'

const metersBetween = (a, b) => Math.round(Math.hypot((a[0] - b[0]) * 111000, (a[1] - b[1]) * 110000))
export const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`)
const isRural = (p) => p.kind === 'Barangay' || p.kind === 'Sitio'

// The drivers' stand for this kind of ride at a place (tricycle group or motorcycles).
const standFor = (placeId, vehicle) => stationsAt(placeId).find((s) => s.type === (vehicle === 'Motor' ? 'motor' : 'toda'))

export function RouteScreen() {
  const { go, say, saved, toggleSaved, remember, params, loc } = useApp()
  const r = routes.find((x) => x.id === params.id) ?? routes[0]
  const [rev, setRev] = useState(Boolean(params.rev))
  const isSaved = saved.includes(r.id)
  const fromId = rev ? r.to : r.from
  const toId = rev ? r.from : r.to
  const a = placeById(fromId), b = placeById(toId)
  const motor = r.vehicle === 'Motor'
  const stand = standFor(fromId, r.vehicle)
  const near = !stand && !motor ? nearestStand(a.lat, a.lon) : null // no stand here: the closest one
  const shown = stand ?? near?.station
  // live: where the person is, compared with this route's pickup and with the nearest stand
  const me = loc.state === 'ok' ? loc.ll : null
  const toPickup = me ? metersBetween(me, [a.lat, a.lon]) : null
  const pickupBearing = me ? bearingTo(me, [a.lat, a.lon]) : null
  const nearUser = me && !motor ? nearestStands(me, 1, 'toda')[0] : null
  const { discount } = useAuth()
  const [, setTick] = useState(0)
  const [refining, setRefining] = useState(!!r.via && !r.exact)
  // a joined route is replaced by the real direct road as soon as we have a signal
  useEffect(() => {
    if (!r.via || r.exact) return
    refineRoute(r).then(() => { setRefining(false); setTick((n) => n + 1) }, () => setRefining(false))
  }, [r])
  const path = useMemo(() => (rev ? [...r.path].reverse() : r.path), [r, rev, r.exact])
  const markers = useMemo(() => [
    { id: a.id, lat: a.lat, lon: a.lon, kind: 'start', label: 'Pickup', title: a.name },
    { id: b.id, lat: b.lat, lon: b.lon, kind: 'end', label: 'Drop-off', title: b.name },
  ], [a, b])
  useEffect(() => { remember(r.id) }, [r.id, remember])

  return (
    <>
      <div className="mapbox tall">
        <MapView route={path} routeColor={routeColor(r)} markers={markers} label={`Map of the route from ${a.name} to ${b.name}`} />
        <div className="float l"><BackButton /></div>
        <div className="float c"><span className="route-pill glass">{shortName(fromId)} <Icon name="arrow" className="inline" /> {shortName(toId)}</span></div>
        <div className="float r">
          <button className="icon-btn" aria-pressed={isSaved} aria-label={isSaved ? 'Remove saved route' : 'Save route'}
            onClick={() => { toggleSaved(r.id); say(isSaved ? 'Removed from saved routes' : 'Saved. Find it on Home.') }}>
            <Icon name="star" filled={isSaved} />
          </button>
        </div>
        {r.via && !r.exact && <div className="float c low"><span className="route-pill glass">{refining ? 'Finding the exact road…' : 'Estimated road'}</span></div>}
        <div className="map-summary glass">{r.km} km <i /> Est. {r.minutes} min <i /> {r.fare === null ? 'Ask the driver' : fareText(r)}</div>
      </div>
      <div className="sheet">
        <div className="grab" aria-hidden="true" />
        <div className="sheet-head">
          <h2 className="sheet-title">Your ride</h2>
          <button className="pill action" onClick={() => setRev((v) => !v)} aria-label="Switch to the return trip"><Icon name="repeat" />Return trip</button>
        </div>
        <div className="ride-row selected">
          <span className="ride-art">{motor ? <Moto width={78} height={54} /> : <Trike width={78} height={54} />}</span>
          <span className="ride-main"><b>{vehicleLabel(r.vehicle)}</b><span className="row-sub">{motor ? 'For the mountain roads. Ask the driver for the fare' : 'Same as a pedicab'}</span></span>
          <span className="ride-price"><span className="row-sub">{r.km} km</span></span>
        </div>

        {toPickup !== null && (
          <div className={'note live-note' + (toPickup <= 60 ? ' here' : '')} role="status">
            <Icon name="locate" />
            <span>
              <b>{toPickup <= 60 ? 'You are at the pickup' : 'Walk to the pickup first'}</b>
              <span className="row-sub">{toPickup <= 60 ? `${a.name} is right here.` : `${a.name} is ${fmtDist(toPickup)} ${compassName(pickupBearing)} of you, about ${walkMinutes(toPickup)} min walk. This updates as you move.`}</span>
            </span>
          </div>
        )}

        <div className="bigstats">
          <div className="big time"><span className="big-k">Travel time</span><b><CountUp value={r.minutes} /></b><span className="big-u">minutes</span></div>
          <div className="big cost"><span className="big-k">Fare</span>{r.fare === null ? <b className="ask">Ask</b> : <b className="range">{fareText(r)}</b>}<span className="big-u">{r.fare === null ? 'the driver' : 'by passenger'}</span></div>
        </div>

        {r.fare !== null && (
          <div className="card glass fare-table">
            <h2 className="sec">Fare by passenger</h2>
            {PASSENGERS.map((p) => <div className={'fare-row' + (p.id === discount ? ' mine' : '')} key={p.id}><span>{p.label}{p.id === discount ? ' · your fare' : ''}</span><b>₱{fareFor(r.km, p.id)}</b></div>)}
            <p className="hint">Near Bansalan the base fares are ₱10 to ₱20 (reported by riders). The farther the ride, the more it costs: Rizal is ₱30 to ₱40.</p>
          </div>
        )}

        <Feedback scope={{ routeId: r.id }} fare={r.fare !== null} />

        <button className="stand-card" onClick={() => (shown ? go('station', { id: shown.id }) : go('map', { id: fromId }))}>
          <span className="ico gold"><Icon name={motor ? 'moto' : 'vehicle'} /></span>
          <span className="row-main">
            <span className="tl-k">{stand ? 'Where the drivers wait' : "Nearest drivers' stand"}</span>
            <b>{shown ? shown.name : `Along the road near ${shortName(fromId)}`}</b>
            <span className="row-sub">{stand ? (stand.landmark || a.name) : near ? `${fmtDist(near.meters)} from ${shortName(fromId)}. You can also wave down a passing ride.` : 'Wave down a passing ride. No group stand is listed here yet.'}</span>
          </span>
          <Icon name="chevron" className="chev" />
        </button>

        {nearUser && nearUser.station.id !== shown?.id && (
          <button className="stand-card live" onClick={() => go('station', { id: nearUser.station.id })}>
            <span className="ico gold"><Icon name="vehicle" /></span>
            <span className="row-main"><span className="tl-k">Nearest stand to you · live</span><b>{nearUser.station.name}</b><span className="row-sub">{fmtDist(nearUser.meters)} {compassName(nearUser.bearing)} · about {walkMinutes(nearUser.meters)} min walk</span></span>
            <Icon name="chevron" className="chev" />
          </button>
        )}

        <div className="card glass route-card">
          <ol className="timeline">
            <li className="tl">
              <button onClick={() => go('map', { id: fromId })}>
                <span className="dot" aria-hidden="true" />
                <span className="tl-main"><span className="tl-k">Pickup point</span><b>{a.name}</b><span className="row-sub">{a.note}</span></span>
                <Icon name="chevron" className="chev" />
              </button>
            </li>
            <li className="tl end">
              <button onClick={() => go('place', { id: toId })}>
                <span className="dot" aria-hidden="true" />
                <span className="tl-main"><span className="tl-k">Drop off</span><b>{b.name}</b><span className="row-sub">{b.note}</span></span>
                <Icon name="chevron" className="chev" />
              </button>
            </li>
          </ol>
        </div>

        <p className="hint">{r.fare === null ? 'Motorcycles stay at the Public Market and go to the mountain areas. Ask the driver for the fare. This route shows the road to take.' : FARE_NOTE} The route follows real roads from OpenStreetMap. Tricycle and pedicab are the same ride.</p>
        <div className="cta-row">
          <button className="btn" onClick={() => go('map', { id: fromId })}><Icon name="pin" />See waiting spot</button>
          {r.fare === null
            ? <button className="btn secondary" onClick={() => go('drivers')}><Icon name="drivers" />Drivers</button>
            : <button className="btn secondary" onClick={() => go('fares', { id: r.id })}><Icon name="calc" />Check a price</button>}
        </div>
      </div>
    </>
  )
}

const FILTERS = [['All', 'All'], ['Tricycle', 'Tricycle'], ['Motor', 'Motorcycles'], ['Streets', 'Streets'], ['Barangays', 'Barangays'], ['Places', 'Places']]

export function RoutesList() {
  const { go, t, saved, params } = useApp()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState(FILTERS.some(([k]) => k === params.id) ? params.id : 'All')
  const open = (id) => go('route', { id })
  const term = q.trim().toLowerCase()
  const list = routes.filter((r) => !r.via && (() => {
    const dest = placeById(r.to)
    const okKind = kind === 'All'
      || (kind === 'Motor' && r.vehicle === 'Motor')
      || (kind === 'Tricycle' && r.vehicle !== 'Motor')
      || (kind === 'Streets' && dest.kind === 'Street')
      || (kind === 'Barangays' && isRural(dest))
      || (kind === 'Places' && !isRural(dest) && dest.kind !== 'Street')
    return okKind && (!term || dest.name.toLowerCase().includes(term) || (dest.also ?? '').toLowerCase().includes(term) || placeById(r.from).name.toLowerCase().includes(term))
  })())
  return (
    <>
      <YHeader title={t('routes')}>
        <label className="search-input">
          <Icon name="search" />
          <input type="search" placeholder="Search a street, barangay or place" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </label>
      </YHeader>
      <div className="body">
        <div className="chips scroll" role="group" aria-label="Filter">
          {FILTERS.map(([k, label]) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{label}</button>)}
        </div>
        {kind === 'Motor' && <div className="note static"><Icon name="moto" /><span><b>Motorcycles are for the mountain areas</b><span className="row-sub">They stay at the Public Market. Ask the driver for the fare. BansaRide shows the road to follow.</span></span></div>}
        <div className="list">
          {list.length === 0 && <p className="hint">No routes match “{q}”.</p>}
          {list.map((r, i) => <RouteRow key={r.id} route={r} onOpen={open} isSaved={saved.includes(r.id)} index={i} />)}
        </div>
        <button className="note" onClick={() => go('towns')}>
          <Icon name="town" />
          <span><b>Going to another town?</b><span className="row-sub">See the distance and travel time to Digos, Davao City, Kidapawan, Cotabato City and every town in Davao del Sur.</span></span>
          <Icon name="chevron" className="chev" />
        </button>
      </div>
    </>
  )
}

export function MapScreen() {
  const { go, say, params, loc, retryLocation } = useApp()
  const [sel, setSel] = useState(params.id ?? 'terminal')
  const me = loc.state === 'ok' ? loc.ll : null // live
  const [focusPt, setFocusPt] = useState(null)
  const [cardH, setCardH] = useState(0) // the card's real height, so the place can be centred in the part of the map you can see
  const cardRef = useCallback((el) => {
    if (!el) { setCardH(0); return }
    setCardH(el.offsetHeight)
    new ResizeObserver(() => setCardH(el.offsetHeight)).observe(el)
  }, [])
  const [more, setMore] = useState(false) // the card starts small so the map stays visible; this opens the rides and drivers
  const [card, setCard] = useState(!!params.id) // the details card opens only when a place is chosen, and can be closed
  const [finding, setFinding] = useState(false) // the search picker
  const [adding, setAdding] = useState(false) // "add a waiting spot" mode
  const [draft, setDraft] = useState(null)
  const p = placeById(sel) ?? (stationById(sel) ? stationPlace(stationById(sel)) : null) ?? placeById('terminal')
  const from = routes.filter((r) => r.from === p.id)
  const here = stationsAt(p.id)
  const spot = waitingSpots[p.id]
  const dist = me ? metersBetween(me, [p.lat, p.lon]) : null
  const start = useMemo(() => [p.lat, p.lon], []) // eslint-disable-line react-hooks/exhaustive-deps
  const isStreet = p.kind === 'Street'
  const nb = isStreet ? nearestStand(p.lat, p.lon) : null

  // Every waiting spot is a pin: places with a group, and stands with their own exact position.
  const markers = useMemo(() => [
    ...places.filter((x) => x.kind !== 'Street' || x.id === sel || waitingSpots[x.id]).map((x) => ({
      id: x.id, lat: x.lat, lon: x.lon, title: x.name,
      kind: x.id === sel ? 'sel' : waitingSpots[x.id] ? 'spot' : 'place',
      // the Bus Terminal shows a bus and the Public Market a mini bus (they wait there); other spots show the pedicab or motorcycle
      glyph: x.kind === 'Terminal' ? 'bus' : x.id === 'market' ? 'mini' : waitingSpots[x.id] ? (stationsAt(x.id).length > 0 && stationsAt(x.id).every((s) => s.type === 'motor') ? 'moto' : 'vehicle') : x.kind === 'Street' ? null : x.kind,
      label: x.id === sel && x.kind !== 'Barangay' && x.kind !== 'Sitio' ? shortName(x.id) : '',
    })),
    ...stations.filter((s) => !s.placeId && s.pos).map((s) => ({ id: s.id, lat: s.pos.lat, lon: s.pos.lon, title: s.name, kind: 'spot', label: '', glyph: s.type === 'motor' ? 'moto' : 'vehicle' })),
  ], [sel])
  const focus = useMemo(() => focusPt ?? [p.lat, p.lon], [p, focusPt])
  const nearMe = me ? nearestStands(me, 1)[0] : null
  // dashed lines: from a street to its nearest stand, and from you to the stand nearest to you
  const links = useMemo(() => {
    const out = []
    if (p.kind === 'Street') {
      const n = nearestStand(p.lat, p.lon)
      const sp = n && stationPlace(n.station)
      if (sp) out.push([[p.lat, p.lon], [sp.lat, sp.lon]])
    }
    const nm = me ? nearestStands(me, 1)[0] : null
    if (nm) out.push([me, [nm.place.lat, nm.place.lon]])
    return out
  }, [p, me])

  const onPick = (id) => { setFocusPt(null); if (placeById(id)) { setSel(id); setCard(true); setMore(false) } else go('station', { id }) }
  const locate = () => { if (me) setFocusPt([me[0], me[1]]); else { retryLocation(); say('Looking for your location…') } }

  // helper to share an exact stand position
  const nearestOf = (ll, test) => places.filter(test).map((x) => ({ x, m: metersBetween(ll, [x.lat, x.lon]) })).sort((u, v) => u.m - v.m)[0]
  const draftStreet = draft && nearestOf(draft, (x) => x.kind === 'Street')
  const draftPlace = draft && nearestOf(draft, (x) => x.kind !== 'Street' && x.kind !== 'Sitio')
  const copyDraft = () => {
    const [la, lo] = draft.map((n) => n.toFixed(6))
    const text = [
      'BansaRide waiting spot',
      `Position: ${la}, ${lo}`,
      draftStreet ? `Near street: ${draftStreet.x.name} (about ${draftStreet.m} m)` : '',
      draftPlace ? `Near place: ${draftPlace.x.name} (about ${draftPlace.m} m)` : '',
      `Map: https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=19/${la}/${lo}`,
      'Group / driver name: ',
    ].filter(Boolean).join('\n')
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => say('Copied. Send it to the app maker.'), () => say(text))
    else say(text)
  }

  return (
    <div className="mapfill">
      <MapView markers={markers} center={start} focus={focus} zoom={15} fit={false} me={me} onPick={onPick} links={links} draft={draft}
        onMapClick={adding ? setDraft : undefined} cluster offsetY={cardH ? Math.round((cardH + 98) / 2) : 0} zoomControl label="Map of waiting spots and places in Bansalan" />
      <button className="map-search" onClick={() => setFinding(true)} aria-label="Search a street or place on the map">
        <Icon name="search" /><span className={sel === 'terminal' && !params.id ? 'ph' : ''}>{params.id || sel !== 'terminal' ? p.name : 'Search a street or place'}</span>
      </button>
      <div className="float r col">
        <button className="icon-btn" aria-label="Show my location" onClick={() => locate()}><Icon name="locate" /></button>
        <button className={'icon-btn' + (adding ? ' on' : '')} aria-pressed={adding} aria-label="Add a waiting spot" onClick={() => { setAdding((v) => !v); setDraft(null); setCard(false) }}><Icon name="plus" /></button>
      </div>

      {adding ? (
        <section className="mapcard" key="adding" ref={cardRef}>
          <div className="mapcard-top">
            <div>
              <div className="mapcard-tags"><Tag tone="gold">Add a waiting spot</Tag></div>
              <h1 className="mapcard-title">{draft ? 'Spot marked' : 'Tap the map'}</h1>
              <p className="row-sub">{draft ? `${draft[0].toFixed(5)}, ${draft[1].toFixed(5)}` : 'Tap exactly where the drivers wait, or stand there and use your location.'}</p>
            </div>
            <button className="icon-btn flat" aria-label="Close" onClick={() => { setAdding(false); setDraft(null) }}><Icon name="close" /></button>
          </div>
          {draft && <p className="row-sub">{draftStreet ? `Near ${draftStreet.x.name} · about ${fmtDist(draftStreet.m)}` : ''}{draftPlace ? ` · ${draftPlace.x.name} ${fmtDist(draftPlace.m)} away` : ''}</p>}
          <div className="cta-row">
            <button className="btn secondary" onClick={() => (me ? setDraft(me) : locate())}><Icon name="locate" />Use my location</button>
            <button className="btn" disabled={!draft} onClick={copyDraft}><Icon name="check" />Copy details</button>
          </div>
          <p className="hint">Send the copied details to the app maker. The exact spot is then added to the map for everyone.</p>
        </section>
      ) : card && (
        <section className="mapcard" aria-live="polite" key={p.id} ref={cardRef}>
          <div className="mapcard-top">
            <div>
              <div className="mapcard-tags">
                {spot ? <Tag tone="gold">Waiting spot</Tag> : <Tag tone="grey">{p.kind}</Tag>}
                {spot && !spot.confirmed && <Tag>To confirm</Tag>}
              </div>
              <h1 className="mapcard-title">{p.name}</h1>
              <p className="row-sub">{p.note}{dist !== null ? ` · ${fmtDist(dist)} from you` : ''}</p>
            </div>
            <span className="mapcard-btns">
              <button className="icon-btn flat" aria-label={`Details about ${p.name}`} onClick={() => go('place', { id: p.id })}><Icon name="info" /></button>
              <button className="icon-btn flat" aria-label="Close" onClick={() => setCard(false)}><Icon name="close" /></button>
            </span>
          </div>
          <button className="mapcard-more" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? 'Hide rides and drivers' : 'Show rides and drivers'}<Icon name="chevron" className={more ? 'up' : 'down'} /></button>
          {more && (<>
          {nearMe && (
            <button className="stand-card compact live" onClick={() => go('station', { id: nearMe.station.id })}>
              <span className="ico gold"><Icon name={nearMe.station.type === 'motor' ? 'moto' : 'vehicle'} /></span>
              <span className="row-main"><span className="tl-k">Nearest to you · live</span><b>{nearMe.station.name}</b><span className="row-sub">{fmtDist(nearMe.meters)} {compassName(nearMe.bearing)} · about {walkMinutes(nearMe.meters)} min walk</span></span>
              <Icon name="chevron" className="chev" />
            </button>
          )}
          {here.length > 0 && (
            <div className="stand-chips" role="group" aria-label="Driver groups waiting here">
              {here.map((s) => (
                <button key={s.id} className={'stand-chip ' + s.type} onClick={() => go('station', { id: s.id })}>
                  <Icon name={s.type === 'motor' ? 'moto' : 'vehicle'} />{s.type === 'motor' ? 'Motorcycles' : s.name}
                </button>
              ))}
            </div>
          )}
          {nb && (
            <button className="stand-card compact" onClick={() => go('station', { id: nb.station.id })}>
              <span className="ico gold"><Icon name="vehicle" /></span>
              <span className="row-main"><span className="tl-k">Nearest drivers' stand</span><b>{nb.station.name}</b><span className="row-sub">{fmtDist(nb.meters)} from this street</span></span>
              <Icon name="chevron" className="chev" />
            </button>
          )}
          {from.length > 0 ? (
            <div className="list tight">
              {from.slice(0, 2).map((r) => (
                <button key={r.id} className="row-item compact" onClick={() => go('route', { id: r.id })}>
                  <span className="row-main"><span className="row-title">To {shortName(r.to)}</span><span className="row-sub">{vehicleLabel(r.vehicle)} · {r.km} km · ~{r.minutes} min</span></span>
                  {r.fare === null ? <Tag>Ask driver</Tag> : <span className="price">{fareText(r)}</span>}<Icon name="chevron" className="chev" />
                </button>
              ))}
              {from.length > 2 && <p className="hint tight-hint">+{from.length - 2} more routes from here. See Routes.</p>}
            </div>
          ) : (
            <button className="row-item compact" onClick={() => { const hit = routes.find((r) => r.to === p.id); if (hit) go('route', { id: hit.id, rev: true }); else say('No routes here yet.') }}>
              <span className="row-main"><span className="row-title">Ride from here</span><span className="row-sub">See the return trip to the {routes.find((r) => r.to === p.id)?.vehicle === 'Motor' ? 'Public Market' : 'Bus Terminal'}</span></span><Icon name="chevron" className="chev" />
            </button>
          )}
          <p className="legend"><span className="lg spot" />Waiting spot <span className="lg place" />Other place</p>
          </>)}
        </section>
      )}

      {finding && <Picker title="Find on the map" selectedId={sel} onPick={(id) => { setFinding(false); onPick(id) }} onClose={() => setFinding(false)} />}
    </div>
  )
}

export function Place() {
  const { go, params } = useApp()
  const p = placeById(params.id) ?? places[0]
  const ways = routes.filter((r) => r.to === p.id || r.from === p.id)
  const here = stationsAt(p.id)
  const markers = useMemo(() => [{ id: p.id, lat: p.lat, lon: p.lon, kind: 'end', label: '', title: p.name }], [p])
  const nb = here.length === 0 && p.kind !== 'Terminal' ? nearestStand(p.lat, p.lon) : null
  return (
    <>
      {MINI_PLACES.includes(p.id) && <TransitPop modes={['mini']} name={p.name} />}
      <div className="mapbox short">
        <MapView markers={markers} zoom={17} label={`Map of ${p.name}`} />
        <div className="float l"><BackButton /></div>
      </div>
      <div className="sheet">
        <div className="grab" aria-hidden="true" />
        <div>
          <Tag tone="grey">{p.kind}</Tag>
          <h1 className="route-title" style={{ marginTop: 8 }}>{p.name}</h1>
          <p className="row-sub">{p.note}{p.also ? ` · also ${p.also}` : ''}. Opening hours: to be confirmed.</p>
        </div>
        {here.length > 0 && (
          <section>
            <h2 className="sec">Drivers waiting here</h2>
            <div className="list">
              {here.map((s) => (
                <button key={s.id} className="stand-card" onClick={() => go('station', { id: s.id })}>
                  <span className={'ico ' + (s.type === 'motor' ? 'green' : 'gold')}><Icon name={s.type === 'motor' ? 'moto' : 'vehicle'} /></span>
                  <span className="row-main"><b>{s.name}</b><span className="row-sub">{s.type === 'motor' ? 'Motorcycles for the mountain areas' : 'Tricycle and pedicab group'}</span></span>
                  <Icon name="chevron" className="chev" />
                </button>
              ))}
            </div>
          </section>
        )}
        {MINI_PLACES.includes(p.id) && ways[0] && (
          <section>
            <h2 className="sec">Mini bus</h2>
            <div className="card"><Transit modes={['mini']} km={ways[0].km} /></div>
            <p className="hint">A mini bus also goes here. Hours are reported by riders, the fare is calculated.</p>
          </section>
        )}
        {nb && (
          <section>
            <h2 className="sec">Nearest drivers' stand</h2>
            <button className="stand-card" onClick={() => go('station', { id: nb.station.id })}>
              <span className="ico gold"><Icon name="vehicle" /></span>
              <span className="row-main"><b>{nb.station.name}</b><span className="row-sub">{fmtDist(nb.meters)} away. Tricycle and pedicab group</span></span>
              <Icon name="chevron" className="chev" />
            </button>
          </section>
        )}
        <Feedback scope={{ placeId: p.id }} />
        <section>
          <h2 className="sec">Rides</h2>
          {ways.length === 0 && <p className="hint">No routes to this place yet. We are adding more.</p>}
          <div className="list">{ways.map((r, i) => <RouteRow key={r.id} route={r} onOpen={(id) => go('route', { id })} index={i} />)}</div>
        </section>
        <button className="btn" onClick={() => go('map', { id: p.id })}><Icon name="pin" />See on the map</button>
      </div>
    </>
  )
}
