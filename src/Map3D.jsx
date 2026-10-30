import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { layers as baseLayers } from '@protomaps/basemaps'
import { Protocol } from 'pmtiles'
import { moodFlavor } from './mapStyle'
import { bansalanTiles } from './localTiles'

// Tilted view of Bansalan from the same offline map file and colors as the flat map. Pins are drawn by the graphics chip
// (one layer of icons, not hundreds of page elements), so it stays smooth. Street names are left out (they need font files).
let registered = false
const FILE = () => new URL(`${import.meta.env.BASE_URL}bansalan.pmtiles`, window.location.href).href
const ART = { vehicle: 'trike', moto: 'moto', bus: 'bus', mini: 'bus', van: 'van', Barangay: 'i-barangay', Sitio: 'i-sitio', Street: 'i-street', Place: 'i-place' }
const TINT = { vehicle: '#E8A100', moto: '#067647', bus: '#E5322D', mini: '#1F7A8C', van: '#1560F0' }

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

export default function Map3D({ center, me, markers = [], route, routeColor = '#E8A100', offsetY = 0, pitch = 60, bearing = -20, onPick, mood = 'day', links = [] }) {
  const box = useRef(null)
  const mapRef = useRef(null)
  const ready = useRef(false)
  const latest = useRef({})
  latest.current = { markers, route, routeColor, onPick, offsetY, mood, links, center }

  const apply = () => {
    const map = mapRef.current
    if (!map || !ready.current) return
    const { markers: mk, route: rt, routeColor: rc } = latest.current
    map.getSource('spots')?.setData(geo(mk))
    map.getSource('route')?.setData(line(rt))
    map.getSource('links')?.setData({ type: 'FeatureCollection', features: rt?.length > 1 ? [] : (latest.current.links ?? []).map((l) => line(l)) })
    if (map.getLayer('route-line')) map.setPaintProperty('route-line', 'line-color', rc)
  }

  // One camera move at a time. A far place used to start a pan at street zoom and then a fit-to-route (zoom out, then in),
  // so the move waits a moment and only the final target decides it.
  const camera = () => {
    const map = mapRef.current
    if (!map || !ready.current) return
    const { route: rt, offsetY: oy, center: c } = latest.current
    if (rt?.length > 1) {
      const b = rt.reduce((bb, [la, lo]) => bb.extend([lo, la]), new maplibregl.LngLatBounds())
      map.fitBounds(b, { padding: { top: 90, left: 40, right: 40, bottom: oy * 2 + 30 }, maxZoom: 17, pitch, bearing: 0, duration: 900 })
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
      sources: { p: { type: 'vector', url: `pmtiles://${FILE()}`, maxzoom: 15 } },
      layers: [{ id: 'bg', type: 'background', paint: { 'background-color': moodFlavor(latest.current.mood).background } }, ...baseLayers('p', moodFlavor(latest.current.mood)).filter((l) => l.type !== 'symbol'),
      ],
    }
    const map = new maplibregl.Map({ container: box.current, style, center: [center[1], center[0]], zoom: 17, pitch, bearing, maxPitch: 75, attributionControl: false })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: false }), 'top-right')
    let youDot
    if (me) { const e = document.createElement('div'); e.className = 'you-pin'; e.innerHTML = '<i></i>'; youDot = new maplibregl.Marker({ element: e }).setLngLat([me[1], me[0]]).addTo(map) }

    map.on('load', async () => {
      map.addSource('route', { type: 'geojson', data: line(null) })
      // dashed lines: you to the nearest stand, a street to its stand (same as the flat map)
      map.addSource('links', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'links', type: 'line', source: 'links', paint: { 'line-color': '#9a6b00', 'line-width': 3, 'line-dasharray': [2, 2] } })
      map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 11 } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': latest.current.routeColor, 'line-width': 6 } })
      // evening and night: houses with lights on, the same little warm windows as the flat map
      if (latest.current.mood === 'night' || latest.current.mood === 'evening') {
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
          'icon-image': ['concat', 'v-', ['case', ['==', ['get', 'kind'], 'sel'], 'vehicle', ['get', 'kind']]],
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

  useEffect(apply, [markers, route, routeColor, links]) // eslint-disable-line react-hooks/exhaustive-deps
  const key = center.join()
  const routeSig = route?.length > 1 ? route.length + ':' + route[0] + ':' + route[route.length - 1] : ''
  useEffect(() => {
    const t = setTimeout(camera, 80)
    return () => clearTimeout(t)
  }, [key, routeSig, pitch, offsetY > 0]) // eslint-disable-line react-hooks/exhaustive-deps
  // the sky at the horizon: a gradient in the colours of the moment, drawn over the far edge of the tilted map
  return (
    <>
      <div ref={box} className="map3d" role="img" aria-label="3D map of Bansalan" />
      <div className={'sky3d sky-' + mood} aria-hidden="true" />
    </>
  )
}
