import { LIGHT } from '@protomaps/basemaps'
import { labelRules, paintRules } from 'protomaps-leaflet'

// The BansaRide "signboard" map: warm paper ground, dark road outlines like the app's cards, yellow main roads, blue rivers,
// green parks, tan buildings and bold dark street names. Change the colors here.
const INK = '#101828'
const PAPER = '#fbf4e2'
export const SIGNBOARD = {
  ...LIGHT,
  background: PAPER, earth: PAPER,
  park_a: '#bfe6b8', park_b: '#a7dca0', wood_a: '#a7dca0', wood_b: '#92d08c', scrub_a: '#d4eac0', scrub_b: '#c4e2ae',
  hospital: '#ffd9d6', school: '#ffe9a8', industrial: '#efe6d0', pedestrian: '#f3ead6', sand: '#f6e7b8', beach: '#f6e7b8',
  water: '#8fd3f4',
  buildings: '#ecd9b2',
  // roads: a dark outline around a light fill, so they read like the app's outlined cards
  minor_service_casing: '#7a7367', minor_casing: INK, link_casing: INK, major_casing_early: INK, major_casing_late: INK, highway_casing_early: INK, highway_casing_late: INK,
  minor_service: '#ffffff', minor_a: '#ffffff', minor_b: '#ffffff', other: '#ffffff', link: '#ffe27a',
  major: '#f4b400', highway: '#ffb13b',
  bridges_minor_casing: INK, bridges_major_casing: INK, bridges_highway_casing: INK, bridges_link_casing: INK, bridges_other_casing: INK,
  bridges_minor: '#ffffff', bridges_major: '#f4b400', bridges_highway: '#ffb13b', bridges_link: '#ffe27a', bridges_other: '#ffffff',
  boundaries: '#7a4b00',
  roads_label_minor: INK, roads_label_minor_halo: '#fffaf0', roads_label_major: INK, roads_label_major_halo: '#fffaf0',
  subplace_label: '#7a4b00', subplace_label_halo: '#fffaf0', city_label: INK, city_label_halo: '#fffaf0',
  address_label: '#5b4a2a', address_label_halo: '#fffaf0',
}
export const signboardRules = (lang = 'en') => ({ paintRules: paintRules(SIGNBOARD), labelRules: labelRules(SIGNBOARD, lang), backgroundColor: PAPER })

// ---------- texture: trees, crop rows, grass, hatched buildings and little waves ----------
// Each pattern is a small picture that repeats over an area. They sit under the roads and labels.
import { PolygonSymbolizer, createPattern } from 'protomaps-leaflet'

const draw = (size, fn) => createPattern(size, size, (_c, ctx) => fn(ctx, size))
const tree = (ctx, x, y, r, crown, trunk) => {
  ctx.fillStyle = trunk; ctx.fillRect(x - r * 0.12, y + r * 0.55, r * 0.24, r * 0.6) // trunk
  ctx.fillStyle = crown; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() // crown
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill() // light side
}
const TREES = draw(64, (ctx) => { // forest and parks: scattered round trees
  tree(ctx, 14, 16, 7, '#5fae67', '#7a5a2b'); tree(ctx, 46, 12, 6, '#6cbb73', '#7a5a2b')
  tree(ctx, 30, 40, 8, '#4f9e5a', '#7a5a2b'); tree(ctx, 54, 50, 6, '#6cbb73', '#7a5a2b'); tree(ctx, 8, 54, 5, '#5fae67', '#7a5a2b')
})
const PALMS = draw(64, (ctx) => { // coconut palms, for the lowland green
  const palm = (x, y) => {
    ctx.strokeStyle = '#7a5a2b'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.quadraticCurveTo(x + 2, y + 3, x, y); ctx.stroke()
    ctx.strokeStyle = '#3f9a52'; ctx.lineWidth = 2
    for (const a of [-2.6, -1.9, -1.2, -0.5, 0.2, 0.9]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6 - 2, x + Math.cos(a) * 9, y + Math.sin(a) * 9 + 1); ctx.stroke() }
  }
  palm(16, 20); palm(48, 46)
})
const CROPS = draw(32, (ctx, s) => { // farmland: planted rows
  ctx.strokeStyle = 'rgba(120,160,60,.55)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3])
  for (let y = 4; y < s; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke() }
})
const GRASS = draw(32, (ctx) => { // grass and scrub: small tufts
  ctx.strokeStyle = 'rgba(80,140,70,.6)'; ctx.lineWidth = 1.3
  for (const [x, y] of [[8, 10], [24, 22], [14, 28]]) { ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x - 3, y - 4); ctx.moveTo(x, y); ctx.lineTo(x, y - 5); ctx.moveTo(x + 2, y); ctx.lineTo(x + 3, y - 4); ctx.stroke() }
})
const HATCH = draw(8, (ctx, s) => { // buildings: diagonal hatching, like an architect's plan
  ctx.strokeStyle = 'rgba(150,100,40,.45)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(-1, s + 1); ctx.lineTo(s + 1, -1); ctx.moveTo(-1, 1); ctx.lineTo(1, -1); ctx.moveTo(s - 1, s + 1); ctx.lineTo(s + 1, s - 1); ctx.stroke()
})
const WAVES = draw(32, (ctx) => { // rivers: little ripples
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.3
  for (const [x, y] of [[6, 10], [22, 24]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 3, y - 3, x + 6, y); ctx.quadraticCurveTo(x + 9, y + 3, x + 12, y); ctx.stroke() }
})

const kindOf = (f) => String(f?.props?.kind ?? '')
const TREE_KINDS = ['wood', 'forest', 'nature_reserve', 'national_park', 'park', 'garden', 'village_green']
const textures = [
  { dataLayer: 'landcover', symbolizer: new PolygonSymbolizer({ pattern: TREES }), filter: (_z, f) => ['forest'].includes(kindOf(f)), minzoom: 13 },
  { dataLayer: 'landcover', symbolizer: new PolygonSymbolizer({ pattern: CROPS }), filter: (_z, f) => kindOf(f) === 'farmland', minzoom: 14 },
  { dataLayer: 'landcover', symbolizer: new PolygonSymbolizer({ pattern: GRASS }), filter: (_z, f) => ['grassland', 'scrub'].includes(kindOf(f)), minzoom: 14 },
  { dataLayer: 'landuse', symbolizer: new PolygonSymbolizer({ pattern: TREES }), filter: (_z, f) => TREE_KINDS.includes(kindOf(f)), minzoom: 14 },
  { dataLayer: 'landuse', symbolizer: new PolygonSymbolizer({ pattern: PALMS }), filter: (_z, f) => ['allotments', 'playground'].includes(kindOf(f)), minzoom: 15 },
  { dataLayer: 'buildings', symbolizer: new PolygonSymbolizer({ pattern: HATCH, stroke: '#b98a4a', width: 0.8 }), minzoom: 15 },
  { dataLayer: 'water', symbolizer: new PolygonSymbolizer({ pattern: WAVES }), filter: (_z, f) => f.geomType === 3, minzoom: 14 },
]
// the textures go just before the roads, so roads and labels stay clear on top
export const texturedRules = (lang = 'en') => {
  const base = paintRules(SIGNBOARD)
  const at = base.findIndex((r) => r.dataLayer === 'roads')
  return { paintRules: [...base.slice(0, at), ...textures, ...base.slice(at)], labelRules: labelRules(SIGNBOARD, lang), backgroundColor: PAPER }
}
