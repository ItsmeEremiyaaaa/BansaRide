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
import { PolygonSymbolizer, LineSymbolizer, createPattern, exp } from 'protomaps-leaflet'

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

// ---------- "Maps" style: the clean, familiar phone-map look (this is the default now) ----------
const LAND = '#f3f0e9'
export const MAPS = {
  ...LIGHT,
  background: LAND, earth: LAND,
  park_a: '#d3e9bf', park_b: '#c8e4b0', wood_a: '#c8e4b0', wood_b: '#bcdca3', scrub_a: '#dcebc8', scrub_b: '#d3e6bc',
  hospital: '#f7dcd8', school: '#f4e7c9', industrial: '#ece8df', pedestrian: '#f7f5ef', sand: '#f1e6c4', beach: '#f1e6c4',
  water: '#a6d4f0',
  buildings: '#e7e2d6',
  // roads: white with a thin light-grey outline; main roads a touch bigger and tan like the reference highway
  minor_service_casing: '#e1ddd2', minor_casing: '#dedad0', link_casing: '#e0c08a', major_casing_early: '#d8d3c6', major_casing_late: '#d8d3c6',
  highway_casing_early: '#e2b46d', highway_casing_late: '#e2b46d',
  minor_service: '#ffffff', minor_a: '#ffffff', minor_b: '#ffffff', other: '#fbfaf6', link: '#fde7b6',
  major: '#ffffff', highway: '#fbd48b',
  bridges_minor_casing: '#d8d3c6', bridges_major_casing: '#d8d3c6', bridges_highway_casing: '#e2b46d', bridges_link_casing: '#e0c08a', bridges_other_casing: '#d8d3c6',
  bridges_minor: '#ffffff', bridges_major: '#ffffff', bridges_highway: '#fbd48b', bridges_link: '#fde7b6', bridges_other: '#ffffff',
  boundaries: '#b9b2a2',
  roads_label_minor: '#6b665c', roads_label_minor_halo: '#ffffff', roads_label_major: '#4d493f', roads_label_major_halo: '#ffffff',
  subplace_label: '#7c776b', subplace_label_halo: '#f7f5ef', city_label: '#4d493f', city_label_halo: '#f7f5ef',
  address_label: '#8a8577', address_label_halo: '#ffffff',
}
// The default style paints every road the same color, so the roads are drawn here: a grey outline under each, then the fill.
const KIND = (...k) => (_z, f) => k.includes(String(f?.props?.kind ?? ''))
const W = {
  path: exp(1.6, [[14, 0], [20, 7]]),
  minor: exp(1.6, [[13, 0], [18, 8]]),
  major: exp(1.6, [[6, 0], [12, 1.6], [15, 3], [18, 13]]),
  highway: exp(1.6, [[3, 0], [6, 1.1], [12, 1.6], [15, 5], [18, 15]]),
}
const road = (width, color, outline, ...kinds) => [
  { dataLayer: 'roads', symbolizer: new LineSymbolizer({ color: outline, width: (z, f) => (width(z, f) > 0 ? width(z, f) + 1.6 : 0) }), filter: KIND(...kinds) },
  { dataLayer: 'roads', symbolizer: new LineSymbolizer({ color, width }), filter: KIND(...kinds) },
]
const mapRoads = [
  ...road(W.path, '#fbfaf6', '#dedad0', 'other', 'path'),
  ...road(W.minor, '#ffffff', '#d9d4c8', 'minor_road'),
  ...road(W.major, '#ffffff', '#cfc9bb', 'major_road'),
  ...road(W.highway, '#fbd48b', '#dba452', 'highway'),
]
export const mapsRules = (lang = 'en') => {
  const base = paintRules(MAPS)
  const isDefaultRoad = (r) => r.dataLayer === 'roads' && r.symbolizer instanceof LineSymbolizer && r.symbolizer.color?.get?.(10) === MAPS.major && !r.symbolizer.dash
  const first = base.findIndex(isDefaultRoad)
  const kept = base.filter((r) => !isDefaultRoad(r))
  return { paintRules: [...kept.slice(0, first), ...mapRoads, ...kept.slice(first)], labelRules: labelRules(MAPS, lang), backgroundColor: LAND }
}

