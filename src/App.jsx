import { useCallback, useEffect, useRef, useState } from 'react'
import { Ctx, Defs, Icon } from './components'
import { translate } from './i18n'
import { useOnline, useStored } from './hooks'
import { insideBansalan, metersBetween } from './data'
import Home from './screens/Home'
import { RouteScreen, RoutesList, MapScreen, Place } from './screens/RouteScreens'
import { Town, TownsList, Fares } from './screens/Towns'
import { DriversList, Station } from './screens/Drivers'
import Menu from './screens/Menu'
import Account from './screens/Account'
import Report from './screens/Report'
import Notifications from './screens/Notifications'
import RideAlertPop from './TransitPop'
import { clearMapMemo } from './mapMemo'
import { refreshLive, onLive, liveVersion } from './liveData'
import { FareSheet, Visitor, Poster, HowTo } from './screens/Sheets'
import Onboarding, { ONBOARDED } from './screens/Onboarding'

const SCREENS = { home: Home, routes: RoutesList, route: RouteScreen, map: MapScreen, place: Place, town: Town, towns: TownsList, fares: Fares, drivers: DriversList, station: Station, menu: Menu, account: Account, report: Report, notify: Notifications, howto: HowTo, farelist: FareSheet, visitor: Visitor, poster: Poster }
const TABS = [
  { key: 'home', icon: 'tabHome' },
  { key: 'routes', icon: 'tabRoutes' },
  { key: 'map', icon: 'tabMap' },
  { key: 'drivers', icon: 'tabTrike' },
  { key: 'fares', icon: 'tabFare' },
]
const TAB_OF = { menu: 'home', account: 'home', report: 'home', notify: 'home', howto: 'home', farelist: 'fares', visitor: 'home', poster: 'drivers', drivers: 'drivers', station: 'drivers', home: 'home', town: 'home', towns: 'home', routes: 'routes', route: 'routes', place: 'routes', map: 'map', fares: 'fares' }

// The app always opens on the map: a plain start (no screen in the address) or a start on Home goes to the map.
// A link to a particular screen (a station, a route) still opens that screen.
if (typeof window !== 'undefined' && ['', '#', '#/', '#/home'].includes(window.location.hash)) window.history.replaceState(window.history.state, '', '#/map')

