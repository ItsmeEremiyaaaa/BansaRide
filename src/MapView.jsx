import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { leafletLayer } from 'protomaps-leaflet'
import { bansalanTiles } from './localTiles'
import { moodRules } from './mapStyle'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { boundary, bounds, barangays } from './boundary'

// The map is limited to Bansalan, Davao del Sur: it cannot be panned away, and everything outside the
// real municipal border is dimmed. Barangay names show from zoom 13.
const PAD = 0.012
const LIMITS = L.latLngBounds([bounds[0][0] - PAD, bounds[0][1] - PAD], [bounds[1][0] + PAD, bounds[1][1] + PAD]) // the whole of Bansalan: the furthest zoom-out shows exactly this
// the map may be moved a little past the south edge, so a place near it can be lifted above the card at the bottom
const PAN_LIMITS = L.latLngBounds([bounds[0][0] - 0.06, bounds[0][1] - 0.06], [bounds[1][0] + 0.06, bounds[1][1] + 0.06]) // a little of the neighbouring land can be seen
const EDGE_COLOR = { dawn: '#ffd66b', morning: '#f4b400', day: '#f4b400', golden: '#e08a1e', evening: '#ffb13b', night: '#ffd66b' }
// (kept for reference) Outside Bansalan there is no map. It is a calm backdrop in the colors of the moment, with a soft pattern (little leaves by day,
// stars at night) and a golden dotted border like the app's signboards, so the edge looks designed, not blank.
const SURROUND = {
  morning: { fill: '#e7dcc2', ink: 'rgba(120,150,70,.55)', pattern: 'leaf', edge: '#f4b400' },
  day: { fill: '#e2dccb', ink: 'rgba(110,140,70,.5)', pattern: 'leaf', edge: '#f4b400' },
  evening: { fill: '#c9a994', ink: 'rgba(255,225,180,.7)', pattern: 'dot', edge: '#ffb13b' },
  night: { fill: '#0a0f1f', ink: 'rgba(255,255,255,.85)', pattern: 'star', edge: '#ffd66b' },
}
const patternSvg = (kind, ink) => {
  if (kind === 'star') return `<circle cx="9" cy="11" r="1.1" fill="${ink}"/><circle cx="31" cy="26" r="0.8" fill="${ink}"/><circle cx="20" cy="36" r="1.3" fill="${ink}"/><circle cx="37" cy="6" r="0.7" fill="${ink}"/><path d="M26 10l.9 2.1 2.1.9-2.1.9L26 16l-.9-2.1-2.1-.9 2.1-.9z" fill="${ink}"/>`
  if (kind === 'dot') return `<circle cx="8" cy="8" r="1.6" fill="${ink}"/><circle cx="26" cy="22" r="1.6" fill="${ink}"/><circle cx="14" cy="32" r="1.1" fill="${ink}"/>`
  return `<path d="M10 12c4-1 7 1 8 5-4 1-7-1-8-5z" fill="${ink}"/><path d="M28 28c3-3 7-3 9 0-3 3-7 3-9 0z" fill="${ink}"/><circle cx="31" cy="9" r="1.3" fill="${ink}"/><circle cx="8" cy="33" r="1.1" fill="${ink}"/>`
}
const WORLD = [[-85, -180], [-85, 180], [85, 180], [85, -180]]

