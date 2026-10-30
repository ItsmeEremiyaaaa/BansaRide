import { useEffect, useRef, useState } from 'react'
import { Bus, Van } from './components'
import { TRANSIT, ALERT_FIRST_BEFORE, ALERT_LAST_BEFORE } from './data'

// The animated pop-up for the two ride alerts, for every big bus, van and mini bus: the first ride is about to start
// (30 minutes before) and the last ride is about to leave (1 hour before). It drops in from the top while the app is
// open; when the app is closed the same alerts arrive as notifications (see supabase/functions/send-ride-alerts).
// Keep the numbers in step with that function.
const WINDOW = 10 // minutes after the alert time during which it can still appear
const SEEN = 'bansaride.alertseen.v1'
const read = () => { try { return JSON.parse(localStorage.getItem(SEEN)) ?? {} } catch { return {} } }
const nowMs = () => (import.meta.env.DEV && window.__bansaNow ? window.__bansaNow() : Date.now()) // the test hook only exists in development

// which alerts are due right now, in Bansalan time (UTC+8)
const due = () => {
  const d = new Date(nowMs() + 8 * 3600 * 1000)
  const t = d.getUTCHours() * 60 + d.getUTCMinutes()
  const day = d.toISOString().slice(0, 10)
  const seen = read()
  const out = []
  for (const m of Object.values(TRANSIT)) {
    for (const kind of ['first', 'last']) {
      const at = kind === 'first' ? m.first - ALERT_FIRST_BEFORE : m.last - ALERT_LAST_BEFORE
      const key = `${day}|${m.id}|${kind}`
      if (t >= at && t < at + WINDOW && !seen[key]) out.push({ key, m, kind })
    }
  }
  return out
}

// "At night most pedicabs are not around": shown once each evening or night when the app is opened (8 PM to 4 AM).
const nightDue = () => {
  const d = new Date(nowMs() + 8 * 3600 * 1000)
  const h = d.getUTCHours()
  if (!(h >= 20 || h < 4)) return null
  const day = d.toISOString().slice(0, 10)
  const key = `${day}|night|notice`
  return read()[key] ? null : { key, night: true }
}

export default function RideAlertPop() {
  const [alert, setAlert] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const closeTimer = useRef(null)
  const goneTimer = useRef(null)

  const hide = () => {
    setLeaving(true)
    clearTimeout(closeTimer.current); clearTimeout(goneTimer.current)
    goneTimer.current = setTimeout(() => setAlert(null), 350)
  }
  useEffect(() => {
    const check = () => {
      if (alert) return
      const next = due()[0] ?? nightDue()
      if (!next) return
      const seen = read(); seen[next.key] = true // shown once
      try { localStorage.setItem(SEEN, JSON.stringify(seen)) } catch { /* optional */ }
      setLeaving(false); setAlert(next)
      // it closes itself after about 4 to 5 seconds
      clearTimeout(closeTimer.current); clearTimeout(goneTimer.current)
      closeTimer.current = setTimeout(() => setLeaving(true), next.night ? 5200 : 4200)
      goneTimer.current = setTimeout(() => setAlert(null), next.night ? 5600 : 4600)
    }
    check()
    const id = setInterval(check, 20000)
    return () => clearInterval(id) // the close timers are kept apart, so changing the alert never cancels them
  }, [alert])

  if (!alert) return null
  if (alert.night) {
    return (
      <button className={'tpop night' + (leaving ? ' leaving' : '')} onClick={hide} role="alert" aria-label="Night notice. Tap to close.">
        <span className="tpop-title">Night notice</span>
        <span className="tpop-row">
          <span className="tpop-moon" aria-hidden="true">☾</span>
          <span className="tpop-text"><b>Most pedicabs are not around now</b><em>After 8 PM the BTODA go home. Only a few stay at the 7-Eleven and a hotel until 4 AM. Be careful and plan your ride.</em></span>
        </span>
      </button>
    )
  }
  const { m, kind } = alert
  const Art = m.id === 'van' ? Van : Bus
  const text = kind === 'first'
    ? `The first ${m.label.toLowerCase()} leaves at ${m.firstText}, in ${ALERT_FIRST_BEFORE} minutes.`
    : `The last ${m.label.toLowerCase()} leaves at ${m.lastText}, in 1 hour. Do not get stranded.`
  return (
    <button className={'tpop' + (leaving ? ' leaving' : '')} onClick={hide} role="alert" aria-label={`${m.label} ${kind} ride alert. Tap to close.`}>
      <span className="tpop-title">{kind === 'first' ? 'First ride soon' : 'Last ride soon'}</span>
      <span className={'tpop-row ' + (kind === 'last' ? '' : 'open')}>
        <Art className={m.id === 'mini' ? 'm-mini' : ''} width={44} height={31} />
        <span className="tpop-text"><b>{m.label}</b><em>{text}</em></span>
        <i className="tpop-dot" aria-hidden="true" />
      </span>
    </button>
  )
}
