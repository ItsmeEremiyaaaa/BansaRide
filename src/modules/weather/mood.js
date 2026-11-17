import { useEffect, useSyncExternalStore } from 'react'

// The look of the map is automatic: it follows Bansalan time (morning, day, evening, night) and the real weather (rain). People cannot change it.
// Only while developing, a look can be forced by saving it in the browser (for testing).
const KEY = 'bansaride.look.v1'
const listeners = new Set()
let state = { mode: 'auto', level: 0, thunder: false, weather: null, now: Date.now() } // level: 0 dry, 1 light rain, 2 strong rain
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved) state = { ...state, mode: saved.mode ?? 'auto', rainPick: saved.rainPick ?? 'auto' } } catch { /* optional */ }
const emit = () => { state = { ...state }; listeners.forEach((l) => l()) }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ mode: state.mode, rainPick: state.rainPick })) } catch { /* optional */ } }

export const timeMood = (ms = Date.now()) => {
  const d = new Date(ms + 8 * 3600 * 1000) // Bansalan time (UTC+8)
  const h = d.getUTCHours() + d.getUTCMinutes() / 60
  // night 6:30 PM to 4:30 AM, dawn (blue hour) to 6, morning to 9, day to 3 PM, golden hour to 5:30, then the short evening glow
  return h >= 4.5 && h < 6 ? 'dawn' : h >= 6 && h < 9 ? 'morning' : h >= 9 && h < 15 ? 'day' : h >= 15 && h < 17.5 ? 'golden' : h >= 17.5 && h < 18.5 ? 'evening' : 'night'
}
// rain and clouds from the free Open-Meteo forecast (no key). It needs a signal; offline it keeps the last answer.
// In the tropics the forecast models often disagree (one says overcast with drizzle while the sky is sunny and hot), so the middle answer of four is used.
const THUNDER = new Set([95, 96, 99]) // thunderstorm codes
const MODELS = ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'gem_seamless']
let started = false
const poll = async () => {
  try {
    // 'hourly' (the hour just ended), not 'current': with several models 'current' answers with only one of them
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=6.79&longitude=125.21&models=${MODELS}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&forecast_hours=1`)
    const h = (await r.json()).hourly ?? {}
    const all = (v) => MODELS.map((m) => h[`${v}_${m}`]?.[0]).filter((x) => x != null)
    const med = (v) => { const a = all(v).sort((x, y) => x - y); return a.length ? (a[(a.length - 1) >> 1] + a[a.length >> 1]) / 2 : undefined }
    const mm = med('precipitation'), cloud = med('cloud_cover')
    if (mm == null || cloud == null) return
    // the drizzle the models invent most hours is not rain anyone sees: rain starts at 0.5 mm an hour, strong rain at 2.5
    state.level = mm >= 2.5 ? 2 : mm >= 0.5 ? 1 : 0
    state.thunder = state.level > 0 && all('weather_code').filter((x) => THUNDER.has(x)).length >= 2
    // the icon and words follow the same answer: rain by amount, otherwise by how much cloud
    const code = state.thunder ? 95 : mm >= 7.6 ? 65 : mm >= 2.5 ? 63 : mm >= 0.5 ? 61 : cloud >= 85 ? 3 : cloud >= 40 ? 2 : cloud >= 15 ? 1 : 0
    state.weather = { temp: Math.round(med('temperature_2m')), feels: Math.round(med('apparent_temperature')), humidity: Math.round(med('relative_humidity_2m')), rainMm: state.level ? +mm.toFixed(1) : 0, cloud: Math.round(cloud), wind: Math.round(med('wind_speed_10m')), windDir: all('wind_direction_10m')[0], code, at: Date.now() }
    emit()
  } catch { /* no signal: keep the last answer */ }
}
const start = () => {
  if (started) return
  started = true
  poll(); setInterval(poll, 10 * 60 * 1000)
  setInterval(() => { state.now = Date.now(); emit() }, 60 * 1000) // moves from day to evening by itself
}

export const setLook = (mode, rainPick) => { if (mode) state.mode = mode; if (rainPick) state.rainPick = rainPick; save(); emit() }
const snap = () => state
const sub = (l) => { listeners.add(l); return () => listeners.delete(l) }

// { mood: 'dawn'|'morning'|'day'|'golden'|'evening'|'night', rain: boolean, mode, rainPick, auto: the time-of-day mood }
export function useLook() {
  useEffect(start, [])
  const s = useSyncExternalStore(sub, snap)
  const auto = timeMood(s.now)
  const forced = import.meta.env.DEV && s.mode !== 'auto' // never in the real app
  const mood = forced ? s.mode : auto
  const dev = import.meta.env.DEV && s.rainPick && s.rainPick !== 'auto' // testing only
  const level = dev ? { off: 0, light: 1, strong: 2, storm: 2 }[s.rainPick] ?? 0 : s.level
  const thunder = dev ? s.rainPick === 'storm' : s.thunder
  return { mood, rain: level > 0, level, thunder, mode: s.mode, auto, tick: s.now, weather: s.weather }
}