// A real OpenStreetMap map. Pins and the route line are drawn by us, so they still
// show offline even when the map pictures (tiles) have not been saved yet.
// Small drawings inside the pins, so a school looks like a school and a waiting spot like a tricycle.
const GLYPHS = {
  vehicle: '<path d="M3 15V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" /><path d="M2 15h15M15 10h3.5l2 5" /><circle cx="6" cy="18" r="2" /><circle cx="19" cy="18" r="2" />',
  moto: '<circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-7h5l3 7M10 10l-1-3H7M14 10l1-3h2" />',
  School: '<path d="M3 9l9-5 9 5-9 5z" /><path d="M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />',
  Hospital: '<path d="M12 5v14M5 12h14" />',
  Market: '<path d="M4 9l1.5-5h13L20 9" /><path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /><path d="M5.5 12v8h13v-8" />',
  Government: '<path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />',
  Terminal: '<rect x="4" y="4" width="16" height="12" rx="2" /><path d="M4 11h16M7 19v-3M17 19v-3" />',
  Store: '<path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />',
  Hotel: '<path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="1.6" />',
  Food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 3c-2 1-3 4-3 7h3v11" />',
  Bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /><circle cx="12" cy="13" r="1" />',
  Pharmacy: '<path d="M12 5v14M5 12h14" />',
  Gas: '<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3 20h13M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-3-3" /><path d="M7 8h5" />',
  Barangay: '<path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" />',
  Sitio: '<path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" />',
}
const TONES = { Hotel: '#7c4dff', Food: '#e8590c', Bank: '#0b7285', Pharmacy: '#e03131', Gas: '#495057', moto: '#067647', School: '#1560f0', Hospital: '#e5322d', Market: '#f08a24', Government: '#475467', Terminal: '#1f7a8c', Store: '#b7791f', Barangay: '#2f8f5b', Sitio: '#2f8f5b' }
// Waiting spots and terminals use the real vehicle drawings (from the app's art sheet), with no circle behind them.
const ART = { vehicle: 'trike', moto: 'moto', bus: 'bus', mini: 'bus', van: 'van', Barangay: 'i-barangay', Sitio: 'i-sitio', Street: 'i-street', Place: 'i-place' } // the last four are the app's own place icons
// The pins drop in once when the map opens. After that, redrawing them (closing a card, picking a place) must not replay the drop,
// or every icon seems to vanish and come back.
let settled = false
const pin = (cls0, label, i, glyph, tone) => {
  const cls = settled ? cls0 + ' still' : cls0
  if (ART[glyph]) {
    return L.divIcon({
      className: 'pin-wrap',
      html: `<span class="pin art ${cls} ${glyph}" style="animation-delay:${Math.min(i, 12) * 45}ms"><svg viewBox="0 0 420 290" aria-hidden="true"><use href="#${ART[glyph]}" /></svg></span>${label ? `<span class="pin-label">${label}</span>` : ''}`,
      iconSize: [0, 0],
    })
  }
  const g = glyph && GLYPHS[glyph]
  const style = `animation-delay:${Math.min(i, 12) * 45}ms${tone ? `;--tone:${tone}` : ''}`
  const inner = g ? `<svg viewBox="0 0 24 24" aria-hidden="true">${g}</svg>` : ''
  return L.divIcon({
    className: 'pin-wrap',
    html: `<span class="pin ${cls}${g ? ' g' : ''}" style="${style}">${inner}</span>${label ? `<span class="pin-label">${label}</span>` : ''}`,
    iconSize: [0, 0],
  })
}

// The map centre that puts `ll` dy pixels above the middle of the screen, so a card at the bottom does not cover it.
// colors the area outside the border for the current mood, and lays the pattern over it
function paintSurround(m, poly, edgeLine, mood) {
  const sur = SURROUND[mood] ?? SURROUND.day
  poly.setStyle({ fillColor: sur.fill })
  edgeLine.setStyle({ color: sur.edge })
  const svg = m.getPane('overlayPane').querySelector('svg')
  if (!svg || !poly.getElement()) return
  svg.querySelector('#bansa-surround')?.remove()
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  defs.id = 'bansa-surround'
  defs.innerHTML = `<pattern id="bansa-pat" width="44" height="44" patternUnits="userSpaceOnUse">${patternSvg(sur.pattern, sur.ink)}</pattern>`
  svg.prepend(defs)
  // the pattern sits on a second copy of the outside shape, over the plain color
  if (!poly._pat) {
    poly._pat = L.polygon(poly.getLatLngs(), { stroke: false, fillOpacity: 1, interactive: false }).addTo(m)
    poly._pat.bringToBack()
    poly.bringToBack()
  }
  poly._pat.getElement()?.setAttribute('fill', 'url(#bansa-pat)')
}

const above = (m, ll, zoom, dy) => (dy ? m.unproject(m.project(ll, zoom).add([0, dy]), zoom) : L.latLng(ll))

