import { useEffect, useState } from 'react'
import { BackButton, Bus, Van, Mini, YHeader, useApp } from '../components'
import { TRANSIT } from '../data'
import { pushState, setAlerts, disableAlerts, savedModes, testAlert } from '../push'
import { isNative } from '../native'
import WeatherIcon from '../WeatherIcon'

const hhmm = (min) => { const h = Math.floor(min / 60), m = min % 60; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }
const MODES = ['bus', 'van', 'mini']

// Ride alerts: a notice 30 minutes before the first ride and 1 hour before the last ride of the bus, van and mini bus.
export default function Notifications() {
  const { say } = useApp()
  const [state, setState] = useState('checking') // checking | unsupported | blocked | no-sw | off | on
  const [picked, setPicked] = useState(savedModes())
  const [busy, setBusy] = useState(false)

  useEffect(() => { pushState().then(setState) }, [])
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const save = async () => {
    setBusy(true)
    try {
      await setAlerts(picked)
      const s = await pushState()
      setState(s)
      say(picked.length ? 'Alerts are on.' : 'Alerts are off.')
    } catch (e) {
      if (e.message === 'blocked') { setState('blocked'); say('Notifications are blocked for this app.') } else say('Could not turn on alerts. Check your signal and try again.')
    }
    setBusy(false)
  }
  const off = async () => { setBusy(true); await disableAlerts(); setPicked([]); setState('off'); setBusy(false); say('Alerts are off.') }

  return (
    <>
      <YHeader title="Ride alerts" back={<BackButton to="menu" />} />
      <div className="body">
        <p className="lede">Get a notice 30 minutes before the first ride and 1 hour before the last ride, and when it rains or is very hot, even when the app is closed. Pick what you want.</p>

        {state === 'unsupported' && isNative && <div className="note static"><span><b>Pop-up alerts only, for now</b><span className="row-sub">While the app is open you still get the pop-up 30 minutes before the first ride and 1 hour before the last ride. Alerts when the app is closed work in the website version at bansalanride.netlify.app.</span></span></div>}
        {state === 'unsupported' && !isNative && <div className="note static"><span><b>Not available here</b><span className="row-sub">This phone or browser cannot receive alerts, or alerts are not switched on for this app yet. On iPhone, add the app to the Home Screen first.</span></span></div>}
        {state === 'no-sw' && <div className="note static"><span><b>Open the installed app</b><span className="row-sub">Alerts work in the live app, not in the test version on a computer.</span></span></div>}
        {state === 'blocked' && <div className="note static"><span><b>Alerts are blocked</b><span className="row-sub">Allow notifications for BansaRide in the phone or browser settings, then come back.</span></span></div>}

        <section className="card form">
          <h2 className="sec">Which alerts?</h2>
          {MODES.map((id) => {
            const m = TRANSIT[id]
            const Art = id === 'van' ? Van : id === 'mini' ? Mini : Bus
            return (
              <button type="button" key={id} className="alert-row" aria-pressed={picked.includes(id)} onClick={() => toggle(id)}>
                <Art className={id === 'mini' ? 'm-mini' : ''} width={56} height={38} />
                <span className="alert-text">
                  <b>{m.label}</b>
                  <span className="row-sub">First ride alert {hhmm(m.first - 30)} · last ride alert {hhmm(m.last - 60)}</span>
                </span>
                <span className="switch" aria-hidden="true"><i /></span>
              </button>
            )
          })}
          <button type="button" className="alert-row" aria-pressed={picked.includes('weather')} onClick={() => toggle('weather')}>
            <WeatherIcon code={1} size={40} />
            <span className="alert-text">
              <b>Weather</b>
              <span className="row-sub">A notice when it rains (slippery mountain roads) and when it is very hot, once a day each</span>
            </span>
            <span className="switch" aria-hidden="true"><i /></span>
          </button>
          <button className="btn" disabled={busy || ['unsupported', 'no-sw', 'checking'].includes(state)} onClick={save}>{busy ? 'Saving…' : state === 'on' ? 'Save my choice' : 'Turn on alerts'}</button>
          {state === 'on' && (
            <div className="cta-row">
              <button className="btn secondary" onClick={() => testAlert().catch(() => say('Could not show a test alert.'))}>Send a test</button>
              <button className="btn secondary" onClick={off} disabled={busy}>Turn off</button>
            </div>
          )}
          <p className="hint">We keep only your phone's alert address and the rides you picked. No name, no email, no location. Times are from the hours riders told us.</p>
        </section>
      </div>
    </>
  )
}
