import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { layers as baseLayers } from '@protomaps/basemaps'
import { Protocol } from 'pmtiles'
import { moodFlavor } from './mapStyle'
import { bansalanTiles } from './localTiles'
import { bounds } from './boundary'
import { places } from './data'

// Tilted view of Bansalan from the same offline map file and colors as the flat map. Pins are drawn by the graphics chip
// (one layer of icons, not hundreds of page elements), so it stays smooth. Street names are left out (they need font files).
let registered = false
const FILE = () => new URL(`${import.meta.env.BASE_URL}bansalan.pmtiles`, window.location.href).href
const ART = { vehicle: 'trike', moto: 'moto', bus: 'bus', mini: 'bus', van: 'van', Barangay: 'i-barangay', Sitio: 'i-sitio', Street: 'i-street', Place: 'i-place' }
// the 3D map stays inside the Bansalan border (a sliver of margin so the edge is not cut)
const LIMIT = [[bounds[0][1] - 0.14, bounds[0][0] - 0.14], [bounds[1][1] + 0.14, bounds[1][0] + 0.14]]
// only street names that belong to Bansalan are written (the same rule as the flat map)
const NAMES = [...new Set(places.filter((p) => p.kind === 'Street').map((p) => p.name))]
const TINT = { vehicle: '#FFFFFF', moto: '#067647', bus: '#E5322D', mini: '#1F7A8C', van: '#1560F0' }

// a small picture of one of the app's own vehicle drawings, ready to use as a map icon
const vehicleImage = (kind) => new Promise((resolve) => {
  const sym = document.getElementById(ART[kind])
  if (!sym) { resolve(null); return }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 290" width="96" height="66"><style>*{--vc:${TINT[kind]}}</style>${sym.innerHTML}</svg>`
  const img = new Image(96, 66)
  img.onload = () => resolve(img)
  img.onerror = () => resolve(null)
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
})

const kindOf = (k) => (k.kind === 'sel' ? 'sel' : ART[k.glyph] ? k.glyph : k.kind === 'spot' ? 'vehicle' : 'dot')
const geo = (markers) => ({
  type: 'FeatureCollection',
  features: markers.map((k) => ({ type: 'Feature', properties: { id: k.id, kind: kindOf(k), sel: k.kind === 'sel', closed: !!k.closed }, geometry: { type: 'Point', coordinates: [k.lon, k.lat] } })),
})
const line = (path) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: (path ?? []).map(([la, lo]) => [lo, la]) } })