export default function MapView({ route, routeColor = '#1560F0', markers = [], focus, center, zoom = 16, fit = true, me, onPick, label, zoomControl = false, preview = false, links = [], draft, onMapClick, offsetY = 0, cluster = false, fitRoute = false, mood = 'day', selId = null }) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const pinLayer = useRef(null) // the pins live on their own layer, so changing the route never redraws them
  const markersRef = useRef(markers)
  markersRef.current = markers
  const outside = useRef(null)
  const edge = useRef(null)
  const tiles = useRef(null) // the map pictures layer, replaced when the mood changes (morning, evening, night...)
  const fitted = useRef('')
  const offsetRef = useRef(offsetY) // pixels of the map hidden under a card at the bottom
  useEffect(() => {
    const delta = offsetY - offsetRef.current
    offsetRef.current = offsetY
    if (!delta || !map.current) return
    // the card grew or shrank: refit the route above it, or slide the map so the place stays visible
    if (fitRoute && routeRef.current?.length > 1) map.current.fitBounds(L.latLngBounds(routeRef.current), { paddingTopLeft: [36, 84], paddingBottomRight: [36, offsetY * 2 + 28], maxZoom: 17, animate: true })
    else map.current.panBy([0, delta], { animate: true, duration: 0.35 })
  }, [offsetY])
  const routeFit = useRef('') // which route the view was last fitted to
  const routeRef = useRef(null) // the route now drawn
  const moodRef = useRef(mood)
  const pickRef = useRef(onPick)
  pickRef.current = onPick
  const clickRef = useRef(onMapClick)
  useEffect(() => { clickRef.current = onMapClick }, [onMapClick])
  useEffect(() => {
    if (mood === moodRef.current) return
    moodRef.current = mood
    const m = map.current
    if (!m || !tiles.current) return
    tiles.current.remove()
    tiles.current = leafletLayer({ url: bansalanTiles(`${import.meta.env.BASE_URL}bansalan.pmtiles`), ...moodRules(mood), maxZoom: 19, maxDataZoom: 15,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>' }).addTo(m)
    tiles.current.bringToBack()
    edge.current?.setStyle({ color: EDGE_COLOR[mood] ?? '#f4b400' })
  }, [mood])

  useEffect(() => {
    // `preview` makes a quiet picture-only map (used behind the Home header)
    const still = preview ? { dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false } : {}
    const m = L.map(el.current, { zoomControl: false, attributionControl: !preview, maxBounds: PAN_LIMITS, maxBoundsViscosity: 1, minZoom: 11, ...still }).setView(center ?? [6.7875, 125.2118], zoom)
    // keep the place in the part of the map you can see, above the card
    if (offsetRef.current) m.setView(above(m, center ?? [6.7875, 125.2118], zoom, offsetRef.current), zoom, { animate: false })
    map.current = m
    settled = false
    setTimeout(() => { settled = true }, 1600)
    if (import.meta.env.DEV) window.__bansaMap = m // for testing in the browser
    // Only Bansalan is shown: everything outside the border is a plain blank color (no map, no grey overlay, no dotted barrier),
    // with just a thin soft edge so you can see where the municipality ends.
    // the real map shows around Bansalan too; a dotted golden line with a soft white edge marks where the municipality ends
    L.polygon(boundary[0], { color: '#ffffff', weight: 6, opacity: 0.7, fill: false, interactive: false }).addTo(m)
    edge.current = L.polygon(boundary[0], { color: EDGE_COLOR[moodRef.current] ?? '#f4b400', weight: 3, dashArray: '1 8', lineCap: 'round', fill: false, interactive: false }).addTo(m)
    const names = L.layerGroup(barangays.map((b) => L.marker([b.lat, b.lon], {
      interactive: false, keyboard: false, zIndexOffset: -500,
      icon: L.divIcon({ className: 'brgy-wrap', html: `<span class="brgy">${b.name}</span>`, iconSize: [0, 0] }),
    })))
    const showNames = () => { if (m.getZoom() >= 13) names.addTo(m); else names.remove() }
    m.on('zoomend', showNames)
    showNames()
    // Our own map of Bansalan (a 2 MB file served with the app, so it also works offline).
    // Add ?tiles=osm to the address to compare with the OpenStreetMap server while checking accuracy.
    const useOsm = /[?&#]tiles=osm/.test(window.location.href)
    if (useOsm) {
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m)
    } else {
      tiles.current = leafletLayer({ url: bansalanTiles(`${import.meta.env.BASE_URL}bansalan.pmtiles`), ...moodRules(moodRef.current), maxZoom: 19, maxDataZoom: 15, // past zoom 15 the vector shapes are redrawn sharp, not enlarged
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>' }).addTo(m)
    }
    if (zoomControl) L.control.zoom({ position: 'topleft' }).addTo(m)
    pinLayer.current = L.layerGroup().addTo(m)
    layer.current = L.layerGroup().addTo(m)
    m.on('click', (e) => clickRef.current?.([e.latlng.lat, e.latlng.lng]))
    // Keep the map correct when its box changes size (screen layout, rotation, keyboard).
    // the furthest you can zoom out is the view that just fits Bansalan, so nothing else is ever shown
    const limitZoom = () => { if (!preview) m.setMinZoom(m.getBoundsZoom(LIMITS, false)) }
    const ro = new ResizeObserver(() => { m.invalidateSize(); limitZoom() })
    limitZoom()
    ro.observe(el.current)
    return () => { ro.disconnect(); m.remove(); map.current = null; fitted.current = '' }
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    layer.current.clearLayers()
    const pts = []
    if (route?.length) {
      L.polyline(route, { color: '#ffffff', weight: 11, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(layer.current)
      const line = L.polyline(route, { color: routeColor, weight: 6, lineCap: 'round', lineJoin: 'round', className: 'route-draw' }).addTo(layer.current)
      line.getElement()?.setAttribute('pathLength', '1') // lets CSS draw the line from start to end
      pts.push(...route)
    }
    links.forEach((l) => { L.polyline(l, { color: '#b7791f', weight: 3, dashArray: '6 8', lineCap: 'round' }).addTo(layer.current) })
    if (draft) L.marker(draft, { icon: pin('draft', '', 0), keyboard: false }).addTo(layer.current)
    const pts2 = markers.map((k) => [k.lat, k.lon])
    pts.push(...pts2)
    // the picked place: one bigger pin drawn over the normal one
    const picked = selId && markers.find((k) => k.id === selId)
    if (picked) { const big = L.marker([picked.lat, picked.lon], { icon: pin('sel', picked.label || picked.title || '', 0, picked.glyph ?? (picked.kind === 'spot' ? 'vehicle' : null), TONES[picked.glyph]), keyboard: false, zIndexOffset: 900 }).addTo(layer.current); big.on('click', () => pickRef.current?.(picked.id)) }
    if (me) {
      L.marker(me, { icon: L.divIcon({ className: 'pin-wrap', html: '<span class="you-pin"><i></i></span>', iconSize: [0, 0] }), interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(layer.current)
      if (fit) pts.push(me)
    }
    // a route that is given with fitRoute is brought fully into the part of the map above the card
    routeRef.current = route ?? null
    const routeKey = route?.length ? `${route.length}|${route[0]}|${route[route.length - 1]}` : ''
    if (fitRoute && routeKey && routeFit.current !== routeKey) {
      routeFit.current = routeKey
      m.fitBounds(L.latLngBounds(route), { paddingTopLeft: [36, 84], paddingBottomRight: [36, offsetRef.current * 2 + 28], maxZoom: 17, animate: true })
    }
    if (!routeKey) routeFit.current = ''
    // Fit the view only when the set of things on the map changes, not on every selection.
    const key = `${route?.length ?? 0}|${fit ? markers.map((k) => k.id).join() : ''}|${me ? 'me' : ''}`
    if (key !== fitted.current) {
      fitted.current = key
      m.invalidateSize()
      if (fit && pts.length > 1) m.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [40, 70], paddingBottomRight: [40, 70], maxZoom: 17, animate: false })
      else if (fit && pts.length === 1) m.setView(pts[0], zoom, { animate: false })
    }
  }, [route, routeColor, markers, me, zoom, fit, links, draft, selId])

  // The pins are redrawn only when the set of pins really changes (not when a card opens or closes, or the route clears).
  const pinKey = markers.map((k) => [k.id, k.kind, k.closed ? 1 : 0, k.glyph ?? '', k.label ?? ''].join(':')).join('|') + (cluster ? '|c' : '')
  useEffect(() => {
    const m = map.current
    if (!m || !pinLayer.current) return
    pinLayer.current.clearLayers()
        // crowded pins (a dozen stands on one corner) fold into one numbered badge that opens as you zoom in
    const group = cluster ? L.markerClusterGroup({
      maxClusterRadius: 46, showCoverageOnHover: false, spiderfyOnMaxZoom: true, disableClusteringAtZoom: 18, animate: false, animateAddingMarkers: false,
      iconCreateFunction: (c) => L.divIcon({ className: 'cluster-wrap', html: `<span class="cluster${(() => { const known = c.getAllChildMarkers().filter((x) => x.options.stand && x.options.hoursKnown); return known.length > 0 && known.every((x) => x.options.closed) })() ? ' closed' : ''}"><svg viewBox="0 0 420 290" aria-hidden="true"><use href="#trike" /></svg><b>${c.getChildCount()}</b></span>`, iconSize: [52, 40] }),
    }).addTo(pinLayer.current) : null
    markersRef.current.forEach((k, i) => {
      const mk = L.marker([k.lat, k.lon], { icon: pin(k.kind + (k.closed ? ' closed' : ''), k.label, i, k.glyph ?? (k.kind === 'spot' ? 'vehicle' : null), TONES[k.glyph]), title: k.title ?? k.label, keyboard: true, closed: !!k.closed, stand: k.kind === 'spot', hoursKnown: !k.hoursUnknown })
      mk.addTo(cluster && k.kind !== 'sel' && !k.night ? group : pinLayer.current) // night spots are never folded into a group, so they stand out
      if (k.id) mk.on('click', () => pickRef.current?.(k.id))
    })

  }, [pinKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (focus && map.current) {
      const z = Math.max(map.current.getZoom(), 16)
      map.current.setView(above(map.current, focus, z, offsetRef.current), z, { animate: true, duration: 0.5 }) // a straight glide: flyTo swings out and back in
    }
  }, [focus])

  return <div ref={el} className="leaflet-host" {...(preview ? { 'aria-hidden': 'true' } : { role: 'application', 'aria-label': label ?? 'Map of Bansalan' })} />
}
