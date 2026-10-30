import { useEffect, useMemo, useState } from 'react'
import { Icon, useApp } from '../components'
import MapView from '../MapView'
import { stations, stationPlace, towns, fareSettings, applyFareSettings, fareFor, transitFare, routes, placeById, stationById, shortName, PASSENGERS } from '../data'
import {
  loadInbox, setInboxStatus, removeInbox, approveSpot, loadApprovedSpots, loadStandEdits, saveStandEdit, loadFares, saveFares,
  loadUsers, suspendUser, restoreUser, loadUserPosts, loadNotices, saveNotice, removeNotice,
} from '../admin'
import { Problem } from './sections'

// Part 2 of the admin website: approving spots (with a map), BTODA groups and members, fares, watching accounts, announcements.
const when = (iso) => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
const who = (id) => PASSENGERS.find((p) => p.id === id)?.short ?? (id === 'regular' ? 'Regular' : id ?? '—')
const routeName = (id) => { const r = routes.find((x) => x.id === id); return r ? `${shortName(r.from)} to ${shortName(r.to)}` : id }
const aboutPost = (p) => (p.route_id ? routeName(p.route_id) : p.place_id ? placeById(p.place_id)?.name ?? p.place_id : stationById(p.station_id)?.name ?? p.station_id)
const CENTER = [6.7869, 125.2105]

function useLoad(load, deps) {
  const [s, set] = useState({ data: null, error: '' })
  const [n, setN] = useState(0)
  useEffect(() => { let on = true; set((x) => ({ ...x, error: '' })); load().then((data) => on && set({ data, error: '' }), (e) => on && set({ data: null, error: e.message })); return () => { on = false } }, [...deps, n]) // eslint-disable-line react-hooks/exhaustive-deps
  return [s, () => setN((x) => x + 1)]
}
const useAct = (retry) => {
  const { say } = useApp()
  return async (fn, msg) => { try { await fn(); if (msg) say(msg); retry() } catch (e) { say(/suspended/.test(e.message) ? 'That account is suspended.' : e.message) } }
}

// a small map with one pin, or a map you can tap to choose a place
function SpotMap({ lat, lon, onPick, height = 200 }) {
  const markers = useMemo(() => (lat != null ? [{ id: 'x', lat, lon, kind: 'spot', label: '', title: 'Here' }] : []), [lat, lon])
  const center = useMemo(() => (lat != null ? [lat, lon] : CENTER), [lat, lon])
  return (
    <div className="aw-map" style={{ height }}>
      <MapView markers={markers} center={center} zoom={17} fit={false} focus={lat != null ? center : null} onMapClick={onPick} draft={onPick && lat != null ? [lat, lon] : null} label="Map of the place" />
    </div>
  )
}

