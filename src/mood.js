import { useEffect, useSyncExternalStore } from 'react'

// The look of the map is automatic: it follows Bansalan time (morning, day, evening, night) and the real weather (rain). People cannot change it.
// Only while developing, a look can be forced by saving it in the browser (for testing).
const KEY = 'bansaride.look.v1'
const listeners = new Set()
let state = { mode: 'auto', rain: false, rainAuto: false, now: Date.now() }
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved) state = { ...state, mode: saved.mode ?? 'auto', rainPick: saved.rainPick ?? 'auto' } } catch { /* optional */ }
const emit = () => { state = { ...state }; listeners.forEach((l) => l()) }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ mode: state.mode, rainPick: state.rainPick })) } catch { /* optional */ } }

export const timeMood = (ms = Date.now()) => {
  const d = new Date(ms + 8 * 3600 * 1000) // Bansalan time (UTC+8)
  const h = d.getUTCHours() + d.getUTCMinutes() / 60
  return h >= 5 && h < 8 ? 'morning' : h >= 8 && h < 16.5 ? 'day' : h >= 16.5 && h < 18.5 ? 'evening' : 'night'
}
// rain from the free Open-Meteo forecast (no key). It needs a signal; offline it keeps the last answer.
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
let started = false
const poll = async () => {
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=6.79&longitude=125.21&current=precipitation,weather_code')
    const j = await r.json()
    state.rainAuto = (j.current?.precipitation ?? 0) > 0.1 || RAIN_CODES.has(j.current?.weather_code)
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
  const rain = import.meta.env.DEV && s.rainPick === 'on' ? true : import.meta.env.DEV && s.rainPick === 'off' ? false : s.rainAuto
  return { mood, rain, mode: s.mode, rainPick: s.rainPick ?? 'auto', auto, rainAuto: s.rainAuto }
}