// the style in use: add ?style=signboard to an address to see the yellow signboard map instead
export const chosenRules = (lang = 'en') => (/[?&#]style=signboard/.test(window.location.href) ? texturedRules(lang) : mapsRules(lang))

// ---------- moods: morning, day, evening, night (and rain, drawn over them) ----------
// Each mood is a color set for the same map. Evening and night add lit windows in the houses and a dotted line of street lamps
// along the roads, with a soft warm glow under them.
const mix = (base, over) => ({ ...base, ...over })
const LABEL = (ink, halo) => ({ roads_label_minor: ink, roads_label_minor_halo: halo, roads_label_major: ink, roads_label_major_halo: halo, subplace_label: ink, subplace_label_halo: halo, city_label: ink, city_label_halo: halo, address_label: ink, address_label_halo: halo })
const ROADS = (fill, minorFill, casing, majorFill, highway, highwayCasing) => ({
  minor_service: minorFill, minor_a: minorFill, minor_b: minorFill, other: minorFill, link: majorFill, major: majorFill, highway,
  minor_service_casing: casing, minor_casing: casing, link_casing: casing, major_casing_early: casing, major_casing_late: casing, highway_casing_early: highwayCasing, highway_casing_late: highwayCasing,
  bridges_minor: minorFill, bridges_major: majorFill, bridges_highway: highway, bridges_link: majorFill, bridges_other: minorFill,
  bridges_minor_casing: casing, bridges_major_casing: casing, bridges_highway_casing: highwayCasing, bridges_link_casing: casing, bridges_other_casing: casing,
})
export const PALETTES = {
  day: { flavor: MAPS, roads: { minor: '#ffffff', minorLine: '#d9d4c8', major: '#ffffff', majorLine: '#cfc9bb', highway: '#fbd48b', highwayLine: '#dba452', path: '#fbfaf6', pathLine: '#dedad0' }, dark: false },
  morning: {
    flavor: mix(MAPS, { background: '#f7efdc', earth: '#f7efdc', park_a: '#d2ecb4', park_b: '#c4e5a6', wood_a: '#c4e5a6', wood_b: '#b6dc98', water: '#b4dcf2', buildings: '#eadfc6', ...LABEL('#6b5f4a', '#fff8e8') }),
    roads: { minor: '#fffaf0', minorLine: '#e0d4bd', major: '#fffaf0', majorLine: '#d6c8ae', highway: '#ffd98f', highwayLine: '#e0b060', path: '#fdf6e8', pathLine: '#e6dcc6' }, dark: false,
  },
  evening: {
    flavor: mix(MAPS, { background: '#e6cdbd', earth: '#e6cdbd', park_a: '#a9bd96', park_b: '#9db38b', wood_a: '#9db38b', wood_b: '#8fa77e', water: '#8aa9d1', buildings: '#c9a692', hospital: '#e8bdb4', school: '#e3c9a0', ...LABEL('#4a3328', '#f6e4d6') }),
    roads: { minor: '#fff0dc', minorLine: '#c9a98f', major: '#ffe6c6', majorLine: '#b99372', highway: '#ffc46b', highwayLine: '#c98a3c', path: '#f7e3cf', pathLine: '#c9a98f' }, dark: false, lamps: 0.7,
  },
  night: {
    flavor: mix(MAPS, { background: '#151c30', earth: '#151c30', park_a: '#1b3631', park_b: '#18302b', wood_a: '#18302b', wood_b: '#152a26', scrub_a: '#1a3430', scrub_b: '#17302c', water: '#1f3a66', buildings: '#262f4c', hospital: '#3a2a3c', school: '#2f2c46', industrial: '#1b2238', pedestrian: '#1b2238', sand: '#222a42', beach: '#222a42', boundaries: '#44507a', ...LABEL('#dbe3f7', '#151c30') }),
    roads: { minor: '#323d5e', minorLine: '#1d2540', major: '#3d4a72', majorLine: '#1d2540', highway: '#5a5368', highwayLine: '#1d2540', path: '#2a3452', pathLine: '#1d2540' }, dark: true, lamps: 1,
  },
}

// lit windows: a sparse pattern of warm squares, so some houses glow
const LIT = createPattern(24, 24, (_c, ctx) => {
  ctx.fillStyle = 'rgba(255,214,107,.95)'
  for (const [x, y] of [[4, 5], [15, 14]]) ctx.fillRect(x, y, 3, 3)
  ctx.fillStyle = 'rgba(255,214,107,.4)'
  ctx.fillRect(14, 4, 2, 2)
})
const roadKinds = (...k) => (_z, f) => k.includes(String(f?.props?.kind ?? ''))

// the colours of a mood for the 3D map (same palette as the flat map, roads included)
export const moodFlavor = (mood = 'day') => { const P = PALETTES[mood] ?? PALETTES.day; return { ...P.flavor, ...ROADS(null, P.roads.minor, P.roads.minorLine, P.roads.major, P.roads.highway, P.roads.highwayLine) } }

export const moodRules = (mood = 'day', lang = 'en') => {
  const P = PALETTES[mood] ?? PALETTES.day
  const flavor = { ...P.flavor, ...ROADS(null, P.roads.minor, P.roads.minorLine, P.roads.major, P.roads.highway, P.roads.highwayLine) }
  const r = P.roads
  const road = (width, color, outline, ...kinds) => [
    { dataLayer: 'roads', symbolizer: new LineSymbolizer({ color: outline, width: (z, f) => (width(z, f) > 0 ? width(z, f) + 1.6 : 0) }), filter: roadKinds(...kinds) },
    { dataLayer: 'roads', symbolizer: new LineSymbolizer({ color, width }), filter: roadKinds(...kinds) },
  ]
  const mapRoads = [
    ...road(W.path, r.path, r.pathLine, 'other', 'path'),
    ...road(W.minor, r.minor, r.minorLine, 'minor_road'),
    ...road(W.major, r.major, r.majorLine, 'major_road'),
    ...road(W.highway, r.highway, r.highwayLine, 'highway'),
  ]
  const base = paintRules(flavor)
  const isDefaultRoad = (x) => x.dataLayer === 'roads' && x.symbolizer instanceof LineSymbolizer && x.symbolizer.color?.get?.(10) === flavor.major && !x.symbolizer.dash
  const first = base.findIndex(isDefaultRoad)
  const kept = base.filter((x) => !isDefaultRoad(x))
  // evening and night: only the houses with lights on (no lamps along the roads)
  const lamps = P.lamps ? [{ dataLayer: 'buildings', symbolizer: new PolygonSymbolizer({ pattern: LIT }), minzoom: 15 }] : []
  const night = []
  const at = first < 0 ? kept.length : first
  return { paintRules: [...kept.slice(0, at), ...night, ...mapRoads, ...lamps, ...kept.slice(at)], labelRules: labelRules(flavor, lang), backgroundColor: flavor.background }
}
