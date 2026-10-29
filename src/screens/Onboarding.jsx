import { useEffect, useRef, useState } from 'react'
import { Icon, Trike, Bus, Moto } from '../components'
import { useAuth } from '../auth'
import { translate } from '../i18n'

export const ONBOARDED = 'bansaride.onboarded.v1'

// ---------- the four scenes ----------
function SceneWelcome() {
  return (
    <div className="scene s-welcome" aria-hidden="true">
      <span className="sun" />
      <span className="cloud c1" /><span className="cloud c2" />
      <div className="hills"><i /><i /><i /></div>
      <div className="road"><b /><b /><b /><b /></div>
      <Trike className="ride" width={190} height={130} />
      <span className="sign">BANSALAN</span>
    </div>
  )
}
function SceneMap() {
  return (
    <div className="scene s-map" aria-hidden="true">
      <svg viewBox="0 0 260 220" className="mapsvg">
        <rect x="6" y="6" width="248" height="208" rx="26" fill="#f4f1ea" stroke="#fff" strokeWidth="6" />
        <g stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M20 60 H240" /><path d="M20 120 H240" /><path d="M20 176 H240" />
          <path d="M70 18 V200" /><path d="M140 18 V200" /><path d="M200 18 V200" />
        </g>
        <path d="M168 40 Q210 90 150 130 Q100 160 62 196" fill="none" stroke="#bfe3ee" strokeWidth="14" strokeLinecap="round" opacity=".7" />
        <path className="route" d="M70 176 H140 V120 H200 V60" fill="none" stroke="#1560f0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 14" />
        <path className="route solid" d="M70 176 H140 V120 H200 V60" fill="none" stroke="#1560f0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="70" cy="176" r="10" fill="#fff" stroke="#1560f0" strokeWidth="5" />
      </svg>
      <span className="pin"><Icon name="pin" /></span>
      <span className="chip-float a">Rizal · 3.7 km</span>
      <span className="chip-float b">Works offline</span>
    </div>
  )
}
function SceneFares() {
  const cards = [['Student', '₱10', '#fff4d6'], ['Senior', '₱15', '#e3edff'], ['Adult', '₱20', '#ffe6df']]
  return (
    <div className="scene s-fares" aria-hidden="true">
      {cards.map(([who, fare, bg], n) => (
        <div className="ticket" key={who} style={{ '--n': n, background: bg }}>
          <span className="t-who">{who}</span>
          <span className="t-fare">{fare}</span>
          <span className="t-cut" />
        </div>
      ))}
      <span className="chip-float a">Bus 3 AM to 11 PM</span>
    </div>
  )
}
function SceneNear() {
  return (
    <div className="scene s-near" aria-hidden="true">
      <span className="ring r1" /><span className="ring r2" /><span className="ring r3" />
      <span className="me" />
      <Moto className="moto" width={120} height={82} />
      <span className="drop d1"><Icon name="pin" /><em>75 m</em></span>
      <span className="drop d2"><Icon name="pin" /><em>210 m</em></span>
      <span className="drop d3"><Icon name="pin" /><em>340 m</em></span>
    </div>
  )
}

const lang = (() => { try { return JSON.parse(localStorage.getItem('bansaride-lang')) || 'en' } catch { return 'en' } })()
const tx = (s) => translate(lang, s)
const SLIDES = [
  { tone: 'gold', tag: 'Welcome', scene: <SceneWelcome />, title: tx('Welcome to BansaRide'), text: tx('Your ride and fare guide for Bansalan, Davao del Sur. Tricycle, pedicab, motorcycle, bus and van, all in one place.') },
  { tone: 'blue', tag: 'The map', scene: <SceneMap />, title: tx('A real map of Bansalan'), text: tx('Real streets, barangays and roads from OpenStreetMap. Once you have opened it, the map keeps working with no signal.') },
  { tone: 'coral', tag: 'Fares', scene: <SceneFares />, title: tx('Know your fare first'), text: tx('See what a ride costs for a student, a senior or an adult, and when the bus, van and mini bus run. No more guessing.') },
  { tone: 'green', tag: 'Near you', scene: <SceneNear />, title: tx('Drivers near you, live'), text: tx('Find the nearest BTODA waiting spot and how far it is. The distance updates as you walk.') },
]
const LAST = SLIDES.length // the sign-in page

