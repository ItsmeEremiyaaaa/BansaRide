import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp, BackButton, Icon, RouteRow, Tag, StatusTag, StandPill, ClosedNotice, CountUp, Trike, Moto, YHeader } from '../components'
import MapView from '../MapView'
import { lazy, Suspense } from 'react'
const NO_LINKS = []
const Map3D = lazy(() => import('../Map3D')) // the 3D engine loads only when you switch to 3D
import Picker from '../Picker'
import Transit from '../Transit'
import { shareText, speak } from '../speech'
import FromYou from '../FromYou'
import RainOverlay from '../RainOverlay'
import CloudOverlay from '../CloudOverlay'
import { useLook } from '../mood'
import WeatherChip from '../WeatherChip'
import { useExclusive } from '../popover'
import WeatherIcon from '../WeatherIcon'
import { rememberMap, recallMap } from '../mapMemo'
import { useRideFromMe } from '../rideFromMe'
import { track } from '../track'
import { useStored } from '../hooks'
import { routeBetween } from '../data'
import Feedback from '../Feedback'
import { useAuth } from '../auth'
import { MINI_PLACES, refineRoute, routeColor } from '../data'
import { motorPossible, standNow, placeStandNow, standActive, places, placeById, poiById, pois, POI_KINDS, nearestPlace, shortName, routes, stations, stationsAt, stationPlace, stationById, nearestStand, nearestStands, bearingTo, compassName, walkMinutes, waitingSpots, vehicleLabel, fareText, fareFor, PASSENGERS, FARE_NOTE } from '../data'

const metersBetween = (a, b) => Math.round(Math.hypot((a[0] - b[0]) * 111000, (a[1] - b[1]) * 110000))
export const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`)
const isRural = (p) => p.kind === 'Barangay' || p.kind === 'Sitio'

// The drivers' stand for this kind of ride at a place (tricycle group or motorcycles).
const standFor = (placeId, vehicle) => stationsAt(placeId).find((s) => s.type === (vehicle === 'Motor' ? 'motor' : 'toda'))

export function RouteScreen() {
  const look = useLook()
  const { go, say, saved, toggleSaved, remember, params, loc, t } = useApp()
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
  useEffect(() => { remember(r.id); track('route_open', r.id) }, [r.id, remember])

  return (
    <>
      <div className="mapbox tall">
        <MapView mood={look.mood} route={path} routeColor={routeColor(r)} markers={markers} label={`Map of the route from ${a.name} to ${b.name}`} />
        <div className="float l"><BackButton /></div>
        <div className="float c"><span className="route-pill glass">{me && !motor ? 'Your location' : shortName(fromId)} <Icon name="arrow" className="inline" /> {shortName(toId)}</span></div>
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
          <button className="pill action" onClick={() => setRev((v) => !v)} aria-label="Switch to the return trip"><Icon name="repeat" />{t('Return trip')}</button>
        </div>
        <div className="ride-row selected">
          <span className="ride-art">{motor ? <Moto width={78} height={54} /> : <Trike width={78} height={54} />}</span>
          <span className="ride-main"><b>{vehicleLabel(r.vehicle)}</b><span className="row-sub">{motor ? 'For the mountain roads. Ask the driver for the fare' : 'Same as a pedicab'}</span></span>
          <span className="ride-price"><span className="row-sub">{r.km} km</span></span>
        </div>

        <div className="cta-row">
          <button className="btn secondary" onClick={() => shareText('BansaRide', `BansaRide: ${a.name} to ${b.name}. ${r.km} km, about ${r.minutes} min by ${vehicleLabel(r.vehicle).toLowerCase()}. Fare: ${r.fare === null ? 'ask the driver' : fareText(r)}.${shown ? ` Wait at: ${shown.name}.` : ''} ${window.location.origin}/#/route/${r.id}`, say)}><Icon name="drivers" />{t('Share this ride')}</button>
          <button className="btn secondary" onClick={() => speak(`From ${a.name} to ${b.name}. ${r.km} kilometers, about ${r.minutes} minutes by ${vehicleLabel(r.vehicle).toLowerCase()}. ${r.fare === null ? 'Ask the driver for the fare.' : `An adult pays ${fareFor(r.km, 'adult')} pesos. A student pays ${fareFor(r.km, 'elementary')} to ${fareFor(r.km, 'college')} pesos.`}`, say)}><Icon name="info" />{t('Read aloud')}</button>
        </div>
        {motor && <div className={'note static' + (look.rain ? ' warn' : '')}>{look.rain && look.weather ? <WeatherIcon code={look.weather.code} size={28} /> : <Icon name="alert" />}<span><b>{look.rain ? (look.thunder ? 'Thunderstorm now: do not travel up the mountain' : look.level >= 2 ? 'Heavy rain now: ask first' : 'It is raining now: ask first') : 'Rain and mud'}</b><span className="row-sub">Mountain roads can be slippery or blocked after rain. Ask the driver if the road is passable before you go.</span></span></div>}

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

