import { useCallback, useEffect, useState } from 'react'
import { BackButton, Icon, YHeader, useApp } from '../components'
import { useAuth } from '../auth'
import { routes, placeById, stationById, shortName, PASSENGERS } from '../data'
import { checkAdmin, loadOverview, loadUsers, loadPosts, setPostStatus, removePost, loadInbox, setInboxStatus, removeInbox, loadWords, addWord, removeWord } from '../admin'

// The admin area: the same signboard look as the rest of the app. Only admins get data; the database checks every call.
const TABS = [['overview', 'Overview'], ['posts', 'Posts'], ['inbox', 'Inbox'], ['users', 'Users'], ['words', 'Words']]
const when = (iso) => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
const who = (id) => PASSENGERS.find((p) => p.id === id)?.short ?? (id === 'regular' ? 'Regular' : id ?? '—')
const routeName = (id) => { const r = routes.find((x) => x.id === id); return r ? `${shortName(r.from)} to ${shortName(r.to)}` : id }
const aboutPost = (p) => (p.route_id ? routeName(p.route_id) : p.place_id ? placeById(p.place_id)?.name ?? p.place_id : stationById(p.station_id)?.name ?? p.station_id)

// a list that loads itself, with a retry and a clear empty state
function useData(load, deps) {
  const [state, setState] = useState({ data: null, error: '' })
  const run = useCallback(() => {
    setState((s) => ({ ...s, error: '' }))
    load().then((data) => setState({ data, error: '' }), (e) => setState({ data: null, error: e.message }))
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run() }, [run])
  return [state, run]
}

function Problem({ error, retry }) {
  const missing = /does not exist|schema cache|not_admin|permission/i.test(error)
  return (
    <div className="adm-empty">
      <b>{missing ? 'The admin database is not set up yet' : 'Could not load this'}</b>
      <span>{missing ? 'Run supabase/admin.sql once in the Supabase SQL editor, then try again.' : error}</span>
      <button className="btn secondary sm" onClick={retry}><Icon name="repeat" />Try again</button>
    </div>
  )
}

function Overview() {
  const [{ data, error }, retry] = useData(loadOverview, [])
  if (error) return <Problem error={error} retry={retry} />
  if (!data) return <p className="hint">Loading…</p>
  const stats = [
    ['Accounts', data.users, `${data.users_week} new this week`],
    ['Inbox', data.inbox, 'reports and spots to check'],
    ['Posts', data.posts, `${data.hidden} hidden · ${data.reported} reported`],
    ['Ride alerts', data.push, 'phones with alerts on'],
  ]
  const discount = Object.entries(data.discount ?? {})
  return (
    <>
      <div className="adm-stats">
        {stats.map(([k, v, sub]) => <div className="adm-stat" key={k}><span>{k}</span><b>{v}</b><em>{sub}</em></div>)}
      </div>
      <section className="adm-card">
        <h2 className="sec">Discount accounts</h2>
        {discount.length ? <div className="adm-chips">{discount.map(([k, n]) => <span key={k}><b>{n}</b>{who(k)}</span>)}</div> : <p className="hint">No discount accounts yet.</p>}
      </section>
      <section className="adm-card">
        <h2 className="sec">Most opened routes · last 30 days</h2>
        {data.top_routes?.length ? <ol className="adm-rank">{data.top_routes.map((r) => <li key={r.ref}><span>{routeName(r.ref)}</span><b>{r.n}</b></li>)}</ol> : <p className="hint">No route opens counted yet.</p>}
      </section>
      <section className="adm-card">
        <h2 className="sec">Searches that found nothing</h2>
        {data.missing?.length ? <ol className="adm-rank">{data.missing.map((r) => <li key={r.ref}><span>“{r.ref}”</span><b>{r.n}</b></li>)}</ol> : <p className="hint">Every search found something.</p>}
      </section>
    </>
  )
}

