import { useEffect, useMemo, useState } from 'react'
import { Icon, useApp } from '../components'
import MapView from '../MapView'
import { stations, stationPlace, towns, fareSettings, applyFareSettings, fareFor, transitFare, PASSENGERS } from '../data'
import {
  loadInbox, setInboxStatus, removeInbox, approveSpot, loadApprovedSpots, loadStandEdits, saveStandEdit, loadFares, saveFares,
  loadUsers, suspendUser, restoreUser, loadUserPosts, loadNotices, saveNotice, removeNotice,
} from '../admin'
import { Problem, Empty, Loading, when, who, aboutPost } from './sections'

// Inbox, BTODA groups, fares, accounts and announcements for the admin website.
const CENTER = [6.7869, 125.2105]

function useLoad(load, deps) {
  const [s, set] = useState({ data: null, error: '' })
  const [n, setN] = useState(0)
  useEffect(() => { let on = true; set((x) => ({ ...x, error: '' })); load().then((data) => on && set({ data, error: '' }), (e) => on && set({ data: null, error: e.message })); return () => { on = false } }, [...deps, n]) // eslint-disable-line react-hooks/exhaustive-deps
  return [s, () => setN((x) => x + 1)]
}
function useAct(after) {
  const { say } = useApp()
  return async (fn, msg) => { try { await fn(); if (msg) say(msg); after?.() } catch (e) { say(/suspended/.test(e.message) ? 'That account is suspended.' : e.message) } }
}

export function SpotMap({ lat, lon, onPick, height = 220 }) {
  const markers = useMemo(() => (lat != null ? [{ id: 'x', lat, lon, kind: 'spot', label: '', title: 'Here' }] : []), [lat, lon])
  const center = useMemo(() => (lat != null ? [lat, lon] : CENTER), [lat, lon])
  return (
    <div className="awx-map" style={{ height }}>
      <MapView markers={markers} center={center} zoom={17} fit={false} focus={lat != null ? center : null} onMapClick={onPick} draft={onPick && lat != null ? [lat, lon] : null} label="Map of the place" />
    </div>
  )
}

// a panel that slides in from the right, for editing one thing
function Drawer({ title, sub, onClose, children }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="awx-drawer-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <button className="awx-scrim" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <aside className="awx-drawer">
        <header><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div><button className="awb icon" aria-label="Close" onClick={onClose}><Icon name="close" /></button></header>
        <div className="awx-drawer-body">{children}</div>
      </aside>
    </div>
  )
}

const Tabs = ({ value, set, items }) => (
  <div className="awx-tabs" role="tablist">{items.map(([k, l, n]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => set(k)}>{l}{n ? <i>{n}</i> : null}</button>)}</div>
)

