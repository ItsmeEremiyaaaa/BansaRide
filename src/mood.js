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
  return h >= 5 && h < 8 ? 'morning' : h >= 8 && h < 16.5 ? 'day' : h >= 16.5 && h < 18.5 ? 'evening' : 'night'
}
// rain from the free Open-Meteo forecast (no key). It needs a signal; offline it keeps the last answer.
const THUNDER = new Set([95, 96, 99]) // thunderstorm codes
const STRONG = new Set([65, 67, 82, 95, 96, 99]) // heavy rain, violent showers, storms
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
let started = false
const poll = async () => {
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=6.79&longitude=125.21&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m')
    const j = await r.json()
    const mm = j.current?.precipitation ?? 0, code = j.current?.weather_code
    const wet = mm > 0.1 || RAIN_CODES.has(code)
    state.level = !wet ? 0 : mm >= 2.5 || STRONG.has(code) ? 2 : 1 // from 2.5 mm an hour it is strong rain
    state.thunder = THUNDER.has(code)
    const c = j.current ?? {}
    state.weather = { temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature), humidity: Math.round(c.relative_humidity_2m), rainMm: mm, cloud: Math.round(c.cloud_cover), wind: Math.round(c.wind_speed_10m), windDir: c.wind_direction_10m, code, at: Date.now() }
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

// { mood: 'morning'|'day'|'evening'|'night', rain: boolean, mode, rainPick, auto: the time-of-day mood }
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