// Screens live in the address (#/route/terminal-rizal), so links and the phone's back button work.
const parse = () => {
  const [, name = 'map', id, flag] = window.location.hash.replace(/^#/, '').split('/')
  return SCREENS[name] ? { name, params: { ...(id ? { id } : {}), ...(flag === 'r' ? { rev: true } : {}) } } : { name: 'home', params: {} }
}
const hashOf = (name, params) => `#/${name}${params.id ? `/${params.id}` : ''}${params.id && params.rev ? '/r' : ''}`

export default function App() {
  const [entry, setEntry] = useState(parse)
  const [seen, setSeen] = useState(() => { try { return !!localStorage.getItem(ONBOARDED) || /[?&]code=/.test(window.location.search) } catch { return true } }) // first run shows the intro
  const [dir, setDir] = useState('tab') // how the next screen should arrive: fwd, back or tab
  const [lang, setLang] = useStored('bansaride-lang', 'en')
  const [textSize, setTextSize] = useStored('bansaride-text', (() => { const px = parseFloat(getComputedStyle(document.documentElement).fontSize); return px >= 20 ? 'xlarge' : px >= 18 ? 'large' : 'normal' })()) // normal | large | xlarge
  useEffect(() => { document.documentElement.dataset.text = textSize }, [textSize])
  // the admin's changes: fetched now, every 10 minutes and when the signal comes back; screens redraw when they change
  const [live, setLive] = useState(liveVersion)
  useEffect(() => {
    const off = onLive(setLive)
    const pull = () => refreshLive().catch(() => {})
    pull()
    const id = setInterval(pull, 10 * 60 * 1000)
    window.addEventListener('online', pull)
    return () => { off(); clearInterval(id); window.removeEventListener('online', pull) }
  }, [])
  const [saved, setSaved] = useStored('bansaride-saved', [])
  const [recent, setRecent] = useStored('bansaride-recent', [])
  const [toast, setToast] = useState('')
  const timer = useRef()
  const pos = useRef(window.history.state?.i ?? 0)
  const online = useOnline()

  // Live location for the whole app: it keeps updating while the app is open, so distances change as you walk.
  const [loc, setLoc] = useState({ state: 'finding' }) // finding | ok | outside | denied | off
  const watch = useRef(null)
  const lastFix = useRef(null)
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setLoc({ state: 'off' }); return }
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude]
        const last = lastFix.current
        // ignore tiny jitter, but always accept a first fix or a change of accuracy
        if (last && metersBetween(last.ll, ll) < 3 && Math.abs(last.accuracy - pos.coords.accuracy) < 10 && Date.now() - last.at < 5000) return
        lastFix.current = { ll, accuracy: pos.coords.accuracy, at: Date.now() }
        setLoc({ state: insideBansalan(ll[0], ll[1]) ? 'ok' : 'outside', ll, accuracy: Math.round(pos.coords.accuracy) })
      },
      (err) => setLoc({ state: err.code === 1 ? 'denied' : 'off' }),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 20000 },
    )
  }, [])
  useEffect(() => {
    startWatch()
    // save the battery while the app is not on screen
    const onVis = () => {
      if (document.hidden) { if (watch.current !== null) { navigator.geolocation?.clearWatch(watch.current); watch.current = null } } else startWatch()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); if (watch.current !== null) navigator.geolocation?.clearWatch(watch.current) }
  }, [startWatch])

  // History: every entry remembers i (its place in the browser history, to know back from forward), d (how many screens deep
  // it is inside the current tab) and from (the screen before it). That is what makes Back and Forward land where you expect.
  useEffect(() => {
    if (!window.history.state?.i && window.history.state?.i !== 0) window.history.replaceState({ i: 0, d: 0, from: '' }, '')
    const onPop = () => {
      const st = window.history.state ?? { i: pos.current, d: 0, from: '' }
      setDir(st.i < pos.current ? 'back' : st.i > pos.current ? 'fwd' : 'tab')
      pos.current = st.i
      setEntry(parse())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // mode: false = open a screen on top (pushed); true = switch to the root of a tab; 'replace' = swap this screen
  // for another one at the same place (for example choosing another town) without adding to the history.
  const go = useCallback((name, params = {}, mode = false) => {
    const cur = window.history.state ?? { i: pos.current, d: 0, from: '' }
    const hash = hashOf(name, params)
    const here = window.location.hash || '#/home'
    if (mode === 'replace') {
      window.history.replaceState({ ...cur }, '', hash)
      setDir('tab')
    } else if (mode === true) {
      if (cur.d === 0 && here === hash) return // already there
      if (cur.d === 0) window.history.replaceState({ i: cur.i, d: 0, from: '' }, '', hash) // tab to tab: no extra history
      else { pos.current = cur.i + 1; window.history.pushState({ i: pos.current, d: 0, from: '' }, '', hash) }
      setDir('tab')
    } else {
      pos.current = cur.i + 1
      window.history.pushState({ i: pos.current, d: cur.d + 1, from: here }, '', hash)
      setDir('fwd')
    }
    setEntry({ name, params })
  }, [])
  // Back: a real step back when the screen before is the one wanted, otherwise go up to it.
  const back = useCallback((to, params = {}) => {
    const cur = window.history.state ?? { i: pos.current, d: 0, from: '' }
    if (to) {
      if (cur.d > 0 && cur.from?.startsWith(`#/${to}`)) { window.history.back(); return }
      window.history.replaceState({ ...cur }, '', hashOf(to, params))
      setDir('back')
      setEntry({ name: to, params })
      return
    }
    if (cur.d > 0) window.history.back()
    else go('home', {}, true)
  }, [go])
  const say = useCallback((msg) => {
    setToast(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(''), 2400)
  }, [])
  const toggleSaved = useCallback((id) => {
    setSaved((list) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]))
  }, [setSaved])
  const remember = useCallback((id) => {
    setRecent((list) => [id, ...list.filter((x) => x !== id)].slice(0, 4))
  }, [setRecent])
  useEffect(() => () => clearTimeout(timer.current), [])

  // With a mouse, rows of chips and cards can be dragged sideways (touch screens already swipe). The snapping is switched off while
  // dragging (it fights the hand) and the row glides on after you let go, then settles on a card.
  useEffect(() => {
    let row = null, startX = 0, startLeft = 0, moved = false, lastX = 0, lastT = 0, vel = 0, raf = 0
    const glide = (r) => {
      cancelAnimationFrame(raf)
      const step = () => { vel *= 0.94; r.scrollLeft -= vel; if (Math.abs(vel) > 0.4) raf = requestAnimationFrame(step); else r.style.scrollSnapType = '' }
      raf = requestAnimationFrame(step)
    }
    const down = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      row = e.target.closest('.chips, .hscroll'); if (!row) return
      cancelAnimationFrame(raf)
      startX = lastX = e.clientX; startLeft = row.scrollLeft; moved = false; vel = 0; lastT = performance.now()
    }
    const move = (e) => {
      if (!row) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4 && !moved) { moved = true; row.style.scrollSnapType = 'none'; row.classList.add('dragging') }
      if (!moved) return
      row.scrollLeft = startLeft - dx
      const now = performance.now(); const dt = Math.max(1, now - lastT)
      vel = 0.8 * vel + 0.2 * ((e.clientX - lastX) / dt) * 16; lastX = e.clientX; lastT = now
    }
    const up = () => {
      if (!row) return
      const r = row; row = null; r.classList.remove('dragging')
      if (moved) { if (Math.abs(vel) > 1.5) glide(r); else r.style.scrollSnapType = '' }
    }
    const click = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false } }
    document.addEventListener('pointerdown', down); document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up); document.addEventListener('click', click, true)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('pointerdown', down); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); document.removeEventListener('click', click, true) }
  }, [])

  const t = (key) => translate(lang, key)
  if (!seen) return (<><Defs /><Onboarding onDone={() => setSeen(true)} /></>)
  const Screen = SCREENS[entry.name]
  const activeTab = TAB_OF[entry.name]
  const tabIndex = TABS.findIndex((x) => x.key === activeTab)
  const fullBleed = ['route', 'map', 'place'].includes(entry.name) || (entry.name === 'station')

  return (
    <Ctx.Provider value={{ go, back, t, lang, setLang, textSize, setTextSize, say, saved, toggleSaved, recent, remember, online, loc, live, retryLocation: startWatch, params: entry.params }}>
      <Defs />
      <div className="app">
        <main className="views">
          <section className={`view view-${entry.name} enter-${dir}` + (fullBleed ? ' flush' : '') + (entry.name === 'map' ? ' map' : '')} key={entry.name + (entry.params.id ?? '') + (entry.params.rev ? 'r' : '')}>
            <Screen />
          </section>
        </main>
        <nav className="tabs" aria-label="Main" style={{ '--i': Math.max(tabIndex, 0) }}>
          {TABS.map((tab) => (
            <button key={tab.key} className="tab" aria-label={t(tab.key)} aria-current={activeTab === tab.key ? 'page' : undefined} onClick={() => { clearMapMemo(); go(tab.key, {}, true) }}>
              <Icon name={tab.icon} />
              <span>{t(tab.key)}</span>
            </button>
          ))}
        </nav>
        <RideAlertPop />
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </Ctx.Provider>
  )
}