export default function Map3D({ center, me, markers = [], route, routeColor = '#E8A100', offsetY = 0, pitch = 60, bearing = -20, onPick, mood = 'day', links = [], target = null, selKind = 'vehicle' }) {
  const box = useRef(null)
  const mapRef = useRef(null)
  const ready = useRef(false)
  const latest = useRef({})
  latest.current = { markers, route, routeColor, onPick, offsetY, mood, links, center, me, target, selKind }

  const apply = () => {
    const map = mapRef.current
    if (!map || !ready.current) return
    const { markers: mk, route: rt, routeColor: rc } = latest.current
    map.getSource('spots')?.setData(geo(mk))
    if (map.getLayer('icons')) map.setLayoutProperty('icons', 'icon-image', ['concat', 'v-', ['case', ['==', ['get', 'kind'], 'sel'], latest.current.selKind ?? 'vehicle', ['get', 'kind']]])
    map.getSource('route')?.setData(line(rt))
    map.getSource('links')?.setData({ type: 'FeatureCollection', features: rt?.length > 1 ? [] : (latest.current.links ?? []).map((l) => line(l)) })
    if (map.getLayer('route-line')) map.setPaintProperty('route-line', 'line-color', rc)
  }

  // One camera move at a time. A far place used to start a pan at street zoom and then a fit-to-route (zoom out, then in),
  // so the move waits a moment and only the final target decides it.
  // The camera looks from where you are toward the place (the heading is turned that way), so the place is ahead, not hidden behind the card.
  const heading = (a, b) => { const r = Math.PI / 180; const y = Math.sin((b[1] - a[1]) * r) * Math.cos(b[0] * r); const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos((b[1] - a[1]) * r); return (Math.atan2(y, x) / r + 360) % 360 }
  // a tilted camera hides the near end of a long stretch behind the card, so a long trip is shown almost from above (the tilt comes back as you get closer)
  const flat = (b) => { const km = Math.hypot((b.getNorth() - b.getSouth()) * 111, (b.getEast() - b.getWest()) * 110); return km > 4 ? Math.min(pitch, 12) : km > 1.5 ? Math.min(pitch, 30) : pitch }
  const fitFlat = (b, oy) => {
    const map = mapRef.current, el = map.getContainer()
    const H = el.clientHeight, Wd = el.clientWidth, top = 80, bot = H - oy * 2 - 16
    const regH = Math.max(120, bot - top), regW = Wd - 72
    const n = b.getNorth(), so = b.getSouth(), e = b.getEast(), w = b.getWest()
    const cosl = Math.cos(((n + so) / 2) * Math.PI / 180)
    const mpp = (Math.max(((n - so) * 111000) / regH, ((e - w) * 110500) / regW) || 1) * 1.1
    const z = Math.min(17, Math.max(map.getMinZoom(), Math.log2((78271.517 * cosl) / mpp)))
    const per = (78271.517 * cosl) / 2 ** z // metres per pixel
    const shift = H / 2 - (top + bot) / 2 // the middle of the free area is above the middle of the screen
    map.easeTo({ center: [(e + w) / 2, (n + so) / 2 - (shift * per) / 111000], zoom: z, pitch: 0, bearing: 0, duration: 900 })
  }
  const camera = () => {
    const map = mapRef.current
    if (!map || !ready.current) return
    const { route: rt, offsetY: oy, center: c, me: m0, target: tg } = latest.current
    const padding = { top: 80, left: 36, right: 36, bottom: oy * 2 + 40 }
    const far = tg && m0 && Math.hypot((tg[0] - m0[0]) * 111000, (tg[1] - m0[1]) * 110500) > 120
    if (rt?.length > 1) {
      const b = rt.reduce((bb, [la, lo]) => bb.extend([lo, la]), new maplibregl.LngLatBounds())
      if (m0) b.extend([m0[1], m0[0]]) // you stay in view too
      if (flat(b) < pitch && flat(b) <= 12) fitFlat(b, oy)
      else map.fitBounds(b, { padding, maxZoom: 17, pitch: flat(b), bearing: heading(m0 ?? rt[0], rt[rt.length - 1]), duration: 900 })
    } else if (far) {
      const b = new maplibregl.LngLatBounds([m0[1], m0[0]], [m0[1], m0[0]]).extend([tg[1], tg[0]])
      if (flat(b) <= 12) fitFlat(b, oy)
      else map.fitBounds(b, { padding, maxZoom: 17, pitch: flat(b), bearing: heading(m0, tg), duration: 900 })
    } else map.easeTo({ center: [c[1], c[0]], pitch, offset: [0, -oy], duration: 700 })
  }

  useEffect(() => {
    if (!registered) {
      const proto = new Protocol()
      proto.add(bansalanTiles(FILE()))
      maplibregl.addProtocol('pmtiles', proto.tile)
      maplibregl.setWorkerUrl(workerUrl) // bundled with the app so it works offline
      registered = true
    }
    const style = {
      version: 8,
      glyphs: `${new URL(import.meta.env.BASE_URL, window.location.href).href}fonts/{fontstack}/{range}.pbf`, // saved with the app, so names work offline
      sources: { p: { type: 'vector', url: `pmtiles://${FILE()}`, maxzoom: 15 } },
      layers: [{ id: 'bg', type: 'background', paint: { 'background-color': moodFlavor(latest.current.mood).background } }, ...baseLayers('p', moodFlavor(latest.current.mood)).filter((l) => l.type !== 'symbol'),
      ],
    }
    const map = new maplibregl.Map({ container: box.current, style, center: [center[1], center[0]], zoom: 17, pitch, bearing, maxPitch: 75, maxBounds: LIMIT, minZoom: 9.4, attributionControl: false })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: false }), 'top-right')
    let youDot
    if (me) { const e = document.createElement('div'); e.className = 'you-pin'; e.innerHTML = '<i></i>'; youDot = new maplibregl.Marker({ element: e }).setLngLat([me[1], me[0]]).addTo(map) }

    map.on('load', async () => {
      map.addSource('route', { type: 'geojson', data: line(null) })
      // dashed lines: you to the nearest stand, a street to its stand (same as the flat map)
      map.addSource('links', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'links', type: 'line', source: 'links', paint: { 'line-color': '#9a6b00', 'line-width': 3, 'line-dasharray': [2, 2] } })
      const night = ['night', 'dawn'].includes(latest.current.mood)
      map.addLayer({ id: 'street-names', type: 'symbol', source: 'p', 'source-layer': 'roads', minzoom: 14, filter: ['in', ['get', 'name'], ['literal', NAMES]], layout: { 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Medium'], 'text-size': 12, 'text-letter-spacing': 0.02, 'text-max-angle': 40, 'symbol-spacing': 320 }, paint: { 'text-color': night ? '#e3e9ff' : '#3a3428', 'text-halo-color': night ? '#16206b' : '#ffffff', 'text-halo-width': 1.6 } })
      map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 11 } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': latest.current.routeColor, 'line-width': 6 } })
      // evening and night: houses with lights on, the same little warm windows as the flat map
      if (['night', 'evening', 'dawn'].includes(latest.current.mood)) {
        const c = document.createElement('canvas'); c.width = c.height = 48
        const x = c.getContext('2d'); x.fillStyle = 'rgba(255,214,107,.98)'; for (const [a, b] of [[8, 10], [30, 28], [34, 8]]) x.fillRect(a, b, 6, 6); x.fillStyle = 'rgba(255,214,107,.45)'; x.fillRect(26, 40, 4, 4)
        map.addImage('lit-pattern', x.getImageData(0, 0, 48, 48), { pixelRatio: 2 })
        map.addLayer({ id: 'lit', type: 'fill', source: 'p', 'source-layer': 'buildings', minzoom: 15, paint: { 'fill-pattern': 'lit-pattern', 'fill-opacity': latest.current.mood === 'night' ? 1 : 0.6 } }, 'route-casing')
        map.addLayer({ id: 'glow', type: 'fill', source: 'p', 'source-layer': 'buildings', minzoom: 15, paint: { 'fill-color': '#ffb13b', 'fill-opacity': latest.current.mood === 'night' ? 0.14 : 0.06 } }, 'lit')
      }
      for (const k of Object.keys(ART)) { const img = await vehicleImage(k); if (img && !map.hasImage('v-' + k)) map.addImage('v-' + k, img, { pixelRatio: 2 }) }
      map.addSource('spots', { type: 'geojson', data: geo(latest.current.markers) })
      map.addLayer({ id: 'dots', type: 'circle', source: 'spots', filter: ['==', ['get', 'kind'], 'dot'], paint: { 'circle-radius': 6, 'circle-color': '#98a2b3', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } })
      map.addLayer({
        id: 'icons', type: 'symbol', source: 'spots', filter: ['!=', ['get', 'kind'], 'dot'],
        layout: {
          'icon-image': ['concat', 'v-', ['case', ['==', ['get', 'kind'], 'sel'], latest.current.selKind ?? 'vehicle', ['get', 'kind']]],
          'icon-size': ['case', ['get', 'sel'], 1.05, 0.8], 'icon-allow-overlap': false, 'icon-padding': 2,
          'symbol-sort-key': ['case', ['get', 'sel'], 0, 1],
        },
        paint: { 'icon-opacity': ['case', ['get', 'closed'], 0.7, 1] },
      })
      for (const l of ['icons', 'dots']) {
        map.on('click', l, (e) => { const id = e.features?.[0]?.properties?.id; if (id) latest.current.onPick?.(id) })
        map.on('mouseenter', l, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', l, () => { map.getCanvas().style.cursor = '' })
      }
      ready.current = true
      apply()
      camera()
    })
    if (import.meta.env.DEV) window.__map3d = map
    return () => { ready.current = false; youDot?.remove(); map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(apply, [markers, route, routeColor, links, selKind]) // eslint-disable-line react-hooks/exhaustive-deps
  const key = center.join()
  const routeSig = route?.length > 1 ? route.length + ':' + route[0] + ':' + route[route.length - 1] : ''
  const targetKey = target ? target.join() : ''
  useEffect(() => {
    const t = setTimeout(camera, 80)
    return () => clearTimeout(t)
  }, [key, routeSig, pitch, Math.round(offsetY / 30), targetKey, !!me]) // eslint-disable-line react-hooks/exhaustive-deps
  // the sky at the horizon: a gradient in the colours of the moment, drawn over the far edge of the tilted map
  return (
    <>
      <div ref={box} className="map3d" role="img" aria-label="3D map of Bansalan" />
      <div className={'sky3d sky-' + mood} aria-hidden="true" />
    </>
  )
}
