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