// ---------- Inbox: a list on the left, the picked message on the right ----------
export function Inbox() {
  const [status, setStatus] = useState('new')
  const [{ data, error }, retry] = useLoad(() => loadInbox(status), [status])
  const [pick, setPick] = useState(null)
  const [name, setName] = useState('')
  const act = useAct(() => { setPick(null); retry() })
  const cur = data?.find((m) => m.id === pick) ?? data?.[0]
  useEffect(() => { if (cur?.kind === 'spot') setName(cur.name || (cur.about ? cur.about.replace(/^near /, '').split(' · ')[0] + ' waiting spot' : 'Waiting spot')) }, [cur?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Tabs value={status} set={(k) => { setStatus(k); setPick(null) }} items={[['new', 'New', status === 'new' ? data?.length : 0], ['approved', 'On the map'], ['done', 'Done'], ['dismissed', 'Dismissed']]} />
      {error ? <Problem error={error} retry={retry} /> : !data ? <Loading /> : data.length === 0 ? (
        <Empty title={status === 'new' ? 'Inbox is clear' : 'Nothing here'}>{status === 'new' ? 'Problem reports and spots riders mark on the map arrive here.' : 'Items you move here are listed in this tab.'}</Empty>
      ) : (
        <div className="awx-mail">
          <ul className="awx-mail-list">
            {data.map((m) => (
              <li key={m.id}><button aria-current={cur?.id === m.id ? 'true' : undefined} onClick={() => setPick(m.id)}>
                <i className={'awx-dot ' + (m.kind === 'spot' ? 'spot' : 'problem')} />
                <span><b>{m.kind === 'spot' ? (m.name || 'Marked waiting spot') : m.topic || 'Problem report'}</b><em>{m.about || m.body}</em></span>
                <time>{when(m.created_at)}</time>
              </button></li>
            ))}
          </ul>
          {cur && (
            <article className="awx-mail-view">
              <p className="awx-kicker">{cur.kind === 'spot' ? 'Waiting spot marked by a rider' : cur.topic || 'Problem report'} · {when(cur.created_at)}</p>
              <h2>{cur.kind === 'spot' ? (status === 'approved' ? cur.name : 'Approve this spot?') : cur.about || 'Problem report'}</h2>
              {cur.kind === 'spot' && cur.about && <p className="awx-muted">{cur.about}</p>}
              {cur.body && <p className="awx-quote">{cur.body}</p>}
              {cur.lat != null && <SpotMap lat={cur.lat} lon={cur.lon} height={260} />}
              {cur.kind === 'spot' && status === 'new' && <label className="awx-field"><span>Name riders will see</span><input maxLength="60" value={name} onChange={(e) => setName(e.target.value)} /></label>}
              <div className="awx-actions">
                {cur.kind === 'spot' && status === 'new' && <button className="awb go" onClick={() => act(() => approveSpot(cur.id, name || 'Waiting spot'), 'Approved. It shows on the map for everyone.')}><Icon name="check" />Approve and show on map</button>}
                {cur.kind === 'spot' && status === 'approved' && <button className="awb ghost" onClick={() => act(() => setInboxStatus(cur.id, 'dismissed'), 'Taken off the map')}>Take off the map</button>}
                {cur.kind !== 'spot' && status !== 'done' && <button className="awb go" onClick={() => act(() => setInboxStatus(cur.id, 'done'), 'Marked as done')}><Icon name="check" />Mark done</button>}
                {status === 'new' && <button className="awb ghost" onClick={() => act(() => setInboxStatus(cur.id, 'dismissed'), cur.kind === 'spot' ? 'Spot rejected' : 'Dismissed')}>{cur.kind === 'spot' ? 'Reject' : 'Dismiss'}</button>}
                {(status === 'done' || status === 'dismissed') && <button className="awb ghost" onClick={() => act(() => setInboxStatus(cur.id, 'new'), 'Moved back to new')}>Back to new</button>}
                <span className="grow" />
                <button className="awb danger" onClick={() => { if (window.confirm('Delete this for good?')) act(() => removeInbox(cur.id), 'Deleted') }}>Delete</button>
              </div>
            </article>
          )}
        </div>
      )}
    </>
  )
}

// ---------- BTODA groups and members ----------
function GroupForm({ s, edit, onSaved }) {
  const { say } = useApp()
  const [f, setF] = useState(() => ({
    name: edit?.name ?? s.name, landmark: edit?.landmark ?? s.landmark ?? '', contact_name: edit?.contact_name ?? s.contact?.name ?? '', contact_phone: edit?.contact_phone ?? s.contact?.phone ?? '',
    verified: edit?.verified ?? !!s.verified, suspended: !!edit?.suspended, suspend_note: edit?.suspend_note ?? '', members: edit?.members ?? (s.members ?? []).map((n) => ({ name: n, suspended: false })),
  }))
  const [newMember, setNewMember] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const p = stationPlace(s)
  const save = async () => {
    const phone = f.contact_phone.replace(/\D/g, '')
    if (phone && !/^09\d{9}$/.test(phone)) { say('The number must look like 09171234567.'); return }
    if ((f.contact_name.trim() && !phone) || (!f.contact_name.trim() && phone)) { say('Add both the contact name and the number, or neither.'); return }
    try {
      await saveStandEdit({ station_id: s.id, name: f.name.trim() || s.name, landmark: f.landmark.trim() || null, contact_name: f.contact_name.trim() || null, contact_phone: phone || null, verified: f.verified, suspended: f.suspended, suspend_note: f.suspend_note.trim() || null, members: f.members })
      say(f.suspended ? 'Saved. The group is hidden from riders.' : 'Saved. Riders see it on their next refresh.')
      onSaved()
    } catch (e) { say(e.message) }
  }
  return (
    <div className="awx-form">
      {p && <SpotMap lat={p.lat} lon={p.lon} height={170} />}
      <h3>Details</h3>
      <label className="awx-field"><span>Name</span><input maxLength="60" value={f.name} onChange={set('name')} /></label>
      <label className="awx-field"><span>Where they wait</span><input maxLength="120" value={f.landmark} onChange={set('landmark')} placeholder="Beside the church, in front of 7-Eleven…" /></label>
      <label className="awx-check"><input type="checkbox" checked={f.verified} onChange={set('verified')} />Verified by BTODA (green badge)</label>
      <h3>Contact for the Call button</h3>
      <div className="awx-row2">
        <label className="awx-field"><span>Person</span><input maxLength="40" value={f.contact_name} onChange={set('contact_name')} placeholder="President or a driver" /></label>
        <label className="awx-field"><span>Number</span><input inputMode="tel" maxLength="13" value={f.contact_phone} onChange={set('contact_phone')} placeholder="09171234567" /></label>
      </div>
      <p className="awx-muted small">Everyone sees this number. Only add it with the person's permission.</p>
      <h3>Members · {f.members.length}</h3>
      <ul className="awx-members">
        {f.members.map((m, i) => (
          <li key={m.name + i} className={m.suspended ? 'off' : ''}>
            <span>{m.name}</span>{m.suspended && <em>Suspended</em>}
            <button className="awb ghost sm" onClick={() => setF((x) => ({ ...x, members: x.members.map((y, j) => (j === i ? { ...y, suspended: !y.suspended } : y)) }))}>{m.suspended ? 'Restore' : 'Suspend'}</button>
            <button className="awb icon sm" aria-label={`Remove ${m.name}`} onClick={() => setF((x) => ({ ...x, members: x.members.filter((_, j) => j !== i) }))}><Icon name="close" /></button>
          </li>
        ))}
      </ul>
      <form className="awx-inline" onSubmit={(e) => { e.preventDefault(); const n = newMember.trim(); if (n.length < 2) return; setF((x) => ({ ...x, members: [...x.members, { name: n, suspended: false }] })); setNewMember('') }}>
        <label className="awx-field grow"><span className="sr-only">Member name</span><input maxLength="40" value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="Add a member's name" /></label>
        <button className="awb ghost">Add member</button>
      </form>
      <div className={'awx-danger-zone' + (f.suspended ? ' on' : '')}>
        <label className="awx-check"><input type="checkbox" checked={f.suspended} onChange={set('suspended')} /><b>Suspend this group</b></label>
        <p className="awx-muted small">A suspended group is hidden from riders until you restore it.</p>
        {f.suspended && <label className="awx-field"><span>Reason (only admins see it)</span><input maxLength="120" value={f.suspend_note} onChange={set('suspend_note')} /></label>}
      </div>
      <div className="awx-drawer-foot"><button className="awb go" onClick={save}><Icon name="check" />Save changes</button></div>
    </div>
  )
}

export function Groups() {
  const [{ data, error }, retry] = useLoad(async () => ({ edits: await loadStandEdits(), spots: await loadApprovedSpots().catch(() => []) }), [])
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [open, setOpen] = useState(null)
  if (error) return <Problem error={error} retry={retry} />
  if (!data) return <Loading />
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
  const cur = all.find((s) => s.id === open)
  return (
    <>
      <div className="awx-toolbar">
        <label className="awx-search"><Icon name="search" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups and spots" /></label>
        <Tabs value={kind} set={setKind} items={[['all', 'All'], ['groups', 'BTODA groups'], ['spots', 'Street spots'], ['contact', 'With contact'], ['suspended', 'Suspended']]} />
        <span className="awx-count">{list.length} of {all.length}</span>
      </div>
      <div className="awx-table-wrap">
        <table className="awx-table">
          <thead><tr><th>Name</th><th>Where</th><th>Members</th><th>Contact</th><th>Status</th><th aria-label="Edit" /></tr></thead>
          <tbody>
            {list.map((s) => {
              const e = edits[s.id], p = stationPlace(s)
              const members = e?.members?.length ?? s.members?.length ?? 0
              return (
                <tr key={s.id} className={e?.suspended ? 'off' : ''} onClick={() => setOpen(s.id)}>
                  <td className="wide"><b>{e?.name ?? s.name}</b>{s.type === 'motor' && <span className="awx-pill">Motorcycles</span>}{s.riderSpot && <span className="awx-pill">From a rider</span>}</td>
                  <td>{p?.name ?? '—'}</td>
                  <td>{members || '—'}</td>
                  <td>{e?.contact_name ?? s.contact?.name ?? '—'}</td>
                  <td>{e?.suspended ? <span className="awx-pill bad">Suspended</span> : (e?.verified ?? s.verified) ? <span className="awx-pill ok">Verified</span> : <span className="awx-pill mute">Listed</span>}</td>
                  <td className="actions"><button className="awb ghost sm" onClick={(ev) => { ev.stopPropagation(); setOpen(s.id) }}>Edit</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {cur && <Drawer title={edits[cur.id]?.name ?? cur.name} sub={stationPlace(cur)?.name} onClose={() => setOpen(null)}><GroupForm key={cur.id} s={cur} edit={edits[cur.id]} onSaved={() => { setOpen(null); retry() }} /></Drawer>}
    </>
  )
}

// ---------- Fares ----------
export function Fares() {
  const { say } = useApp()
  const [{ data, error }, retry] = useLoad(loadFares, [])
  const builtIn = useMemo(() => fareSettings(), [])
  const [f, setF] = useState(null)
  const [dirty, setDirty] = useState(false)
  useEffect(() => { if (!error && data !== undefined) { setF(JSON.parse(JSON.stringify({ ...builtIn, ...(data || {}) }))); setDirty(false) } }, [data, error, builtIn])
  if (error) return <Problem error={error} retry={retry} />
  if (!f) return <Loading />
  const num = (path) => (e) => { const v = e.target.value; setDirty(true); setF((x) => { const y = JSON.parse(JSON.stringify(x)); let o = y; for (const k of path.slice(0, -1)) o = o[k] ??= {}; o[path.at(-1)] = v === '' ? '' : Number(v); return y }) }
  applyFareSettings(f) // preview with the values on screen, then put the saved ones back
  const sample = [[0.5, 'Under 1 km'], [3.7, 'Rizal · 3.7 km'], [10, '10 km'], [15, '15 km']].map(([km, l]) => [l, fareFor(km, 'elementary'), fareFor(km, 'senior'), fareFor(km, 'adult')])
  const davao = transitFare('bus', 73.2, 'davao')
  applyFareSettings(data || builtIn)
  const save = async () => { try { await saveFares(f); say('Fares saved. Riders get them on their next refresh.'); retry() } catch (e) { say(e.message) } }
  return (
    <div className="awx-fares">
      <div className="awx-two fares">
        <section className="awx-panel">
          <h2 className="awx-h">Tricycle and pedicab</h2>
          <p className="awx-muted small">Base fare for the first km, plus the same amount for each km after, rounded to ₱5.</p>
          <div className="awx-grid">
            {PASSENGERS.map((p) => <label key={p.id} className="awx-field money"><span>{p.label}</span><input type="number" min="5" max="200" value={f.base[p.id]} onChange={num(['base', p.id])} /></label>)}
          </div>
          <div className="awx-grid">
            <label className="awx-field money"><span>Each km after the first</span><input type="number" step="0.1" min="0" max="100" value={f.perKm} onChange={num(['perKm'])} /></label>
            <label className="awx-field money"><span>Under {Math.round((f.near.km || 0) * 1000)} m (everyone)</span><input type="number" min="0" max="200" value={f.near.fare} onChange={num(['near', 'fare'])} /></label>
            <label className="awx-field money"><span>Up to {f.short.km} km (everyone)</span><input type="number" min="0" max="200" value={f.short.fare} onChange={num(['short', 'fare'])} /></label>
          </div>
        </section>
        <section className="awx-panel preview">
          <h2 className="awx-h">What riders will pay</h2>
          <table className="awx-mini"><thead><tr><th /><th>Elementary</th><th>Senior</th><th>Adult</th></tr></thead>
            <tbody>{sample.map(([l, a, b, c]) => <tr key={l}><th>{l}</th><td>₱{a}</td><td>₱{b}</td><td>₱{c}</td></tr>)}</tbody></table>
          <p className="awx-muted small">Big bus to Davao: adult ₱{davao.adult}, student ₱{davao.student}.</p>
        </section>
      </div>
      <section className="awx-panel">
        <div className="awx-panel-head">
          <h2 className="awx-h">Bus, van and mini bus · adult fare by town</h2>
          <label className="awx-field pct"><span>Students, seniors and PWD pay (% of adult)</span><input type="number" min="30" max="100" value={Math.round(f.discount * 100)} onChange={(e) => { setDirty(true); setF((x) => ({ ...x, discount: Number(e.target.value) / 100 })) }} /></label>
        </div>
        <div className="awx-table-wrap flat">
          <table className="awx-table towns"><thead><tr><th>Town</th><th>Km</th><th>Big bus</th><th>Van</th><th>Mini bus</th></tr></thead>
            <tbody>{towns.map((t) => (
              <tr key={t.id}><td><b>{t.name}</b></td><td>{t.km}</td>
                {['bus', 'van', 'mini'].map((m) => <td key={m}><label className="awx-field money tight"><span className="sr-only">{t.name} {m}</span><input type="number" min="0" max="5000" value={f.towns?.[t.id]?.[m] ?? ''} placeholder="by km" onChange={num(['towns', t.id, m])} /></label></td>)}
              </tr>
            ))}</tbody></table>
        </div>
      </section>
      <div className={'awx-savebar' + (dirty ? ' show' : '')}>
        <span>{dirty ? 'You have unsaved changes' : 'Fares are saved'}</span>
        <button className="awb ghost" onClick={() => { if (window.confirm('Go back to the fares written in the app?')) { setF(JSON.parse(JSON.stringify(builtIn))); setDirty(true) } }}>Reset to the app's fares</button>
        <button className="awb go" disabled={!dirty} onClick={save}><Icon name="check" />Save fares</button>
      </div>
    </div>
  )
}

// ---------- Accounts ----------
function UserDetail({ u, onChanged }) {
  const [posts, setPosts] = useState(null)
  const act = useAct(onChanged)
  useEffect(() => { loadUserPosts(u.user_id).then(setPosts, () => setPosts([])) }, [u.user_id])
  return (
    <div className="awx-form">
      <dl className="awx-facts">
        <div><dt>Email</dt><dd>{u.email}</dd></div>
        <div><dt>Discount</dt><dd>{u.passenger ? who(u.passenger) : 'None'}{u.school ? ` · ${u.school}` : ''}{u.id_type ? ` · ${u.id_type}` : ''}</dd></div>
        <div><dt>Joined</dt><dd>{when(u.created_at)}</dd></div>
        <div><dt>Last signed in</dt><dd>{u.last_sign_in_at ? when(u.last_sign_in_at) : 'Never'}</dd></div>
        <div><dt>Posts</dt><dd>{u.posts_count ?? 0}</dd></div>
        <div><dt>Reports filed</dt><dd>{u.reports_made ?? 0}</dd></div>
      </dl>
      <h3>Posts</h3>
      {posts == null ? <Loading /> : posts.length === 0 ? <p className="awx-muted">No posts yet.</p> : (
        <ul className="awx-feed">{posts.map((p) => <li key={p.id}><time>{when(p.created_at)} · {aboutPost(p)}</time><b>{p.kind === 'fare' ? `Paid ₱${p.paid} · ${who(p.passenger)}` : p.body}</b>{(p.status !== 'visible' || p.reports > 0) && <em>{p.status !== 'visible' ? 'Hidden' : ''}{p.reports > 0 ? ` ${p.reports} reports` : ''}</em>}</li>)}</ul>
      )}
      {!u.is_admin && (
        <div className={'awx-danger-zone' + (u.suspended ? ' on' : '')}>
          <b>{u.suspended ? 'This account is suspended' : 'Suspend this account'}</b>
          <p className="awx-muted small">{u.suspended ? `Reason: ${u.suspend_reason || 'none given'}.` : 'They can still look around, but cannot post fares, comments or reports.'}</p>
          {u.suspended
            ? <button className="awb go" onClick={() => act(() => restoreUser(u.user_id), 'Account restored')}>Restore account</button>
            : <button className="awb danger" onClick={() => { const r = window.prompt('Reason for suspending (optional):', ''); if (r !== null) act(() => suspendUser(u.user_id, r), 'Account suspended') }}>Suspend account</button>}
        </div>
      )}
    </div>
  )
}

export function Users() {
  const [{ data, error }, retry] = useLoad(loadUsers, [])
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [open, setOpen] = useState(null)
  if (error) return <Problem error={error} retry={retry} />
  if (!data) return <Loading />
  const term = q.trim().toLowerCase()
  const list = data.filter((u) => (kind === 'suspended' ? u.suspended : kind === 'admins' ? u.is_admin : kind === 'discount' ? u.passenger && u.passenger !== 'regular' : kind === 'active' ? Number(u.posts_count) > 0 : true)
    && (!term || (u.email ?? '').toLowerCase().includes(term) || (u.display_name ?? '').toLowerCase().includes(term)))
  const cur = data.find((u) => u.user_id === open)
  return (
    <>
      <div className="awx-toolbar">
        <label className="awx-search"><Icon name="search" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or name" /></label>
        <Tabs value={kind} set={setKind} items={[['all', 'All'], ['active', 'Posted'], ['discount', 'Discount'], ['suspended', 'Suspended'], ['admins', 'Admins']]} />
        <span className="awx-count">{list.length} of {data.length}</span>
      </div>
      <div className="awx-table-wrap">
        <table className="awx-table">
          <thead><tr><th>Account</th><th>Discount</th><th>Posts</th><th>Reports filed</th><th>Last signed in</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.user_id} className={u.suspended ? 'off' : ''} onClick={() => setOpen(u.user_id)}>
                <td className="wide"><span className="awx-avatar">{(u.display_name || u.email || '?').slice(0, 1).toUpperCase()}</span><span className="awx-who"><b>{u.display_name || u.email}</b>{u.display_name && <em>{u.email}</em>}</span></td>
                <td>{u.passenger ? who(u.passenger) : '—'}</td>
                <td>{u.posts_count ?? 0}</td>
                <td>{u.reports_made ?? 0}</td>
                <td className="nowrap">{u.last_sign_in_at ? when(u.last_sign_in_at) : 'Never'}</td>
                <td>{u.is_admin && <span className="awx-pill go">Admin</span>}{u.suspended ? <span className="awx-pill bad">Suspended</span> : !u.is_admin && <span className="awx-pill ok">Active</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cur && <Drawer title={cur.display_name || cur.email} sub={cur.is_admin ? 'Admin account' : 'Rider account'} onClose={() => setOpen(null)}><UserDetail key={cur.user_id} u={cur} onChanged={() => { setOpen(null); retry() }} /></Drawer>}
    </>
  )
}

// ---------- Announcements ----------
const BLANK = { title: '', body: '', tone: 'info', lat: null, lon: null, rain_only: false, ends: '' }
const TONE = { info: 'Information', warn: 'Caution', danger: 'Danger' }
export function Notices() {
  const { say } = useApp()
  const [{ data, error }, retry] = useLoad(loadNotices, [])
  const act = useAct(retry)
  const [f, setF] = useState(BLANK)
  const [writing, setWriting] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const post = async (e) => {
    e.preventDefault()
    if (f.title.trim().length < 3) { say('Write a short title.'); return }
    try {
      await saveNotice({ title: f.title.trim(), body: f.body.trim() || null, tone: f.tone, lat: f.lat, lon: f.lon, rain_only: f.rain_only, active: true, ends_at: f.ends ? new Date(f.ends + 'T23:59:00+08:00').toISOString() : null })
      setF(BLANK); setWriting(false); say('Posted. Riders see it on their next refresh.'); retry()
    } catch (err) { say(err.message) }
  }
  return (
    <>
      <div className="awx-toolbar"><span className="grow" /><button className="awb go" onClick={() => setWriting(true)}><Icon name="plus" />New announcement</button></div>
      {error ? <Problem error={error} retry={retry} /> : !data ? <Loading /> : data.length === 0 ? <Empty title="No announcements yet">Post one to tell riders about closed roads, muddy roads, fiestas or fare changes.</Empty> : (
        <div className="awx-notices">
          {data.map((n) => {
            const over = n.ends_at && new Date(n.ends_at) < new Date()
            const live = n.active && !over
            return (
              <article key={n.id} className={'awx-notice tone-' + n.tone + (live ? '' : ' off')}>
                <div className="awx-notice-main">
                  <p className="awx-kicker">{TONE[n.tone]} · posted {when(n.created_at)}</p>
                  <h3>{n.title}</h3>
                  {n.body && <p>{n.body}</p>}
                  <div className="awx-pills">
                    <span className={'awx-pill ' + (live ? 'ok' : 'mute')}>{!n.active ? 'Stopped' : over ? 'Ended' : 'Showing to riders'}</span>
                    {n.rain_only && <span className="awx-pill warn">Only when it rains</span>}
                    {n.lat != null && <span className="awx-pill">Pinned on the map</span>}
                    {n.ends_at && <span className="awx-pill">Until {when(n.ends_at)}</span>}
                  </div>
                </div>
                <div className="awx-actions col">
                  <button className="awb ghost" onClick={() => act(() => saveNotice({ id: n.id, active: !n.active }), n.active ? 'Stopped' : 'Showing again')}>{n.active ? 'Stop showing' : 'Show again'}</button>
                  <button className="awb danger" onClick={() => { if (window.confirm('Delete this announcement?')) act(() => removeNotice(n.id), 'Deleted') }}>Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {writing && (
        <Drawer title="New announcement" sub="Riders see it on Home and as a banner on the map" onClose={() => setWriting(false)}>
          <form className="awx-form" onSubmit={post}>
            <label className="awx-field"><span>Title</span><input maxLength="80" value={f.title} onChange={set('title')} placeholder="Muddy road to Balutakay" autoFocus /></label>
            <label className="awx-field"><span>Details</span><textarea rows="3" maxLength="400" value={f.body} onChange={set('body')} placeholder="What riders should know, and what to do" /></label>
            <div className="awx-tone" role="radiogroup" aria-label="Kind">
              {Object.entries(TONE).map(([k, l]) => <label key={k} className={'tone-' + k}><input type="radio" name="tone" value={k} checked={f.tone === k} onChange={set('tone')} />{l}</label>)}
            </div>
            <div className="awx-row2">
              <label className="awx-field"><span>Show until</span><input type="date" value={f.ends} onChange={set('ends')} /></label>
              <label className="awx-check"><input type="checkbox" checked={f.rain_only} onChange={set('rain_only')} />Only when it rains in Bansalan</label>
            </div>
            <span className="awx-label">Pin it on the map (optional): tap the map{f.lat != null && <button type="button" className="awx-link" onClick={() => setF((x) => ({ ...x, lat: null, lon: null }))}>Remove pin</button>}</span>
            <SpotMap lat={f.lat} lon={f.lon} height={240} onPick={(ll) => setF((x) => ({ ...x, lat: ll[0], lon: ll[1] }))} />
            <div className="awx-drawer-foot"><button className="awb go"><Icon name="check" />Post announcement</button></div>
          </form>
        </Drawer>
      )}
    </>
  )
}
