import { useEffect, useState } from 'react'
import { Icon } from './components'

const KEY = 'bansaride.install.dismissed'
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone

// Suggests adding BansaRide to the home screen, so it opens like an app and works offline.
export default function InstallPrompt() {
  const [ev, setEv] = useState(null) // the browser's install prompt (Android and desktop Chrome)
  const [hidden, setHidden] = useState(() => { try { return !!localStorage.getItem(KEY) } catch { return false } })
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    const on = (e) => { e.preventDefault(); setEv(e) }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])

  if (hidden || standalone() || (!ev && !ios)) return null
  const close = () => { try { localStorage.setItem(KEY, '1') } catch { /* optional */ } setHidden(true) }
  const install = async () => { await ev.prompt(); close() }
  return (
    <section className="install" aria-label="Add to home screen">
      <span className="install-ico"><Icon name="home" /></span>
      <span className="install-text">
        <b>Add BansaRide to your home screen</b>
        <span className="row-sub">{ev ? 'Opens like an app and works without signal.' : 'Tap Share, then Add to Home Screen.'}</span>
      </span>
      {ev && <button className="btn install-btn" onClick={install}>Add</button>}
      <button className="install-x" onClick={close} aria-label="Not now"><Icon name="close" /></button>
    </section>
  )
}