// Drag a bottom card down to dismiss it: it follows the finger, and lets go past 80 px (or a quick flick).
function dragDown(onClose) {
  let y0 = null, t0 = 0, el = null
  return {
    onPointerDown: (e) => { if (e.target.closest('button, a, input')) return; el = e.currentTarget; if (el.scrollTop > 0) return; y0 = e.clientY; t0 = performance.now() },
    onPointerMove: (e) => {
      if (y0 === null) return
      const dy = e.clientY - y0
      if (dy > 6) { try { el.setPointerCapture(e.pointerId) } catch { /* optional */ } el.style.transition = 'none'; el.style.transform = `translateY(${dy}px)` }
    },
    onPointerUp: (e) => {
      if (y0 === null) return
      const dy = e.clientY - y0, fast = dy / Math.max(1, performance.now() - t0) > 0.5
      y0 = null
      el.style.transition = 'transform .25s ease'
      if (dy > 80 || (fast && dy > 30)) { el.style.transform = 'translateY(120%)'; setTimeout(onClose, 200) } else el.style.transform = ''
    },
    onPointerCancel: () => { y0 = null; if (el) el.style.transform = '' },
  }
}

export function MapScreen() {
  const { go, say, params, loc, retryLocation } = useApp()
  const memo = useMemo(() => recallMap(), []) // what you had open before you left for a detail page (Back brings it back)
  const [sel, setSel] = useState(params.id ?? memo?.sel ?? null) // null = nothing picked yet: the map starts on where you are
  const me = loc.state === 'ok' ? loc.ll : null // live
  const [focusPt, setFocusPt] = useState(null)
  const [cardH, setCardH] = useState(0) // the card's real height, so the place can be centred in the part of the map you can see
  const cardRef = useCallback((el) => {
    if (!el) { setCardH(0); return }
    setCardH(el.offsetHeight)
    // opening or closing "rides and drivers" must not move the map: only the collapsed card's height is used for centring
    new ResizeObserver(() => { if (!el.querySelector('.mapcard-more[aria-expanded="true"]')) setCardH(el.offsetHeight) }).observe(el)
  }, [])
  const [poiKinds, setPoiKinds] = useState(memo?.poiKinds ?? []) // shops, hotels... switched on for the map
  const [filterOpen, setFilterOpen] = useState(false)
  const [view3d, setView3dRaw] = useState(() => sessionStorage.getItem('bansaride.view3d') === '1') // stays 3D when you come back from a stand or place page
  const setView3d = (f) => setView3dRaw((v) => { const n = typeof f === 'function' ? f(v) : f; try { sessionStorage.setItem('bansaride.view3d', n ? '1' : '0') } catch { /* optional */ } return n })
  const look = useLook()
  // Switching 2D <-> 3D is a crossfade: the map being left stays under the new one until the fade is finished, so nothing blank shows.
  const [ready3dFor, setReady3dFor] = useState(null) // the 3D map has drawn its first picture
  const [done3d, setDone3d] = useState(false) // ...and has finished fading in, so the flat map can go
  const [shown3d, setShown3d] = useState(view3d) // 3D stays mounted while it fades out and the flat map takes over
  const ready3d = view3d && ready3dFor === look.mood
  useEffect(() => {
    if (!ready3d) { setDone3d(false); return }
    const t = setTimeout(() => setDone3d(true), 750)
    return () => clearTimeout(t)
  }, [ready3d])
  useEffect(() => {
    if (view3d) { setShown3d(true); return }
    setReady3dFor(null)
    const t = setTimeout(() => setShown3d(false), 1500)
    return () => clearTimeout(t)
  }, [view3d])
  const goFromMap = (name, p) => { rememberMap({ sel, poiKinds }); go(name, p) }
  const toggleKind = (k) => setPoiKinds((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))
  const [more, setMore] = useState(false) // the card starts small so the map stays visible; this opens the rides and drivers
  const [card, setCard] = useState(!!params.id || !!memo?.sel) // the details card opens only when a place is chosen, and can be closed
  const [finding, setFinding] = useState(false) // the search picker
  const [adding, setAdding] = useState(false) // "add a waiting spot" mode
  const [draft, setDraft] = useState(null)
  // one thing open at a time: the weather card, the filter, the place card, the search and the add-a-spot panel close each other
  useExclusive('filter', filterOpen, () => setFilterOpen(false))
  useExclusive('card', card && !!sel, () => { setCard(false); setMore(false) })
  useExclusive('finding', finding, () => setFinding(false))
  useExclusive('adding', adding, () => { setAdding(false); setDraft(null) })
  const p = (sel && (placeById(sel) ?? poiById(sel) ?? (stationById(sel) ? stationPlace(stationById(sel)) : null))) || placeById('terminal') // only a stand-in until something is picked
  const from = routes.filter((r) => r.from === p.id)
  const spot = waitingSpots[p.id]
  const standState = placeStandNow(p.id) // drivers around now, a few, closed, or hours not known
  const nearOpen = standState?.state === 'closed' && me ? nearestStands(me, 1, 'toda')[0] : null
  const dist = me ? metersBetween(me, [p.lat, p.lon]) : null
  const start = useMemo(() => [p.lat, p.lon], []) // eslint-disable-line react-hooks/exhaustive-deps
  const isStreet = p.kind === 'Street'
  const isPoi = !!poiById(p.id) // a shop, hotel...: no group of its own, so show the nearest stand
  const nb = isStreet || isPoi ? nearestStand(p.lat, p.lon) : null

  // Every waiting spot is a pin: places with a group, and stands with their own exact position.
  const selPoiKey = sel && poiById(sel) ? sel : '' // only a picked shop or hotel adds a pin
  const ride = useRideFromMe(sel ? me : null, sel ? p : null) // the ride from where you are to the picked place
  const rideMoto = ride?.vehicle === 'Motor' // a motorcycle ride: the map draws motorcycles
  const markers = useMemo(() => [
    ...places.filter((x) => x.kind !== 'Street' || x.id === sel || waitingSpots[x.id]).map((x) => ({
      id: x.id, lat: x.lat, lon: x.lon, title: x.name, sub: waitingSpots[x.id] ? `${x.kind} · waiting spot` : x.kind,
      kind: waitingSpots[x.id] ? 'spot' : 'place', // the picked place is drawn bigger by the map itself (selId), so picking never changes this list
      closed: placeStandNow(x.id)?.state === 'closed',
      hoursUnknown: placeStandNow(x.id)?.state === 'unknown',
      // the Bus Terminal shows a bus and the Public Market a mini bus (they wait there); other spots show the pedicab or motorcycle
      glyph: x.kind === 'Terminal' ? 'bus' : x.id === 'market' ? (rideMoto ? 'moto' : 'mini') : waitingSpots[x.id] ? (stationsAt(x.id).length > 0 && stationsAt(x.id).every((s) => s.type === 'motor') ? 'moto' : 'vehicle') : x.kind === 'Street' ? null : x.kind === 'Barangay' || x.kind === 'Sitio' ? x.kind : 'Place',
      label: '',
    })),
    ...pois.filter((x) => poiKinds.includes(x.kind) || x.id === sel).map((x) => ({ id: x.id, lat: x.lat, lon: x.lon, title: x.name, sub: x.kind, kind: 'place', label: '', glyph: x.kind })),
    // night spots (7-Eleven, the hotel) only show while some BTODA stay there; other stands fade when nobody is around
    ...stations.filter((s) => !s.placeId && s.pos && (!s.night || standActive(s))).map((s) => ({ id: s.id, lat: s.pos.lat, lon: s.pos.lon, title: s.name, sub: s.type === 'motor' ? 'Motorcycle stand' : 'Tricycle / pedicab stand', kind: 'spot', label: '', glyph: s.type === 'motor' ? 'moto' : 'vehicle', closed: standNow(s).state === 'closed', night: !!s.night })),
  ], [selPoiKey, poiKinds, look.tick, rideMoto]) // eslint-disable-line react-hooks/exhaustive-deps
  // pressing the location button always wins, even while a route is shown
  // The map makes ONE move to a picked place. It waits (up to 4 seconds) while your location or the real road is still coming,
  // so it never zooms in on the place and then back out when the whole trip is framed.
  const [settledFor, setSettledFor] = useState(null) // the picked place the map may now move to
  const settled = settledFor === sel
  const waiting = !!(sel && ((!me && loc.state === 'finding') || (me && ride && !ride.path?.length && ride.straight > 150 && navigator.onLine)))
  useEffect(() => {
    if (!waiting) { setSettledFor(sel); return }
    const t = setTimeout(() => setSettledFor(sel), 4000)
    return () => clearTimeout(t)
  }, [waiting, sel])
  const focus = useMemo(() => focusPt ?? (ride?.path?.length ? null : sel && settled ? [p.lat, p.lon] : null), [p, focusPt, sel, ride?.path?.length, settled]) // the route fits the view itself
  // the first time your location arrives (and nothing is picked), the map moves to you once
  const movedToMe = useRef(false)
  useEffect(() => { if (!sel && me && !movedToMe.current) { movedToMe.current = true; setFocusPt([me[0], me[1]]) } }, [sel, me])
  const hereNear = me && !sel ? nearestPlace(me[0], me[1]) : null
  const nearMe = me ? nearestStands(me, 1)[0] : null
  const links = NO_LINKS // the dashed lines between you, a street and a stand were removed

  const onPick = (id) => { setFocusPt(null); if (placeById(id) || poiById(id)) { setSel(id); setCard(true); setMore(false) } else goFromMap('station', { id }) }
  const locate = () => { if (me) setFocusPt([me[0] + 1e-9 * (Date.now() % 7), me[1]]); // a new value each press, so the map moves every time
     else { retryLocation(); say('Looking for your location…') } }

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
    <div className={'mapfill mood-' + look.mood + (look.rain ? ' rainy' + (look.level >= 2 ? ' strong' : '') : '')}>
      <CloudOverlay cover={look.weather?.cloud ?? 0} night={look.mood === 'night'} />
      <WeatherChip weather={look.weather} />
      {look.rain && <RainOverlay night={look.mood === 'night'} level={look.level} thunder={look.thunder} />}
      {(view3d || shown3d) && (
        <Suspense fallback={null}>
          <Map3D leaving={!view3d} mood={look.mood} key={look.mood} onReady={() => setReady3dFor(look.mood)} selKind={rideMoto ? 'moto' : 'vehicle'} links={links} center={focusPt ?? (sel ? [p.lat, p.lon] : me ?? start)} me={me} markers={markers.filter((k) => k.kind !== 'place' || k.id === sel)} route={sel && ride?.path ? ride.path : undefined} routeColor={routeColor({ vehicle: ride?.vehicle })} offsetY={cardH ? Math.round((cardH + 124) / 2) : 0} pitch={sel && ride?.path ? 32 : sel ? 45 : 55} target={sel ? [p.lat, p.lon] : null} onPick={onPick} />
        </Suspense>
      )}
      {(!view3d || !done3d) && (
      <MapView mood={look.mood} selId={sel} selGlyph={rideMoto ? 'moto' : null} markers={markers} center={start} focus={focus} zoom={15} fit={false} me={me} onPick={onPick} links={links} draft={draft} route={sel && ride?.path ? ride.path : undefined} routeColor={routeColor({ vehicle: ride?.vehicle })} fitRoute
        onMapClick={adding ? setDraft : undefined} cluster offsetY={cardH ? Math.round((cardH + 124) / 2) : 0} zoomControl label="Map of waiting spots and places in Bansalan" />
      )}
      <button className="map-search" onClick={() => setFinding(true)} aria-label="Search a street or place on the map">
        <Icon name="search" /><span className={sel ? '' : 'ph'}>{sel ? p.name : 'Search a street or place'}</span>
      </button>
      {filterOpen && (
        <>
          <button className="filter-scrim" aria-label="Close the filter" onClick={() => setFilterOpen(false)} tabIndex={-1} />
          <div className="filter-panel" role="dialog" aria-label="Show on the map">
            <div className="filter-head"><b>Show on the map</b>{poiKinds.length > 0 && <button className="filter-clear" onClick={() => setPoiKinds([])}>Clear</button>}</div>
            {Object.entries(POI_KINDS).map(([k, m]) => (
              <button key={k} className="alert-row filter-row" aria-pressed={poiKinds.includes(k)} onClick={() => toggleKind(k)}>
                <span className="alert-text"><b>{m.label}</b><span className="row-sub">{pois.filter((x) => x.kind === k).length} places</span></span>
                <span className="switch" aria-hidden="true"><i /></span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="float r col">
        <button className={'icon-btn view-btn' + (view3d ? ' on' : '')} aria-pressed={view3d} aria-label={view3d ? 'Back to the flat map' : 'Show the 3D map'} onClick={() => setView3d((v) => !v)}>{view3d ? '2D' : '3D'}</button>
        <button className="icon-btn" aria-label="Show my location" onClick={() => locate()}><Icon name="locate" /></button>
        <button className={'icon-btn' + (poiKinds.length ? ' on' : '')} aria-expanded={filterOpen} aria-haspopup="dialog" aria-label={`Filter: show shops, hotels and more${poiKinds.length ? `, ${poiKinds.length} on` : ''}`} onClick={() => setFilterOpen((v) => !v)}><Icon name="filter" />{poiKinds.length > 0 && <i className="icon-badge">{poiKinds.length}</i>}</button>
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
      ) : !sel && hereNear ? (
        <section className="mapcard slim here" aria-live="polite" key="here" ref={cardRef}>
          <div className="mapcard-top">
            <span className="here-pulse" aria-hidden="true"><i /></span>
            <div>
              <h1 className="mapcard-title">You are here</h1>
              <p className="row-sub">Near {hereNear.place.name}</p>
              <p className="here-hint">Tap a pin or search to see rides and fares</p>
              {loc.accuracy ? <span className="here-chip">GPS · within {loc.accuracy} m</span> : null}
            </div>
            <Trike className="here-trike" width={86} height={59} />
          </div>
        </section>
      ) : card && (
        <section className="mapcard" aria-live="polite" key={p.id} ref={cardRef} {...dragDown(() => { movedToMe.current = true; setCard(false); setSel(null); setFocusPt(null); setMore(false) })}>
          <div className="mapcard-top">
            <div>
              <div className="mapcard-tags">
                {standState && <StandPill now={standState} />}
                {spot ? <Tag tone="gold">Waiting spot</Tag> : <Tag tone="grey">{p.kind}</Tag>}
                {spot && spot.status !== 'confirmed' && <StatusTag status={spot.status} />}
              </div>
              <h1 className="mapcard-title">{p.name}</h1>
              <p className="row-sub">{[p.note || (isPoi && p.sub ? p.sub.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : ''), dist !== null ? `${fmtDist(dist)} from you` : ''].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="mapcard-btns">
              {!isPoi && <button className="icon-btn flat" aria-label={`Details about ${p.name}`} onClick={() => goFromMap('place', { id: p.id })}><Icon name="info" /></button>}
              <button className="icon-btn flat" aria-label="Close" onClick={() => { movedToMe.current = true; setCard(false); setSel(null); setFocusPt(null); setMore(false) }}><Icon name="close" /></button>
            </span>
          </div>
          <ClosedNotice now={standState} near={nearOpen} onNear={() => nearOpen && goFromMap('station', { id: nearOpen.station.id })} />
          {me && <div className={standState?.state === 'closed' ? 'dimmed' : ''} aria-disabled={standState?.state === 'closed'}><FromYou ride={ride} me={me} destId={p.id} compact /></div>}
          <button className="mapcard-more" aria-expanded={more} onClick={() => setMore((v) => !v)}>{more ? 'Hide rides and drivers' : 'Show rides and drivers'}<Icon name="chevron" className={more ? 'up' : 'down'} /></button>
          {more && (<>
          {nearMe && (
            <button className="stand-card compact live" onClick={() => goFromMap('station', { id: nearMe.station.id })}>
              <span className="ico gold"><Icon name={nearMe.station.type === 'motor' ? 'moto' : 'vehicle'} /></span>
              <span className="row-main"><span className="tl-k">Nearest to you · live</span><b>{nearMe.station.name}</b><span className="row-sub">{fmtDist(nearMe.meters)} {compassName(nearMe.bearing)} · about {walkMinutes(nearMe.meters)} min walk</span></span>
              <Icon name="chevron" className="chev" />
            </button>
          )}
          {nb && (
            <button className="stand-card compact" onClick={() => goFromMap('station', { id: nb.station.id })}>
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
                  {r.fare === null ? <span className="price" title="Ask the driver">~{motorPossible(r.km)}</span> : <span className="price">{fareText(r)}</span>}<Icon name="chevron" className="chev" />
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

      {finding && <Picker withPois withTowns title="Find on the map" selectedId={sel} onPick={(id) => { setFinding(false); if (id.startsWith('town:')) go('town', { id: id.slice(5) }); else onPick(id) }} onClose={() => setFinding(false)} />}
    </div>
  )
}

function PlaceFromYou({ me, place }) {
  return <FromYou ride={useRideFromMe(me, place)} me={me} destId={place.id} />
}

// For students: what a ride costs from the school, and a one-tap way home.
function SchoolCard({ school, go, nearest }) {
  const [mine] = useStored('bansaride-myplaces', {})
  const toTerminal = routeBetween(school.id, 'terminal')
  const km = toTerminal?.route.km
  const home = mine.home && mine.home !== school.id ? routeBetween(school.id, mine.home) : null
  return (
    <section className="card glass school-card">
      <h2 className="sec">For students</h2>
      {km ? (
        <div className="paid-sum">
          {PASSENGERS.filter((x) => ['elementary', 'highschool', 'college'].includes(x.id)).map((x) => <span className="paid-chip" key={x.id}><b>{x.short}</b>₱{fareFor(km, x.id)}</span>)}
        </div>
      ) : null}
      <p className="row-sub">Student fare from this school to the Bus Terminal{km ? ` (${km} km)` : ''}. Ask the driver to confirm.</p>
      <div className="cta-row">
        {nearest && <button className="btn secondary" onClick={() => go('station', { id: nearest.id })}><Icon name="vehicle" />Nearest stand</button>}
        <button className="btn" onClick={() => (home ? go('route', home.reversed ? { id: home.route.id, rev: true } : { id: home.route.id }) : go('home'))}><Icon name="home" />{home ? 'Going home' : 'Set my Home on Home'}</button>
      </div>
    </section>
  )
}

export function Place() {
  const { go, params, loc, t } = useApp()
  const look = useLook()
  const p = placeById(params.id) ?? places[0]
  const ways = routes.filter((r) => r.to === p.id || r.from === p.id)
  const here = stationsAt(p.id)
  const markers = useMemo(() => [{ id: p.id, lat: p.lat, lon: p.lon, kind: 'end', label: '', title: p.name }], [p])
  const nb = here.length === 0 && p.kind !== 'Terminal' ? nearestStand(p.lat, p.lon) : null
  return (
    <>
      <div className="mapbox short">
        <MapView mood={look.mood} markers={markers} zoom={17} label={`Map of ${p.name}`} />
        <div className="float l"><BackButton /></div>
      </div>
      <div className="sheet place-sheet">
        <div className="grab" aria-hidden="true" />
        <div className="place-sign">
          <span className="place-ico" aria-hidden="true"><Icon name={p.kind === 'Street' ? 'street' : p.kind === 'Barangay' ? 'barangay' : p.kind === 'Sitio' ? 'sitio' : 'place'} /></span>
          <div className="place-sign-text">
            <span className="place-kind">{p.kind}</span>
            <h1 className="route-title">{p.name}</h1>
            <p className="row-sub">{p.note}{p.also ? ` · also ${p.also}` : ''}. Opening hours: to be confirmed.</p>
          </div>
        </div>
        {here.length > 0 && (
          <section>
            <h2 className="sec">{t('Drivers waiting here')}</h2>
            <div className="list">
              {here.map((s) => (
                <button key={s.id} className="stand-card" onClick={() => go('station', { id: s.id })}>
                  <span className={'ico ' + (s.type === 'motor' ? 'green' : 'gold')}><Icon name={s.type === 'motor' ? 'moto' : 'vehicle'} /></span>
                  <span className="row-main"><b>{s.name}</b><span className="row-sub">{s.type === 'motor' ? 'Motorcycles for the mountain areas' : 'Tricycle and pedicab group'}</span><StandPill s={s} /></span>
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
            <h2 className="sec">{t("Nearest drivers' stand")}</h2>
            <button className="stand-card" onClick={() => go('station', { id: nb.station.id })}>
              <span className="ico gold"><Icon name="vehicle" /></span>
              <span className="row-main"><b>{nb.station.name}</b><span className="row-sub">{fmtDist(nb.meters)} away. Tricycle and pedicab group</span></span>
              <Icon name="chevron" className="chev" />
            </button>
          </section>
        )}
        {loc.state === 'ok' && <PlaceFromYou me={loc.ll} place={p} />}
        {p.kind === 'School' && <SchoolCard school={p} go={go} nearest={here[0] ?? nb?.station} />}
        <Feedback scope={{ placeId: p.id }} />
        <section>
          <h2 className="sec">{t('Rides')}</h2>
          {ways.length === 0 && <p className="hint">No routes to this place yet. We are adding more.</p>}
          <div className="list">{ways.map((r, i) => <RouteRow key={r.id} route={r} onOpen={(id) => go('route', { id })} index={i} />)}</div>
        </section>
        <button className="btn" onClick={() => go('map', { id: p.id })}><Icon name="pin" />See on the map</button>
      </div>
    </>
  )
}
