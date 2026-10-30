import { useEffect, useMemo, useState } from 'react'
import { Icon, useApp } from '../components'
import MapView from '../MapView'
import Map3D from '../Map3D'
import { useLook } from '../mood'
import { stations, stationPlace } from '../data'
import { loadInbox, approveSpot, setInboxStatus, loadApprovedSpots, loadStandEdits, loadNotices, saveNotice, removeNotice } from '../admin'
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
  // posting an announcement straight from the map: tap where it is, then fill in the panel
  const [placing, setPlacing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [nf, setNf] = useState({ title: '', body: '', tone: 'warn', rain_only: false, ends: '' })
  const startNotice = () => { setThree(false); setSel(null); setPlacing(true); setDraft(null) }
  const stopNotice = () => { setPlacing(false); setDraft(null); setNf({ title: '', body: '', tone: 'warn', rain_only: false, ends: '' }) }
  const postNotice = async (e) => {
    e.preventDefault()
    if (nf.title.trim().length < 3) { say('Write a short title.'); return }
    if (!draft) { say('Tap the map where it is.'); return }
    try {
      await saveNotice({ title: nf.title.trim(), body: nf.body.trim() || null, tone: nf.tone, lat: draft[0], lon: draft[1], rain_only: nf.rain_only, active: true, ends_at: nf.ends ? new Date(nf.ends + 'T23:59:00+08:00').toISOString() : null })
      say('Posted. Riders see it on their map on the next refresh.'); stopNotice(); setN((x) => x + 1)
    } catch (err) { say(err.message) }
  }

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
    if (show.notices) for (const x of data.notices) out.push({ id: 'n-' + x.id, lat: x.lat, lon: x.lon, kind: 'place', label: '', glyph: 'Notice', title: x.title, sub: (x.active ? 'Announcement' : 'Announcement · stopped') + (x.rain_only ? ' · only when it rains' : ''), closed: !x.active, type: 'notice', x })
    return out
  }, [data, show])
  const markers = useMemo(() => items.map(({ m, s, e, x, type, ...k }) => k), [items]) // eslint-disable-line no-unused-vars
  const picked = items.find((k) => k.id === sel)
  useEffect(() => { if (picked?.type === 'pending') setName(picked.m.name || (picked.m.about ? picked.m.about.replace(/^near /, '').split(' · ')[0] + ' waiting spot' : 'Waiting spot')) }, [sel]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id) => { if (!placing) { setSel(id); return } const k = items.find((x) => x.id === id); if (k) setDraft([k.lat, k.lon]) } // while placing, a pin puts the notice right there
  const go = (k) => { setSel(k.id); setFocus([k.lat + 1e-9 * (Date.now() % 7), k.lon]) }
  const act = async (fn, msg) => { try { await fn(); say(msg); setSel(null); setN((x) => x + 1) } catch (e) { say(e.message) } }

  if (error) return <Problem error={error} retry={() => setN((x) => x + 1)} />
  const pending = data?.pending ?? []
  return (
    <div className="awm">
      <div className="awm-map">
        {three
          ? <Map3D key={look.mood} mood={look.mood} center={focus ?? CENTER} markers={markers} onPick={pick} pitch={55} />
          : <MapView mood={look.mood} markers={markers} center={CENTER} zoom={15} fit={false} focus={focus} onPick={pick} selId={sel} cluster zoomControl draft={placing ? draft : null} onMapClick={placing ? setDraft : undefined} label="Admin map of Bansalan" />}
        {placing && <div className="awm-hint">{draft ? 'Pinned. Tap again to move it.' : 'Tap the map where the announcement is'}</div>}
        <div className="awm-tools">
          <button className={'icon-btn view-btn' + (three ? ' on' : '')} aria-pressed={three} onClick={() => setThree((v) => !v)}>{three ? '2D' : '3D'}</button>
          <button className="icon-btn" aria-label="Reload the pins" onClick={() => setN((x) => x + 1)}><Icon name="repeat" /></button>
          <button className={'icon-btn awm-notice-btn' + (placing ? ' on' : '')} aria-label="New announcement on the map" title="New announcement on the map" onClick={() => (placing ? stopNotice() : startNotice())}><Icon name="alert" /></button>
        </div>
        <div className="awm-layers">
          {LAYERS.map(([k, l]) => (
            <label key={k} className={'awm-layer ' + k}><input type="checkbox" checked={show[k]} onChange={(e) => setShow((x) => ({ ...x, [k]: e.target.checked }))} /><i />{l}{k === 'pending' && pending.length > 0 && <b>{pending.length}</b>}</label>
          ))}
        </div>
      </div>
      <aside className="awm-panel">
        {placing ? (
          <form className="adm-card awm-form" onSubmit={postNotice}>
            <header className="awm-head"><b>New announcement</b><button type="button" className="icon-btn flat" aria-label="Cancel" onClick={stopNotice}><Icon name="close" /></button></header>
            <p className="adm-meta">{draft ? `Pinned at ${draft[0].toFixed(5)}, ${draft[1].toFixed(5)}` : 'Tap the map to pin where it is.'}</p>
            <label className="awx-field"><span>Title</span><input maxLength="80" value={nf.title} onChange={(e) => setNf((x) => ({ ...x, title: e.target.value }))} placeholder="Road closed for the fiesta" autoFocus /></label>
            <label className="awx-field"><span>Details</span><textarea rows="3" maxLength="400" value={nf.body} onChange={(e) => setNf((x) => ({ ...x, body: e.target.value }))} placeholder="What riders should know, and what to do" /></label>
            <div className="awx-tone" role="radiogroup" aria-label="Kind">
              {[['info', 'Info'], ['warn', 'Caution'], ['danger', 'Danger']].map(([k, l]) => <label key={k} className={'tone-' + k}><input type="radio" name="awm-tone" value={k} checked={nf.tone === k} onChange={() => setNf((x) => ({ ...x, tone: k }))} />{l}</label>)}
            </div>
            <label className="awx-field"><span>Show until (empty: until you stop it)</span><input type="date" value={nf.ends} onChange={(e) => setNf((x) => ({ ...x, ends: e.target.value }))} /></label>
            <label className="awx-check"><input type="checkbox" checked={nf.rain_only} onChange={(e) => setNf((x) => ({ ...x, rain_only: e.target.checked }))} />Only when it rains in Bansalan</label>
            <div className="adm-actions"><button className="awb go" disabled={!draft}><Icon name="check" />Post on the map</button><button type="button" className="awb ghost" onClick={stopNotice}>Cancel</button></div>
          </form>
        ) : picked ? (
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
            {picked.type === 'notice' && (
              <>
                {picked.x.body && <p className="adm-body">{picked.x.body}</p>}
                <div className="adm-actions">
                  <button className="awb ghost" onClick={() => act(() => saveNotice({ id: picked.x.id, active: !picked.x.active }), picked.x.active ? 'Stopped' : 'Showing again')}>{picked.x.active ? 'Stop showing' : 'Show again'}</button>
                  <button className="awb danger" onClick={() => { if (window.confirm('Delete this announcement?')) act(() => removeNotice(picked.x.id), 'Deleted') }}>Delete</button>
                </div>
              </>
            )}
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
            <button className="awb go" onClick={startNotice}><Icon name="alert" />New announcement on the map</button>
          </section>
        )}
      </aside>
    </div>
  )
}
