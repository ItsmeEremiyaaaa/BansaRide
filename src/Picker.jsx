import { track } from './track'
import { useEffect, useRef, useState } from 'react'
import { Icon, useApp } from './components'
import { places, pois, towns, transitFare, POI_KINDS, routeBetween, fareText, metersBetween, fmtDist, fareFor } from './data'
import { offlineRide } from './rideFromMe'

// A full-screen list to pick a pickup point or a destination. Type to search.
export default function Picker({ title, otherId, selectedId, onPick, onClose, allowMe, withPois, withTowns }) {
  const [q, setQ] = useState('')
  const { loc } = useApp()
  const me = loc.state === 'ok' ? loc.ll : null // when we know where you are, the nearest places come first
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const term = q.trim().toLowerCase()
  const list = places.filter((p) => [p.name, p.kind, p.also ?? ''].some((x) => x.toLowerCase().includes(term)))
  const dist = (p) => (me ? metersBetween(me, [p.lat, p.lon]) : null)
  const byNear = (items) => (me ? [...items].sort((a, b) => dist(a) - dist(b)) : items)
  const near = me && !term ? byNear(places.filter((p) => p.kind !== 'Sitio')).slice(0, 6) : []
  const groups = [
    ...(near.length ? [['Near you', near]] : []),
    ['Barangays and sitios', byNear(list.filter((p) => p.kind === 'Barangay' || p.kind === 'Sitio'))],
    ['Places', byNear(list.filter((p) => p.kind !== 'Barangay' && p.kind !== 'Sitio' && p.kind !== 'Street'))],
    ['Streets', byNear(list.filter((p) => p.kind === 'Street'))],
    // towns and cities outside Bansalan (Digos, Kapatagan, Davao...) open their own page with the bus, van and mini bus fares
    ...(withTowns && term.length >= 2 ? [['Other towns and cities', towns.filter((x) => x.name.toLowerCase().includes(term)).map((x) => ({ id: 'town:' + x.id, name: x.name, kind: 'Town', km: x.km, lat: x.lat, lon: x.lon }))]] : []),
    // shops, hotels, food and more show up when you type (they can be a destination for a fare check)
    ...(withPois && term.length >= 2 ? [['Shops, hotels and more', byNear(pois.filter((x) => [x.name, x.kind, x.sub ?? '', POI_KINDS[x.kind]?.label ?? ''].some((t) => t.toLowerCase().includes(term)))).slice(0, 30)]] : []),
  ].filter(([, items]) => items.length > 0)

  return (
    <div className="picker" role="dialog" aria-modal="true" aria-label={title}>
      <button className="picker-scrim" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div className="picker-panel">
        <div className="grab" aria-hidden="true" />
        <div className="picker-head">
          <h2>{title}</h2>
          <button className="icon-btn flat" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </div>
        <label className="search-input">
          <Icon name="search" />
          <input ref={input} type="search" placeholder="Search a barangay or place" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </label>
        <div className="picker-list">
          {allowMe && !term && (
            <button className="pick-row" aria-current={selectedId === 'me' ? 'true' : undefined} onClick={() => onPick('me')}>
              <span className="ico blue"><Icon name="locate" /></span>
              <span className="row-main"><span className="row-title">My location</span><span className="row-sub">Start from where you are now</span></span>
              {selectedId === 'me' && <Icon name="check" className="chev" />}
            </button>
          )}
          {groups.length === 0 && <p className="hint">Nothing found for “{q}”.</p>}
          {groups.length === 0 && term.length >= 3 && (track('search_empty', term), null)}
          {groups.map(([name, items]) => (
            <section key={name}>
              <h3 className="sec">{name}</h3>
              {items.map((p, i) => {
                const same = p.id === otherId
                const isTown = p.kind === 'Town'
                const isPoi = p.sub !== undefined || isTown
                const hit = otherId && !isPoi ? routeBetween(p.id, otherId) : null
                const disabled = same
                return (
                  <button key={p.id} className="pick-row rise" style={{ '--i': i }} disabled={disabled} aria-current={p.id === selectedId ? 'true' : undefined} onClick={() => onPick(p.id)}>
                    <span className={'ico ' + (p.kind === 'Barangay' || p.kind === 'Sitio' ? 'gold' : 'blue')}><Icon name={p.kind === 'Barangay' || p.kind === 'Sitio' ? 'town' : p.kind === 'Street' ? 'road' : 'pin'} /></span>
                    <span className="row-main"><span className="row-title">{p.name}</span><span className="row-sub">{isTown ? `${p.km} km from Bansalan · bus ₱${transitFare('bus', p.km).student}–${transitFare('bus', p.km).adult}` : <>{p.kind}{me ? ` · ${fmtDist(dist(p))} from you` : ''}{p.also ? ` · also ${p.also}` : ''}</>}</span></span>
                    {(!otherId || otherId === 'me') && me && !isTown && (() => { const r = offlineRide(me, p); return r.vehicle === 'Motor' ? <span className="row-sub">Ask driver</span> : <span className="price small">₱{fareFor(r.km, 'elementary')}–{fareFor(r.km, 'adult')}</span> })()}
                    {otherId && otherId !== 'me' && !same && !isPoi && (hit ? (hit.route.fare === null ? <span className="row-sub">Ask driver</span> : <span className="price small">{fareText(hit.route)}</span>) : <span className="row-sub">No route yet</span>)}
                    {p.id === selectedId && <Icon name="check" className="chev" />}
                  </button>
                )
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
