import { useEffect, useState } from 'react'
import { Bus, Van, Icon } from './components'
import { TRANSIT, transitStatus } from './data'

// A pop-up that drops in from the top when you open a place the bus, van or mini bus goes to.
// It says which ones are running right now. It goes away by itself, or when you tap it.
export default function TransitPop({ modes, name }) {
  const [shown, setShown] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const key = modes.join() + name

  useEffect(() => {
    setShown(true); setLeaving(false)
    const out = setTimeout(() => setLeaving(true), 5200)
    const gone = setTimeout(() => setShown(false), 5700)
    return () => { clearTimeout(out); clearTimeout(gone) }
  }, [key])

  if (!shown || modes.length === 0) return null
  const close = () => { setLeaving(true); setTimeout(() => setShown(false), 350) }
  return (
    <button className={'tpop' + (leaving ? ' leaving' : '')} onClick={close} role="status" aria-label={`Rides to ${name}. Tap to close.`}>
      <span className="tpop-title">Rides to {name}</span>
      {modes.map((id, n) => {
        const m = TRANSIT[id]
        const s = transitStatus(m)
        const Art = id === 'van' ? Van : Bus
        return (
          <span className={'tpop-row' + (s.open ? ' open' : '')} key={id} style={{ '--n': n }}>
            <Art className={id === 'mini' ? 'm-mini' : ''} width={40} height={28} />
            <span className="tpop-text"><b>{m.label}</b><em>{s.open ? `Running now · last ride ${m.lastText}` : `Not running · first ride ${m.firstText}`}</em></span>
            <i className="tpop-dot" aria-hidden="true" />
          </span>
        )
      })}
      <Icon name="close" className="tpop-x" />
    </button>
  )
}
