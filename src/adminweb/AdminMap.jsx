import { useEffect, useMemo, useState } from 'react'
import { Icon, useApp } from '../components'
import MapView from '../MapView'
import Map3D from '../Map3D'
import { useLook } from '../mood'
import { stations, stationPlace } from '../data'
import { loadInbox, approveSpot, setInboxStatus, loadApprovedSpots, loadStandEdits, loadNotices } from '../admin'
import { Problem } from './sections'

// The whole Bansalan map for admins, in 2D or 3D: every stand, the approved rider spots, the spots waiting for approval
// and the announcements with a place. Tap a waiting spot to approve or reject it right here.
const CENTER = [6.7869, 125.2105]
const LAYERS = [['pending', 'Waiting for approval'], ['approved', 'Approved spots'], ['stands', 'BTODA groups'], ['notices', 'Announcements']]

export default function AdminMap() {
  const { say } = useApp()
  const look = useLook()
  const [three, setThree] = useState(false)
  const [show, setShow] = useState({ pending: true, approved: true, stands: true, notices: true })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [n, setN] = useState(0)
  const [sel, setSel] = useState(null) // the id of the picked pin
  const [name, setName] = useState('')
  const [focus, setFocus] = useState(null)

  useEffect(() => {
    let on = true
    setError('')
    Promise.all([loadInbox('new'), loadApprovedSpots(), loadStandEdits(), loadNotices()])
      .then(([inbox, approved, edits, notices]) => on && setData({ pending: inbox.filter((m) => m.kind === 'spot' && m.lat != null), approved, edits: Object.fromEntries(edits.map((e) => [e.station_id, e])), notices: notices.filter((x) => x.lat != null) }),
        (e) => on && setError(e.message))
    return () => { on = false }
  }, [n])

  const items = useMemo(() => {
    if (!data) return []
    const out = []
    if (show.pending) for (const m of data.pending) out.push({ id: 'p-' + m.id, lat: m.lat, lon: m.lon, kind: 'place', label: '', glyph: 'Pending', title: 'Waiting for approval', sub: m.about || 'Marked by a rider', type: 'pending', m })
    if (show.approved) for (const s of data.approved) out.push({ id: 'a-' + s.id, lat: s.lat, lon: s.lon, kind: 'spot', label: '', glyph: 'vehicle', title: s.name, sub: 'Approved rider spot', type: 'approved', s })
    if (show.stands) for (const s of stations) {
      const p = stationPlace(s); if (!p) continue
      const e = data.edits[s.id]
      out.push({ id: 's-' + s.id, lat: p.lat, lon: p.lon, kind: 'spot', label: '', glyph: s.type === 'motor' ? 'moto' : 'vehicle', title: e?.name ?? s.name, sub: e?.suspended ? 'Suspended' : p.name, closed: !!e?.suspended, type: 'stand', s, e })
    }
    if (show.notices) for (const x of data.notices) out.push({ id: 'n-' + x.id, lat: x.lat, lon: x.lon, kind: 'place', label: '', glyph: 'Notice', title: x.title, sub: 'Announcement', type: 'notice', x })
    return out
  }, [data, show])
  const markers = useMemo(() => items.map(({ m, s, e, x, type, ...k }) => k), [items]) // eslint-disable-line no-unused-vars
  const picked = items.find((k) => k.id === sel)
  useEffect(() => { if (picked?.type === 'pending') setName(picked.m.name || (picked.m.about ? picked.m.about.replace(/^near /, '').split(' · ')[0] + ' waiting spot' : 'Waiting spot')) }, [sel]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id) => setSel(id)
  const go = (k) => { setSel(k.id); setFocus([k.lat + 1e-9 * (Date.now() % 7), k.lon]) }
  const act = async (fn, msg) => { try { await fn(); say(msg); setSel(null); setN((x) => x + 1) } catch (e) { say(e.message) } }

  if (error) return <Problem error={error} retry={() => setN((x) => x + 1)} />
  const pending = data?.pending ?? []
  return (
    <div className="awm">
      <div className="awm-map">
        {three
          ? <Map3D key={look.mood} mood={look.mood} center={focus ?? CENTER} markers={markers} onPick={pick} pitch={55} />
          : <MapView mood={look.mood} markers={markers} center={CENTER} zoom={15} fit={false} focus={focus} onPick={pick} selId={sel} cluster zoomControl label="Admin map of Bansalan" />}
        <div className="awm-tools">
          <button className={'icon-btn view-btn' + (three ? ' on' : '')} aria-pressed={three} onClick={() => setThree((v) => !v)}>{three ? '2D' : '3D'}</button>
          <button className="icon-btn" aria-label="Reload the pins" onClick={() => setN((x) => x + 1)}><Icon name="repeat" /></button>
        </div>
        <div className="awm-layers">
          {LAYERS.map(([k, l]) => (
            <label key={k} className={'awm-layer ' + k}><input type="checkbox" checked={show[k]} onChange={(e) => setShow((x) => ({ ...x, [k]: e.target.checked }))} /><i />{l}{k === 'pending' && pending.length > 0 && <b>{pending.length}</b>}</label>
          ))}
        </div>
      </div>
      <aside className="awm-panel">
        {picked ? (
          <section className="adm-card">
            <header className="awm-head"><b>{picked.title}</b><button className="icon-btn flat" aria-label="Close" onClick={() => setSel(null)}><Icon name="close" /></button></header>
            <p className="adm-about">{picked.sub}</p>
            <p className="adm-meta">{picked.lat.toFixed(5)}, {picked.lon.toFixed(5)}</p>
            {picked.type === 'pending' && (
              <>
                <label className="aw-field"><span>Name shown on the map</span><input className="boxed input" maxLength="60" value={name} onChange={(e) => setName(e.target.value)} /></label>
                <div className="adm-actions">
                  <button className="btn sm ok" onClick={() => act(() => approveSpot(picked.m.id, name || 'Waiting spot'), 'Approved. It shows on the map for everyone.')}>Approve, show on map</button>
                  <button className="btn secondary sm" onClick={() => act(() => setInboxStatus(picked.m.id, 'dismissed'), 'Spot rejected')}>Reject</button>
                </div>
              </>
            )}
            {picked.type === 'approved' && <div className="adm-actions"><button className="btn secondary sm" onClick={() => act(() => setInboxStatus(picked.s.id, 'dismissed'), 'Taken off the map')}>Take off the map</button></div>}
            {picked.type === 'stand' && (
              <>
                {picked.e?.suspended && <p className="adm-tag warn">Suspended: hidden from riders</p>}
                <div className="adm-actions"><a className="btn secondary sm" href="#/groups">Edit in BTODA groups</a></div>
              </>
            )}
            {picked.type === 'notice' && <p className="adm-body">{picked.x.body}</p>}
          </section>
        ) : (
          <section className="adm-card">
            <h2 className="sec">Waiting for approval · {pending.length}</h2>
            {!data ? <p className="hint">Loading…</p> : pending.length === 0 ? <p className="hint">No marked spots are waiting. Spots riders mark show here as orange pins.</p> : (
              <div className="awm-list">
                {pending.map((m) => {
                  const k = items.find((x) => x.id === 'p-' + m.id) ?? { id: 'p-' + m.id, lat: m.lat, lon: m.lon }
                  return <button key={m.id} className="awm-item" onClick={() => go(k)}><i className="awm-dot pending" /><span><b>{m.about || 'Marked spot'}</b><em>{new Date(m.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</em></span><Icon name="chevron" /></button>
                })}
              </div>
            )}
            <p className="hint">Tap any pin to see it. Orange pins are waiting for you; they are not on the riders' map yet.</p>
          </section>
        )}
      </aside>
    </div>
  )
}
