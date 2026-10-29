import { useEffect, useRef, useState } from 'react'
import { Icon } from './components'
import { places, routeBetween, fareText } from './data'

// A full-screen list to pick a pickup point or a destination. Type to search.
export default function Picker({ title, otherId, selectedId, onPick, onClose, allowMe }) {
  const [q, setQ] = useState('')
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const term = q.trim().toLowerCase()
  const list = places.filter((p) => [p.name, p.kind, p.also ?? ''].some((x) => x.toLowerCase().includes(term)))
  const groups = [
    ['Barangays and sitios', list.filter((p) => p.kind === 'Barangay' || p.kind === 'Sitio')],
    ['Places', list.filter((p) => p.kind !== 'Barangay' && p.kind !== 'Sitio' && p.kind !== 'Street')],
    ['Streets', list.filter((p) => p.kind === 'Street')],
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
          {groups.map(([name, items]) => (
            <section key={name}>
              <h3 className="sec">{name}</h3>
              {items.map((p, i) => {
                const same = p.id === otherId
                const hit = otherId ? routeBetween(p.id, otherId) : null
                const disabled = same
                return (
                  <button key={p.id} className="pick-row rise" style={{ '--i': i }} disabled={disabled} aria-current={p.id === selectedId ? 'true' : undefined} onClick={() => onPick(p.id)}>
                    <span className={'ico ' + (p.kind === 'Barangay' || p.kind === 'Sitio' ? 'gold' : 'blue')}><Icon name={p.kind === 'Barangay' || p.kind === 'Sitio' ? 'town' : p.kind === 'Street' ? 'road' : 'pin'} /></span>
                    <span className="row-main"><span className="row-title">{p.name}</span><span className="row-sub">{p.kind}{p.also ? ` · also ${p.also}` : ''}</span></span>
                    {otherId && !same && (hit ? (hit.route.fare === null ? <span className="row-sub">Ask driver</span> : <span className="price small">{fareText(hit.route)}</span>) : <span className="row-sub">No route yet</span>)}
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
