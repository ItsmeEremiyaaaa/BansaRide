import { useState } from 'react'
import WeatherIcon from './WeatherIcon'
import { useLook } from './mood'

// Real-time weather for Bansalan (Open-Meteo, refreshed every 10 minutes while there is a signal).
const WORDS = (code) => {
  if (code === 0) return ['Clear sky', '☀️']
  if (code === 1 || code === 2) return ['Partly cloudy', '⛅']
  if (code === 3) return ['Cloudy', '☁️']
  if (code === 45 || code === 48) return ['Foggy', '🌫️']
  if ([51, 53, 55, 56, 57].includes(code)) return ['Drizzle', '🌦️']
  if ([61, 80].includes(code)) return ['Light rain', '🌧️']
  if ([63, 81].includes(code)) return ['Rain', '🌧️']
  if ([65, 67, 82].includes(code)) return ['Heavy rain', '🌧️']
  if ([95, 96, 99].includes(code)) return ['Thunderstorm', '⛈️']
  return ['Weather', '🌤️']
}
const COMPASS = (d) => ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.round(((d ?? 0) % 360) / 45) % 8]
const ago = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 1 ? 'just now' : `${m} min ago` }

// A small read-only pill (icon, degrees and word) for other screens.
export function WeatherPill() {
  const { weather, mood } = useLook()
  if (!weather) return null
  return <span className="wx-pill"><WeatherIcon code={weather.code} night={mood === 'night'} size={20} /><b>{weather.temp}°</b></span>
}

export default function WeatherChip({ weather }) {
  const [open, setOpen] = useState(false)
  const night = useLook().mood === 'night'
  if (!weather) return null
  const [word] = WORDS(weather.code)
  return (
    <div className="wx">
      <button className="wx-chip" aria-expanded={open} onClick={() => setOpen((v) => !v)} aria-label={`Weather in Bansalan: ${weather.temp} degrees, ${word}. Tap for details.`}>
        <WeatherIcon code={weather.code} night={night} size={28} />
      </button>
      {open && (
        <div className="wx-card" role="dialog" aria-label="Weather details">
          <div className="wx-head"><b><WeatherIcon code={weather.code} night={night} size={22} /> Bansalan now</b><span>{ago(weather.at)}</span></div>
          <div className="wx-grid">
            <div><span>Feels like</span><b>{weather.feels}°C</b></div>
            <div><span>Humidity</span><b>{weather.humidity}%</b></div>
            <div><span>Wind</span><b>{weather.wind} km/h</b><em>from the {COMPASS(weather.windDir)}</em></div>
            <div><span>Rain now</span><b>{weather.rainMm ? `${weather.rainMm} mm` : 'None'}</b></div>
            <div><span>Clouds</span><b>{weather.cloud}%</b></div>
          </div>
          <p className="wx-note">From Open-Meteo. Tricycles may be slow in heavy rain, and the mountain roads can be muddy.</p>
        </div>
      )}
    </div>
  )
}
