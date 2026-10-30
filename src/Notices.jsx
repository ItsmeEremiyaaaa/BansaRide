import { useState } from 'react'
import { Icon } from './components'
import { announcements } from './liveData'
import { useLook } from './mood'

// Announcements from the BansaRide team (posted on the admin website). A rider can close one; it stays closed on this phone.
const KEY = 'bansaride.notices.closed.v1'
const readClosed = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? [] } catch { return [] } }

export function useNotices() {
  const [closed, setClosed] = useState(readClosed)
  const { rain } = useLook()
  const list = announcements(rain).filter((n) => !closed.includes(n.id))
  const close = (id) => { const next = [...closed, id].slice(-50); setClosed(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* optional */ } }
  return [list, close]
}

// variant 'card' (Home: every notice in full) or 'slim' (Map: the newest one, tap to read it all)
export default function Notices({ variant = 'card', onShow }) {
  const [list, close] = useNotices()
  const [open, setOpen] = useState(false)
  if (!list.length) return null
  if (variant === 'slim') {
    const n = list[0]
    return (
      <div className={'notice slim tone-' + n.tone + (open ? ' open' : '')} role="status">
        <button className="notice-main" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Icon name="alert" /><b>{n.rain_only ? 'Rain: ' : ''}{n.title}</b>{list.length > 1 && <em>+{list.length - 1}</em>}
        </button>
        {open && (
          <div className="notice-more">
            {n.body && <p>{n.body}</p>}
            {n.lat != null && onShow && <button className="notice-link" onClick={() => { onShow(n); setOpen(false) }}><Icon name="pin" />Show on the map</button>}
          </div>
        )}
        <button className="notice-x" aria-label="Close this notice" onClick={() => close(n.id)}><Icon name="close" /></button>
      </div>
    )
  }
  return (
    <section className="notices" aria-label="Announcements">
      {list.map((n) => (
        <article key={n.id} className={'notice tone-' + n.tone}>
          <span className="notice-ico" aria-hidden="true"><Icon name="alert" /></span>
          <div className="notice-text">
            <b>{n.title}</b>
            {n.body && <p>{n.body}</p>}
          </div>
          <button className="notice-x" aria-label="Close this notice" onClick={() => close(n.id)}><Icon name="close" /></button>
        </article>
      ))}
    </section>
  )
}
