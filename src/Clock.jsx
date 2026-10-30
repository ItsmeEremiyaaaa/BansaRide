import { useEffect, useState } from 'react'
import { useLook } from './mood'
import WeatherIcon from './WeatherIcon'

// Today's date and the time in Bansalan (Philippine time), updated every few seconds.
const now = () => (import.meta.env.DEV && typeof window !== 'undefined' && window.__bansaNow ? window.__bansaNow() : Date.now())
const fmt = (ms, lang) => {
  const loc = lang === 'bis' ? 'fil-PH' : 'en-PH'
  const d = new Date(ms)
  const day = new Intl.DateTimeFormat(loc, { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric' }).format(d)
  const time = new Intl.DateTimeFormat(loc, { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(d)
  const iso = new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 16)
  return { day, time, iso }
}

export default function Clock({ lang = 'en' }) {
  const [ms, setMs] = useState(now)
  const { weather, mood } = useLook()
  useEffect(() => {
    const id = setInterval(() => setMs(now()), 15000)
    return () => clearInterval(id)
  }, [])
  const { day, time, iso } = fmt(ms, lang)
  return (
    <p className="clock-line">
      <time dateTime={iso}><b>{time}</b><span>{day}</span></time>
      {weather && <span className="clock-wx"><WeatherIcon code={weather.code} night={mood === 'night'} size={20} />{weather.temp}°</span>}
    </p>
  )
}