function Posts() {
  const { say } = useApp()
  const [filter, setFilter] = useState('reported')
  const [{ data, error }, retry] = useData(() => loadPosts(filter), [filter])
  const act = async (fn, msg) => { try { await fn(); say(msg); retry() } catch (e) { say(e.message) } }
  return (
    <>
      <div className="chips" role="group" aria-label="Which posts">
        {[['reported', 'Reported'], ['hidden', 'Hidden'], ['all', 'All']].map(([k, l]) => <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {error ? <Problem error={error} retry={retry} /> : !data ? <p className="hint">Loading…</p> : data.length === 0 ? <p className="adm-empty"><b>Nothing here</b><span>{filter === 'reported' ? 'No post has been reported.' : 'No posts in this list.'}</span></p> : (
        <div className="adm-list">
          {data.map((p) => (
            <article className={'adm-item' + (p.status !== 'visible' ? ' off' : '')} key={p.id}>
              <header><b>{p.author_name}</b><span>{when(p.created_at)}</span></header>
              <p className="adm-about">{aboutPost(p)}</p>
              <p className="adm-body">{p.kind === 'fare' ? `Paid ₱${p.paid} · ${who(p.passenger)}` : p.body}</p>
              <div className="adm-tags">
                <span className={'adm-tag ' + p.status}>{p.status === 'visible' ? 'Showing' : 'Hidden'}</span>
                {p.reports > 0 && <span className="adm-tag warn">{p.reports} {p.reports === 1 ? 'report' : 'reports'}</span>}
              </div>
              <div className="adm-actions">
                {p.status === 'visible'
                  ? <button className="btn secondary sm" onClick={() => act(() => setPostStatus(p.id, 'hidden'), 'Post hidden')}>Hide</button>
                  : <button className="btn secondary sm" onClick={() => act(() => setPostStatus(p.id, 'visible'), 'Post shown again')}>Show again</button>}
                <button className="btn danger sm" onClick={() => { if (window.confirm('Delete this post for good?')) act(() => removePost(p.id), 'Post deleted') }}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function Inbox() {
  const { say } = useApp()
  const [status, setStatus] = useState('new')
  const [{ data, error }, retry] = useData(() => loadInbox(status), [status])
  const act = async (fn, msg) => { try { await fn(); say(msg); retry() } catch (e) { say(e.message) } }
  return (
    <>
      <div className="chips" role="group" aria-label="Which messages">
        {[['new', 'New'], ['done', 'Done'], ['dismissed', 'Dismissed']].map(([k, l]) => <button key={k} className="chip" aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>)}
      </div>
      {error ? <Problem error={error} retry={retry} /> : !data ? <p className="hint">Loading…</p> : data.length === 0 ? <p className="adm-empty"><b>Inbox is clear</b><span>Problem reports and new waiting spots from riders show up here.</span></p> : (
        <div className="adm-list">
          {data.map((m) => (
            <article className="adm-item" key={m.id}>
              <header><b>{m.kind === 'spot' ? 'New waiting spot' : m.topic || 'Problem report'}</b><span>{when(m.created_at)}</span></header>
              {m.about && <p className="adm-about">{m.about}</p>}
              {m.body && <p className="adm-body">{m.body}</p>}
              {m.lat != null && <a className="adm-link" href={`https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lon}#map=19/${m.lat}/${m.lon}`} target="_blank" rel="noreferrer"><Icon name="pin" />{m.lat.toFixed(5)}, {m.lon.toFixed(5)}</a>}
              <div className="adm-actions">
                {status !== 'done' && <button className="btn sm" onClick={() => act(() => setInboxStatus(m.id, 'done'), 'Marked as done')}>Mark done</button>}
                {status === 'new' && <button className="btn secondary sm" onClick={() => act(() => setInboxStatus(m.id, 'dismissed'), 'Dismissed')}>Dismiss</button>}
                {status !== 'new' && <button className="btn secondary sm" onClick={() => act(() => setInboxStatus(m.id, 'new'), 'Moved back to new')}>Back to new</button>}
                <button className="btn danger sm" onClick={() => { if (window.confirm('Delete this message for good?')) act(() => removeInbox(m.id), 'Deleted') }}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function Users() {
  const [{ data, error }, retry] = useData(loadUsers, [])
  if (error) return <Problem error={error} retry={retry} />
  if (!data) return <p className="hint">Loading…</p>
  return (
    <div className="adm-list">
      {data.map((u) => (
        <article className="adm-item" key={u.user_id}>
          <header><b>{u.display_name || u.email}</b>{u.is_admin && <span className="adm-tag admin">Admin</span>}</header>
          {u.display_name && <p className="adm-about">{u.email}</p>}
          <p className="adm-body">{u.passenger ? who(u.passenger) : 'No discount set'}{u.school ? ` · ${u.school}` : ''}{u.id_type ? ` · ${u.id_type}` : ''}</p>
          <p className="adm-meta">Joined {when(u.created_at)}{u.last_sign_in_at ? ` · last in ${when(u.last_sign_in_at)}` : ''}</p>
        </article>
      ))}
    </div>
  )
}

function Words() {
  const { say } = useApp()
  const [{ data, error }, retry] = useData(loadWords, [])
  const [word, setWord] = useState('')
  const [whole, setWhole] = useState(true)
  const add = async (e) => {
    e.preventDefault()
    if (word.trim().length < 2) { say('Type a word first.'); return }
    try { await addWord(word, whole); setWord(''); say('Word added'); retry() } catch (err) { say(/duplicate/i.test(err.message) ? 'That word is already blocked.' : err.message) }
  }
  if (error) return <Problem error={error} retry={retry} />
  return (
    <>
      <form className="adm-card adm-add" onSubmit={add}>
        <label className="lbl" htmlFor="adm-w">Block a word in names and comments</label>
        <div className="adm-add-row">
          <input id="adm-w" className="boxed input" maxLength="30" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Word to block" autoComplete="off" />
          <button className="btn sm">Add</button>
        </div>
        <label className="adm-check"><input type="checkbox" checked={whole} onChange={(e) => setWhole(e.target.checked)} />Only as a whole word (so “class” is not caught by “ass”)</label>
      </form>
      {!data ? <p className="hint">Loading…</p> : (
        <div className="adm-words">
          {data.map((w) => (
            <span key={w.word} className="adm-word">{w.word}{!w.whole && <em>inside words</em>}
              <button aria-label={`Remove ${w.word}`} onClick={async () => { try { await removeWord(w.word); retry() } catch (e) { say(e.message) } }}><Icon name="close" /></button>
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export default function Admin() {
  const { go } = useApp()
  const { user, configured, ready } = useAuth()
  const [tab, setTab] = useState('overview')
  const [allowed, setAllowed] = useState(null) // null = checking
  useEffect(() => { if (!ready) return; checkAdmin().then((yes) => setAllowed(yes && (!!user || import.meta.env.DEV))) }, [user, ready])

  const Body = { overview: Overview, posts: Posts, inbox: Inbox, users: Users, words: Words }[tab]
  return (
    <>
      <YHeader title="Admin" back={<BackButton to="menu" />}>
        {allowed && (
          <div className="seg adm-tabs" role="tablist" aria-label="Admin sections">
            {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
          </div>
        )}
      </YHeader>
      <div className="body adm">
        {allowed === null ? <p className="hint">Checking your account…</p> : !allowed ? (
          <div className="adm-empty">
            <b>Admins only</b>
            <span>{!configured ? 'Accounts are not switched on in this copy of the app.' : !user ? 'Sign in with an admin account to manage BansaRide.' : 'This account is not an admin. Ask the app owner to add you.'}</span>
            {configured && !user && <button className="btn sm" onClick={() => go('account')}><Icon name="drivers" />Sign in</button>}
          </div>
        ) : <Body />}
      </div>
    </>
  )
}