// ---------- Inbox: problem reports, and marked spots that need approval before they show on the map ----------
export function Inbox() {
  const [status, setStatus] = useState('new')
  const [{ data, error }, retry] = useLoad(() => loadInbox(status), [status])
  const act = useAct(retry)
  const [names, setNames] = useState({})
  return (
    <>
      <div className="chips" role="group" aria-label="Which messages">
        {[['new', 'New'], ['approved', 'On the map'], ['done', 'Done'], ['dismissed', 'Dismissed']].map(([k, l]) => <button key={k} className="chip" aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>)}
      </div>
      {error ? <Problem error={error} retry={retry} /> : !data ? <p className="hint">Loading…</p> : data.length === 0 ? (
        <p className="adm-empty"><b>{status === 'approved' ? 'No approved spots yet' : 'Nothing here'}</b><span>{status === 'new' ? 'Problem reports and marked waiting spots from riders show up here.' : 'Items you move here are listed in this tab.'}</span></p>
      ) : (
        <div className="adm-list">
          {data.map((m) => {
            const spot = m.kind === 'spot'
            const name = names[m.id] ?? m.name ?? (m.about ? m.about.replace(/^near /, '').split(' · ')[0] + ' waiting spot' : 'Waiting spot')
            return (
              <article className={'adm-item' + (spot ? ' spot' : '')} key={m.id}>
                <header><b>{spot ? (status === 'approved' ? m.name || 'Waiting spot' : 'Marked waiting spot') : m.topic || 'Problem report'}</b><span>{when(m.created_at)}</span></header>
                {m.about && <p className="adm-about">{m.about}</p>}
                {m.body && <p className="adm-body">{m.body}</p>}
                {spot && m.lat != null && <SpotMap lat={m.lat} lon={m.lon} />}
                {spot && status === 'new' && (
                  <label className="aw-field"><span>Name shown on the map</span><input className="boxed input" maxLength="60" value={name} onChange={(e) => setNames((x) => ({ ...x, [m.id]: e.target.value }))} /></label>
                )}
                <div className="adm-actions">
                  {spot && status === 'new' && <button className="btn sm ok" onClick={() => act(() => approveSpot(m.id, name || 'Waiting spot'), 'Approved. It shows on the map for everyone.')}>Approve, show on map</button>}
                  {spot && status === 'approved' && <button className="btn secondary sm" onClick={() => act(() => setInboxStatus(m.id, 'dismissed'), 'Taken off the map')}>Take off the map</button>}
                  {!spot && status !== 'done' && <button className="btn sm" onClick={() => act(() => setInboxStatus(m.id, 'done'), 'Marked as done')}>Mark done</button>}
                  {status === 'new' && <button className="btn secondary sm" onClick={() => act(() => setInboxStatus(m.id, 'dismissed'), spot ? 'Spot rejected' : 'Dismissed')}>{spot ? 'Reject' : 'Dismiss'}</button>}
                  {(status === 'done' || status === 'dismissed') && <button className="btn secondary sm" onClick={() => act(() => setInboxStatus(m.id, 'new'), 'Moved back to new')}>Back to new</button>}
                  <button className="btn danger sm" onClick={() => { if (window.confirm('Delete this for good?')) act(() => removeInbox(m.id), 'Deleted') }}>Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

// ---------- BTODA groups and members ----------
function GroupEditor({ s, edit, onSaved }) {
  const { say } = useApp()
  const [f, setF] = useState(() => ({
    name: edit?.name ?? s.name, landmark: edit?.landmark ?? s.landmark ?? '', contact_name: edit?.contact_name ?? s.contact?.name ?? '', contact_phone: edit?.contact_phone ?? s.contact?.phone ?? '',
    verified: edit?.verified ?? !!s.verified, suspended: !!edit?.suspended, suspend_note: edit?.suspend_note ?? '', members: edit?.members ?? (s.members ?? []).map((n) => ({ name: n, suspended: false })),
  }))
  const [newMember, setNewMember] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const save = async () => {
    const phone = f.contact_phone.replace(/\D/g, '')
    if (phone && !/^09\d{9}$/.test(phone)) { say('The number must look like 09171234567.'); return }
    if ((f.contact_name && !phone) || (!f.contact_name && phone)) { say('Add both the contact name and the number, or neither.'); return }
    try {
      await saveStandEdit({ station_id: s.id, name: f.name.trim() || s.name, landmark: f.landmark.trim() || null, contact_name: f.contact_name.trim() || null, contact_phone: phone || null, verified: f.verified, suspended: f.suspended, suspend_note: f.suspend_note.trim() || null, members: f.members })
      say(f.suspended ? 'Saved. This group is suspended and hidden from the app.' : 'Saved. Riders see it the next time the app refreshes.')
      onSaved()
    } catch (e) { say(e.message) }
  }
  return (
    <div className="aw-editor">
      <div className="aw-grid2">
        <label className="aw-field"><span>Name</span><input className="boxed input" maxLength="60" value={f.name} onChange={set('name')} /></label>
        <label className="aw-field"><span>Where they wait</span><input className="boxed input" maxLength="120" value={f.landmark} onChange={set('landmark')} /></label>
        <label className="aw-field"><span>Contact person (for the Call button)</span><input className="boxed input" maxLength="40" value={f.contact_name} onChange={set('contact_name')} placeholder="President or a driver" /></label>
        <label className="aw-field"><span>Contact number</span><input className="boxed input" inputMode="tel" maxLength="13" value={f.contact_phone} onChange={set('contact_phone')} placeholder="09171234567" /></label>
      </div>
      <p className="hint">Only add a number with the person's permission. It is shown to everyone with a Call button.</p>
      <label className="adm-check"><input type="checkbox" checked={f.verified} onChange={set('verified')} />Verified by BTODA (shows the green badge)</label>
      <label className="adm-check warn"><input type="checkbox" checked={f.suspended} onChange={set('suspended')} />Suspend this group (hidden from the app until restored)</label>
      {f.suspended && <label className="aw-field"><span>Reason (only admins see it)</span><input className="boxed input" maxLength="120" value={f.suspend_note} onChange={set('suspend_note')} /></label>}
      <div className="aw-members">
        <b>Members · {f.members.length}</b>
        {f.members.map((m, i) => (
          <div key={m.name + i} className={'aw-member' + (m.suspended ? ' off' : '')}>
            <span>{m.name}</span>{m.suspended && <em>Suspended</em>}
            <button className="btn secondary sm" onClick={() => setF((x) => ({ ...x, members: x.members.map((y, j) => (j === i ? { ...y, suspended: !y.suspended } : y)) }))}>{m.suspended ? 'Restore' : 'Suspend'}</button>
            <button className="btn danger sm" onClick={() => setF((x) => ({ ...x, members: x.members.filter((_, j) => j !== i) }))}>Remove</button>
          </div>
        ))}
        <div className="adm-add-row">
          <input className="boxed input" maxLength="40" value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Add a member's name" />
          <button className="btn sm" onClick={() => { const n = newMember.trim(); if (n.length < 2) return; setF((x) => ({ ...x, members: [...x.members, { name: n, suspended: false }] })); setNewMember('') }}>Add</button>
        </div>
      </div>
      <div className="adm-actions"><button className="btn sm ok" onClick={save}>Save changes</button></div>
    </div>
  )
}

export function Groups() {
  const [{ data, error }, retry] = useLoad(async () => ({ edits: await loadStandEdits(), spots: await loadApprovedSpots().catch(() => []) }), [])
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [open, setOpen] = useState(null)
  if (error) return <Problem error={error} retry={retry} />
  if (!data) return <p className="hint">Loading…</p>
  const edits = Object.fromEntries((data.edits ?? []).map((e) => [e.station_id, e]))
  const all = [
    ...stations.filter((s) => !s.riderSpot),
    ...(data.spots ?? []).map((sp) => ({ id: 'rs-' + sp.id, type: 'toda', pos: { lat: sp.lat, lon: sp.lon }, name: sp.name, landmark: sp.about, members: [], streetSpot: true, riderSpot: true })),
  ]
  const term = q.trim().toLowerCase()
  const list = all.filter((s) => {
    const e = edits[s.id]
    if (kind === 'groups' && (s.streetSpot || s.type !== 'toda')) return false
    if (kind === 'spots' && !s.streetSpot) return false
    if (kind === 'suspended' && !e?.suspended) return false
    if (kind === 'contact' && !(e?.contact_phone || s.contact)) return false
    return !term || (e?.name ?? s.name).toLowerCase().includes(term) || (s.landmark ?? '').toLowerCase().includes(term)
  })
  return (
    <>
      <div className="aw-toolbar">
        <label className="search-input aw-search"><Icon name="search" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a group or spot" /></label>
        <div className="chips" role="group" aria-label="Show">
          {[['all', 'All'], ['groups', 'BTODA groups'], ['spots', 'Street spots'], ['contact', 'With contact'], ['suspended', 'Suspended']].map(([k, l]) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
        </div>
      </div>
      <p className="hint">{list.length} of {all.length}</p>
      <div className="aw-rows">
        {list.slice(0, 120).map((s) => {
          const e = edits[s.id]
          const p = stationPlace(s)
          return (
            <article key={s.id} className={'adm-item aw-row' + (e?.suspended ? ' off' : '')}>
              <header>
                <b>{e?.name ?? s.name}</b>
                <span className="adm-tags">
                  {s.type === 'motor' && <span className="adm-tag">Motorcycles</span>}
                  {s.riderSpot && <span className="adm-tag">From a rider</span>}
                  {(e?.verified ?? s.verified) && <span className="adm-tag">Verified</span>}
                  {(e?.contact_phone || s.contact) && <span className="adm-tag admin">Has contact</span>}
                  {e?.suspended && <span className="adm-tag warn">Suspended</span>}
                </span>
              </header>
              <p className="adm-about">{p ? `${p.name}${(e?.landmark ?? s.landmark) ? ' · ' + (e?.landmark ?? s.landmark) : ''}` : 'No position'}{(e?.members?.length ?? s.members?.length) ? ` · ${(e?.members ?? s.members).length} members` : ''}</p>
              <div className="adm-actions"><button className="btn secondary sm" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'Close' : 'Edit'}</button></div>
              {open === s.id && <GroupEditor s={s} edit={e} onSaved={() => { setOpen(null); retry() }} />}
            </article>
          )
        })}
      </div>
    </>
  )
}

// ---------- Fares ----------
export function Fares() {
  const { say } = useApp()
  const [{ data, error }, retry] = useLoad(loadFares, [])
  const builtIn = useMemo(() => fareSettings(), [])
  const [f, setF] = useState(null)
  useEffect(() => { if (data !== undefined && !error) setF(JSON.parse(JSON.stringify({ ...builtIn, ...(data || {}) }))) }, [data, error, builtIn])
  if (error) return <Problem error={error} retry={retry} />
  if (!f) return <p className="hint">Loading…</p>
  const num = (path) => (e) => { const v = e.target.value; setF((x) => { const y = JSON.parse(JSON.stringify(x)); let o = y; for (const k of path.slice(0, -1)) o = o[k] ??= {}; o[path.at(-1)] = v === '' ? '' : Number(v); return y }) }
  // preview with the values on screen (then put the saved ones back)
  applyFareSettings(f)
  const sample = [[0.5, 'Under 1 km'], [3.7, 'To Rizal, 3.7 km'], [10, '10 km']].map(([km, l]) => [l, fareFor(km, 'elementary'), fareFor(km, 'senior'), fareFor(km, 'adult')])
  const davao = transitFare('bus', 73.2, 'davao')
  applyFareSettings(data || builtIn)
  const save = async () => { try { await saveFares(f); say('Fares saved. Riders get them the next time the app refreshes.'); retry() } catch (e) { say(e.message) } }
  return (
    <div className="aw-fares">
      <section className="adm-card">
        <h2 className="sec">Tricycle and pedicab</h2>
        <p className="hint">Each passenger pays their base fare for the first km, plus the same amount for every km after, rounded to ₱5.</p>
        <div className="aw-grid3">
          {PASSENGERS.map((p) => <label key={p.id} className="aw-field"><span>{p.label} · base ₱</span><input className="boxed input" type="number" min="5" max="200" value={f.base[p.id]} onChange={num(['base', p.id])} /></label>)}
          <label className="aw-field"><span>Each km after the first · ₱</span><input className="boxed input" type="number" step="0.1" min="0" max="100" value={f.perKm} onChange={num(['perKm'])} /></label>
          <label className="aw-field"><span>Under {Math.round((f.near.km || 0) * 1000)} m · ₱ (everyone)</span><input className="boxed input" type="number" min="0" max="200" value={f.near.fare} onChange={num(['near', 'fare'])} /></label>
          <label className="aw-field"><span>Up to {f.short.km} km · ₱ (everyone)</span><input className="boxed input" type="number" min="0" max="200" value={f.short.fare} onChange={num(['short', 'fare'])} /></label>
        </div>
        <table className="aw-table"><thead><tr><th>Example</th><th>Elementary</th><th>Senior</th><th>Adult</th></tr></thead>
          <tbody>{sample.map(([l, a, b, c]) => <tr key={l}><th>{l}</th><td>₱{a}</td><td>₱{b}</td><td>₱{c}</td></tr>)}</tbody></table>
      </section>
      <section className="adm-card">
        <h2 className="sec">Bus, van and mini bus · adult fare by town</h2>
        <label className="aw-field aw-narrow"><span>Students, seniors and PWD pay · %</span><input className="boxed input" type="number" min="30" max="100" value={Math.round(f.discount * 100)} onChange={(e) => setF((x) => ({ ...x, discount: Number(e.target.value) / 100 }))} /></label>
        <table className="aw-table aw-towns"><thead><tr><th>Town</th><th>Big bus ₱</th><th>Van ₱</th><th>Mini bus ₱</th></tr></thead>
          <tbody>{towns.map((t) => (
            <tr key={t.id}><th>{t.name}<small>{t.km} km</small></th>
              {['bus', 'van', 'mini'].map((m) => <td key={m}><input className="boxed input" type="number" min="0" max="5000" value={f.towns?.[t.id]?.[m] ?? ''} placeholder="—" onChange={num(['towns', t.id, m])} /></td>)}
            </tr>
          ))}</tbody></table>
        <p className="hint">Big bus to Davao now: adult ₱{davao.adult}, student ₱{davao.student}. An empty box uses the estimate by distance.</p>
      </section>
      <div className="adm-actions aw-sticky">
        <button className="btn ok" onClick={save}>Save fares</button>
        <button className="btn secondary" onClick={() => { if (window.confirm('Go back to the fares written in the app?')) setF(JSON.parse(JSON.stringify(builtIn))) }}>Reset to the app's fares</button>
      </div>
    </div>
  )
}

// ---------- Accounts: watch, suspend, restore ----------
export function Users() {
  const [{ data, error }, retry] = useLoad(loadUsers, [])
  const act = useAct(retry)
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [open, setOpen] = useState(null)
  const [posts, setPosts] = useState({})
  if (error) return <Problem error={error} retry={retry} />
  if (!data) return <p className="hint">Loading…</p>
  const term = q.trim().toLowerCase()
  const list = data.filter((u) => (kind === 'suspended' ? u.suspended : kind === 'admins' ? u.is_admin : kind === 'discount' ? u.passenger && u.passenger !== 'regular' : kind === 'active' ? Number(u.posts_count) > 0 : true)
    && (!term || (u.email ?? '').toLowerCase().includes(term) || (u.display_name ?? '').toLowerCase().includes(term)))
  const view = async (u) => { if (open === u.user_id) { setOpen(null); return } setOpen(u.user_id); if (!posts[u.user_id]) setPosts((x) => ({ ...x, [u.user_id]: null })); try { const p = await loadUserPosts(u.user_id); setPosts((x) => ({ ...x, [u.user_id]: p })) } catch { setPosts((x) => ({ ...x, [u.user_id]: [] })) } }
  return (
    <>
      <div className="aw-toolbar">
        <label className="search-input aw-search"><Icon name="search" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name" /></label>
        <div className="chips" role="group" aria-label="Show">
          {[['all', 'All'], ['active', 'Posted'], ['discount', 'Discount'], ['suspended', 'Suspended'], ['admins', 'Admins']].map(([k, l]) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
        </div>
      </div>
      <p className="hint">{list.length} of {data.length} accounts</p>
      <div className="adm-list">
        {list.map((u) => (
          <article className={'adm-item' + (u.suspended ? ' off' : '')} key={u.user_id}>
            <header><b>{u.display_name || u.email}</b><span className="adm-tags">{u.is_admin && <span className="adm-tag admin">Admin</span>}{u.suspended && <span className="adm-tag warn">Suspended</span>}</span></header>
            {u.display_name && <p className="adm-about">{u.email}</p>}
            <p className="adm-body">{u.passenger ? who(u.passenger) : 'No discount set'}{u.school ? ` · ${u.school}` : ''}{u.id_type ? ` · ${u.id_type}` : ''}</p>
            <div className="aw-counts"><span><b>{u.posts_count ?? 0}</b> posts</span><span><b>{u.reports_made ?? 0}</b> reports filed</span>{u.last_post_at && <span>last post {when(u.last_post_at)}</span>}</div>
            <p className="adm-meta">Joined {when(u.created_at)}{u.last_sign_in_at ? ` · last signed in ${when(u.last_sign_in_at)}` : ' · never signed in'}</p>
            {u.suspended && u.suspend_reason && <p className="adm-meta">Reason: {u.suspend_reason}</p>}
            <div className="adm-actions">
              <button className="btn secondary sm" onClick={() => view(u)}>{open === u.user_id ? 'Hide posts' : 'See posts'}</button>
              {!u.is_admin && (u.suspended
                ? <button className="btn sm ok" onClick={() => act(() => restoreUser(u.user_id), 'Account restored')}>Restore</button>
                : <button className="btn danger sm" onClick={() => { const r = window.prompt('Suspend this account? They can still look around, but cannot post or report. Reason (optional):', ''); if (r !== null) act(() => suspendUser(u.user_id, r), 'Account suspended') }}>Suspend</button>)}
            </div>
            {open === u.user_id && (
              <div className="aw-posts">
                {posts[u.user_id] == null ? <p className="hint">Loading…</p> : posts[u.user_id].length === 0 ? <p className="hint">No posts.</p> : posts[u.user_id].map((p) => (
                  <div key={p.id} className="aw-post"><span>{when(p.created_at)} · {aboutPost(p)}</span><b>{p.kind === 'fare' ? `Paid ₱${p.paid} · ${who(p.passenger)}` : p.body}</b>{(p.status !== 'visible' || p.reports > 0) && <em>{p.status !== 'visible' ? 'Hidden' : ''}{p.reports > 0 ? ` · ${p.reports} reports` : ''}</em>}</div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  )
}

// ---------- Announcements for riders ----------
const BLANK = { title: '', body: '', tone: 'info', lat: null, lon: null, rain_only: false, ends: '' }
export function Notices() {
  const { say } = useApp()
  const [{ data, error }, retry] = useLoad(loadNotices, [])
  const act = useAct(retry)
  const [f, setF] = useState(BLANK)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const post = async (e) => {
    e.preventDefault()
    if (f.title.trim().length < 3) { say('Write a short title.'); return }
    try {
      await saveNotice({ title: f.title.trim(), body: f.body.trim() || null, tone: f.tone, lat: f.lat, lon: f.lon, rain_only: f.rain_only, active: true, ends_at: f.ends ? new Date(f.ends + 'T23:59:00+08:00').toISOString() : null })
      setF(BLANK); say('Posted. Riders see it the next time the app refreshes.'); retry()
    } catch (err) { say(err.message) }
  }
  return (
    <div className="aw-notices">
      <form className="adm-card" onSubmit={post}>
        <h2 className="sec">New announcement</h2>
        <div className="aw-grid2">
          <label className="aw-field"><span>Title</span><input className="boxed input" maxLength="80" value={f.title} onChange={set('title')} placeholder="Muddy road to Balutakay" /></label>
          <label className="aw-field"><span>Kind</span><select className="boxed input" value={f.tone} onChange={set('tone')}><option value="info">Information</option><option value="warn">Caution</option><option value="danger">Danger</option></select></label>
        </div>
        <label className="aw-field"><span>Details</span><textarea className="boxed input" rows="3" maxLength="400" value={f.body} onChange={set('body')} placeholder="What riders should know, and what to do" /></label>
        <div className="aw-grid2">
          <label className="aw-field"><span>Show until (empty: until you stop it)</span><input className="boxed input" type="date" value={f.ends} onChange={set('ends')} /></label>
          <label className="adm-check"><input type="checkbox" checked={f.rain_only} onChange={set('rain_only')} />Only when it rains in Bansalan (for muddy or flooded roads)</label>
        </div>
        <span className="aw-field-label">Place on the map (optional): tap the map to pin it{f.lat != null && <button type="button" className="aw-clear" onClick={() => setF((x) => ({ ...x, lat: null, lon: null }))}>Remove the pin</button>}</span>
        <SpotMap lat={f.lat} lon={f.lon} height={260} onPick={(ll) => setF((x) => ({ ...x, lat: ll[0], lon: ll[1] }))} />
        <div className="adm-actions"><button className="btn ok">Post announcement</button></div>
      </form>
      {error ? <Problem error={error} retry={retry} /> : !data ? <p className="hint">Loading…</p> : (
        <div className="adm-list">
          {data.map((n) => {
            const over = n.ends_at && new Date(n.ends_at) < new Date()
            return (
              <article key={n.id} className={'adm-item notice-row tone-' + n.tone + (!n.active || over ? ' off' : '')}>
                <header><b>{n.title}</b><span>{when(n.created_at)}</span></header>
                {n.body && <p className="adm-body">{n.body}</p>}
                <div className="adm-tags">
                  <span className={'adm-tag ' + (n.active && !over ? '' : 'hidden')}>{!n.active ? 'Stopped' : over ? 'Ended' : 'Showing'}</span>
                  {n.rain_only && <span className="adm-tag warn">Only when it rains</span>}
                  {n.lat != null && <span className="adm-tag">On the map</span>}
                  {n.ends_at && <span className="adm-tag">Until {when(n.ends_at)}</span>}
                </div>
                <div className="adm-actions">
                  <button className="btn secondary sm" onClick={() => act(() => saveNotice({ id: n.id, active: !n.active }), n.active ? 'Stopped' : 'Showing again')}>{n.active ? 'Stop showing' : 'Show again'}</button>
                  <button className="btn danger sm" onClick={() => { if (window.confirm('Delete this announcement?')) act(() => removeNotice(n.id), 'Deleted') }}>Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
