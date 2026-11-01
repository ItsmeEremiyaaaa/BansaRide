import { supabase } from './auth'
import { applyFareSettings, applyStandData } from './data'

// What the admin changes from the admin website: fares, BTODA groups and members, approved waiting spots and announcements.
// The last copy is kept on the phone, so it is used at once (and offline); a fresh copy is fetched when there is a signal.
const KEY = 'bansaride.live.v1'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? {} } catch { return {} } }
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* storage is optional */ } }

let state = read()
const listeners = new Set()
let version = 0
export const liveVersion = () => version
export const onLive = (f) => { listeners.add(f); return () => listeners.delete(f) }

function apply(v) {
  try { applyFareSettings(v.fares) } catch { /* keep the built-in fares */ }
  try { applyStandData(v.edits ?? [], v.spots ?? []) } catch { /* keep the built-in stands */ }
  version++
  listeners.forEach((f) => f(version))
}
apply(state) // the saved copy, before the first screen is drawn

// rainy: whether it is raining in Bansalan now (rain-only notices, like a muddy road, show only then)
export const announcements = (rainy = false) => (state.notices ?? []).filter((n) => (!n.ends_at || new Date(n.ends_at) > new Date()) && (!n.rain_only || rainy))

export async function refreshLive() {
  if (!supabase || !navigator.onLine) return
  const [fares, edits, spots, notices] = await Promise.all([
    supabase.from('app_settings').select('value').eq('key', 'fares').maybeSingle(),
    supabase.from('stand_edits').select('station_id, name, landmark, contact_name, contact_phone, verified, suspended, members'),
    supabase.rpc('approved_spots'),
    supabase.from('announcements').select('id, title, body, tone, lat, lon, ends_at, rain_only, created_at').eq('active', true).order('created_at', { ascending: false }).limit(10),
  ])
  // a part that is not set up in the database yet keeps its last good copy
  const next = {
    fares: fares.error ? state.fares : fares.data?.value ?? null,
    edits: edits.error ? state.edits : edits.data ?? [],
    spots: spots.error ? state.spots : spots.data ?? [],
    notices: notices.error ? state.notices : notices.data ?? [],
  }
  if (JSON.stringify(next) === JSON.stringify(state)) return
  state = next
  write(state)
  apply(state)
}