// First-run slides, then sign in. Shown once. A guest can skip everything.
export default function Onboarding({ onDone }) {
  const { configured, sendLink } = useAuth()
  const [i, setI] = useState(0)
  const [dx, setDx] = useState(0) // the finger's offset while dragging
  const [dragging, setDragging] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | busy | sent
  const [err, setErr] = useState('')
  const box = useRef(null)
  const drag = useRef(null)

  const finish = () => { try { localStorage.setItem(ONBOARDED, '1') } catch { /* storage is optional */ } onDone() }
  const go = (n) => setI(Math.max(0, Math.min(LAST, n)))

  // Drag with a finger or a mouse. The page follows, then snaps to the nearest step.
  const down = (e) => {
    if (e.target.closest('input, textarea, select, a')) return
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), on: false, id: e.pointerId }
  }
  const move = (e) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    const mx = e.clientX - d.x, my = e.clientY - d.y
    if (!d.on) {
      if (Math.abs(mx) < 8 || Math.abs(mx) < Math.abs(my)) return
      d.on = true; setDragging(true)
      try { box.current.setPointerCapture(e.pointerId) } catch { /* not needed everywhere */ }
    }
    const atEdge = (i === 0 && mx > 0) || (i === LAST && mx < 0)
    setDx(atEdge ? mx * 0.3 : mx) // a little resistance at the ends
  }
  const end = (e) => {
    const d = drag.current; drag.current = null
    if (!d || !d.on) return
    const w = box.current?.offsetWidth ?? 360
    const mx = e.clientX - d.x
    const v = mx / Math.max(1, performance.now() - d.t) // px per ms
    setDragging(false); setDx(0)
    if (Math.abs(mx) > w * 0.18 || Math.abs(v) > 0.45) go(i + (mx < 0 ? 1 : -1))
  }
  // The arrow keys work too.
  useEffect(() => {
    const key = (e) => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [i])

  const send = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Type a valid email.'); return }
    setErr(''); setState('busy')
    const { error } = await sendLink(email.trim())
    if (error) { setErr(error); setState('idle'); return }
    setState('sent')
    try { localStorage.setItem(ONBOARDED, '1') } catch { /* storage is optional */ }
  }
  const tone = i < LAST ? SLIDES[i].tone : 'blue'
  const w = box.current?.offsetWidth || 360
  const p = Math.max(-1, Math.min(1, dx / w)) // -1..1 how far the page is dragged, used for the parallax

  return (
    <div className={'onb tone-' + tone}>
      <div className="onb-top">
        <span className="onb-logo"><Trike width={34} height={24} />BansaRide</span>
        <span className="onb-lang" role="group" aria-label="Language">
          {[['en', 'EN'], ['bis', 'BIS']].map(([id, label]) => <button key={id} aria-pressed={lang === id} onClick={() => { try { localStorage.setItem('bansaride-lang', JSON.stringify(id)) } catch { /* optional */ } window.location.reload() }}>{label}</button>)}
        </span>
        {i < LAST && <button className="onb-skip" onClick={() => go(LAST)}>{tx('Skip')}</button>}
      </div>
      <div className="onb-steps" aria-hidden="true">
        {[...SLIDES, null].map((_, n) => <i key={n} className={n < i ? 'done' : n === i ? 'on' : ''} />)}
      </div>

      <div className={'onb-view' + (dragging ? ' dragging' : '')} ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <div className="onb-track" style={{ transform: `translateX(calc(${-i * 100}% + ${dx}px))`, '--p': p }}>
          {SLIDES.map((s, n) => (
            <section className={'onb-slide' + (n === i ? ' on' : '')} key={s.title} aria-hidden={n !== i} aria-label={s.title}>
              <div className="onb-art">
                <span className="onb-blob" />
                {s.scene}
              </div>
              <span className="onb-tag">{s.tag}</span>
              <h1>{s.title}</h1>
              <p>{s.text}</p>
            </section>
          ))}
          <section className={'onb-slide login' + (i === LAST ? ' on' : '')} aria-hidden={i !== LAST} aria-label="Sign in">
            <div className="onb-art small"><span className="onb-blob" /><Bus className="bigbus" width={170} height={118} /></div>
            <span className="onb-tag">Almost there</span>
            <h1>Get your own fare</h1>
            <p>Students, senior citizens and PWD sign in to see their discounted fare everywhere. Or just look around as a guest.</p>
            {configured && (state === 'sent' ? (
              <p className="onb-sent"><Icon name="check" className="inline" /> Check your email for the sign-in link, then open it on this phone.</p>
            ) : (
              <form className="onb-form" onSubmit={send}>
                <label className="sr-only" htmlFor="onb-email">Email</label>
                <input id="onb-email" className="onb-input" type="email" autoComplete="email" inputMode="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                {err && <span className="onb-err" role="alert">{err}</span>}
                <button className="onb-btn" disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Send me a sign-in link'}</button>
              </form>
            ))}
            <button className={'onb-guest' + (state === 'sent' ? ' primary' : '')} onClick={finish}>{state === 'sent' ? tx('Open the app') : tx('Continue as guest')}</button>
          </section>
        </div>
      </div>

      <div className="onb-foot">
        <button className="onb-back" onClick={() => go(i - 1)} aria-label="Back" disabled={i === 0}><Icon name="chevron" /></button>
        {i < LAST
          ? <button className="onb-next" onClick={() => go(i + 1)}>{i === LAST - 1 ? tx('Sign in') : tx('Next')}<Icon name="chevron" /></button>
          : <span className="onb-hint">Swipe back to review</span>}
      </div>
    </div>
  )
}
