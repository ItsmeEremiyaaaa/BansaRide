import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { layers as baseLayers } from '@protomaps/basemaps'
import { Protocol } from 'pmtiles'
import { MAPS } from './mapStyle'
import { bansalanTiles } from './localTiles'

// Tilted 3D view of Bansalan: the same map file and colors as the flat map, with the buildings raised.
// Street names are left out of this view (they need font files); the flat map keeps them.
let registered = false
const FILE = () => new URL(`${import.meta.env.BASE_URL}bansalan.pmtiles`, window.location.href).href // one address used for both the key and the style
export default function Map3D({ center, me, markers = [], pitch = 60, bearing = -20, onPick }) {
  const box = useRef(null)
  const mapRef = useRef(null)
  useEffect(() => {
    if (!registered) {
      const proto = new Protocol()
      proto.add(bansalanTiles(FILE()))
      maplibregl.addProtocol('pmtiles', proto.tile)
      maplibregl.setWorkerUrl(workerUrl) // the engine's background worker, bundled with the app so it works offline
      registered = true
    }
    const style = {
      version: 8,
      sources: { p: { type: 'vector', url: `pmtiles://${FILE()}`, maxzoom: 15 } },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': MAPS.background } },
        ...baseLayers('p', MAPS).filter((l) => l.type !== 'symbol'),
      ],
    }
    const map = new maplibregl.Map({ container: box.current, style, center: [center[1], center[0]], zoom: 17, pitch, bearing, maxPitch: 75, attributionControl: false })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: false }), 'top-right')
    const dots = []
    if (me) { const e = document.createElement('div'); e.className = 'you-pin'; e.innerHTML = '<i></i>'; dots.push(new maplibregl.Marker({ element: e }).setLngLat([me[1], me[0]]).addTo(map)) }
    for (const k of markers) {
      const e = document.createElement('button'); e.className = 'pin3d-wrap'; e.setAttribute('aria-label', k.title ?? 'Place'); e.onclick = () => onPick?.(k.id); e.innerHTML = '<i class="pin3d"></i>'
      dots.push(new maplibregl.Marker({ element: e, anchor: 'bottom' }).setLngLat([k.lon, k.lat]).addTo(map))
    }
    mapRef.current = map
    if (import.meta.env.DEV) window.__map3d = map
    return () => { dots.forEach((d) => d.remove()); map.remove() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // when a place is picked, glide to it and stay in 3D
  const key = center.join()
  useEffect(() => { mapRef.current?.easeTo({ center: [center[1], center[0]], duration: 700 }) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return <div ref={box} className="map3d" role="img" aria-label="3D map of Bansalan" />
}
