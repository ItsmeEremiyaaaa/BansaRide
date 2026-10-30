import { useCallback, useEffect, useState } from 'react'
import { Icon, useApp } from '../components'
import { routes, placeById, stationById, shortName, PASSENGERS } from '../data'
import { loadOverview, loadPosts, setPostStatus, removePost, loadWords, addWord, removeWord, loadInbox } from '../admin'

// Sections of the BansaRide admin website (admin/index.html). Only admins get data: the database checks every call.
export const when = (iso) => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
export const who = (id) => PASSENGERS.find((p) => p.id === id)?.short ?? (id === 'regular' ? 'Regular' : id ?? '—')
export const routeName = (id) => { const r = routes.find((x) => x.id === id); return r ? `${shortName(r.from)} to ${shortName(r.to)}` : id }
export const aboutPost = (p) => (p.route_id ? routeName(p.route_id) : p.place_id ? placeById(p.place_id)?.name ?? p.place_id : stationById(p.station_id)?.name ?? p.station_id)

// a list that loads itself, with a retry
export function useData(load, deps) {
  const [state, setState] = useState({ data: null, error: '' })
  const run = useCallback(() => {
    setState((s) => ({ ...s, error: '' }))
    load().then((data) => setState({ data, error: '' }), (e) => setState({ data: null, error: e.message }))
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run() }, [run])
  return [state, run]
}

export function Problem({ error, retry }) {
  const missing = /does not exist|schema cache|not_admin|permission|function/i.test(error)
  return (
    <div className="awx-empty">
      <b>{missing ? 'This part of the database is not set up yet' : 'Could not load this'}</b>
      <span>{missing ? 'Run supabase/admin.sql and supabase/manage.sql once in the Supabase SQL editor, then try again.' : error}</span>
      <button className="awb ghost" onClick={retry}><Icon name="repeat" />Try again</button>
    </div>
  )
}
export const Empty = ({ title, children }) => <div className="awx-empty"><b>{title}</b>{children && <span>{children}</span>}</div>
export const Loading = () => <div className="awx-loading" aria-label="Loading"><i /><i /><i /></div>

export function Overview() {
  const [{ data, error }, retry] = useData(async () => {
    const o = await loadOverview()
    const spots = await loadInbox('new').then((l) => l.filter((m) => m.kind === 'spot').length, () => 0)
    return { ...o, spots }
  }, [])
  if (error) return <Problem error={error} retry={retry} />
  if (!data) return <Loading />
  const problems = Math.max(0, (data.inbox ?? 0) - data.spots)
  const attention = [
    ['map', 'Spots to approve', data.spots, 'Marked by riders, not on the map yet'],
    ['inbox', 'Problem reports', problems, 'Wrong fares, places, times or numbers'],
    ['posts', 'Reported posts', data.reported, 'Riders flagged these for you to check'],
  ]
  const stats = [
    ['Accounts', data.users, `+${data.users_week} this week`],
    ['Route opens', data.opens_week, 'in the last 7 days'],
    ['Posts', data.posts, `${data.hidden} hidden`],
    ['Ride alerts on', data.push, 'phones'],
  ]
  const discount = Object.entries(data.discount ?? {})
  const total = discount.reduce((t, [, n]) => t + n, 0) || 1
  return (
    <div className="awx-overview">
      <section>
        <h2 className="awx-h">Needs your attention</h2>
        <div className="awx-attn">
          {attention.map(([to, label, n, note]) => (
            <a key={to + label} href={'#/' + to} className={'awx-attn-card' + (n ? ' hot' : '')}>
              <b>{n}</b><span>{label}</span><em>{n ? note : 'All clear'}</em><Icon name="chevron" />
            </a>
          ))}
        </div>
      </section>
      <section className="awx-stats">
        {stats.map(([k, v, sub]) => <div key={k}><span>{k}</span><b>{v}</b><em>{sub}</em></div>)}
      </section>
      <div className="awx-two">
        <section className="awx-panel">
          <h2 className="awx-h">Most opened routes · 30 days</h2>
          {data.top_routes?.length ? (
            <ol className="awx-bars">{data.top_routes.map((r) => { const max = data.top_routes[0].n || 1; return <li key={r.ref}><span>{routeName(r.ref)}</span><i style={{ width: (r.n / max) * 100 + '%' }} /><b>{r.n}</b></li> })}</ol>
          ) : <p className="awx-muted">No route opens counted yet.</p>}
        </section>
        <section className="awx-panel">
          <h2 className="awx-h">Searches that found nothing</h2>
          {data.missing?.length ? (
            <ol className="awx-plain">{data.missing.map((r) => <li key={r.ref}><span>“{r.ref}”</span><b>{r.n}×</b></li>)}</ol>
          ) : <p className="awx-muted">Every search found something.</p>}
          <p className="awx-muted small">Places riders look for that the app does not have yet.</p>
        </section>
        <section className="awx-panel">
          <h2 className="awx-h">Discount accounts</h2>
          {discount.length ? (
            <ol className="awx-bars">{discount.sort((a, b) => b[1] - a[1]).map(([k, n]) => <li key={k}><span>{who(k)}</span><i style={{ width: (n / total) * 100 + '%' }} /><b>{n}</b></li>)}</ol>
          ) : <p className="awx-muted">No discount accounts yet.</p>}
        </section>
      </div>
    </div>
  )
}

export function Posts() {
  const { say } = useApp()
  const [filter, setFilter] = useState('reported')
  const [{ data, error }, retry] = useData(() => loadPosts(filter), [filter])
  const act = async (fn, msg) => { try { await fn(); say(msg); retry() } catch (e) { say(e.message) } }
  return (
    <>
      <div className="awx-tabs" role="tablist">
        {[['reported', 'Reported'], ['hidden', 'Hidden'], ['all', 'All posts']].map(([k, l]) => <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {error ? <Problem error={error} retry={retry} /> : !data ? <Loading /> : data.length === 0 ? <Empty title="Nothing here">{filter === 'reported' ? 'No post has been reported.' : 'No posts in this list.'}</Empty> : (
        <div className="awx-table-wrap">
          <table className="awx-table">
            <thead><tr><th>Post</th><th>About</th><th>By</th><th>When</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className={p.status !== 'visible' ? 'off' : ''}>
                  <td className="wide">{p.kind === 'fare' ? <><b>Paid ₱{p.paid}</b> · {who(p.passenger)}</> : p.body}</td>
                  <td>{aboutPost(p)}</td>
                  <td>{p.author_name}</td>
                  <td className="nowrap">{when(p.created_at)}</td>
                  <td><span className={'awx-pill ' + (p.status === 'visible' ? 'ok' : 'mute')}>{p.status === 'visible' ? 'Showing' : 'Hidden'}</span>{p.reports > 0 && <span className="awx-pill bad">{p.reports} report{p.reports > 1 ? 's' : ''}</span>}</td>
                  <td className="actions">
                    {p.status === 'visible'
                      ? <button className="awb ghost" onClick={() => act(() => setPostStatus(p.id, 'hidden'), 'Post hidden')}>Hide</button>
                      : <button className="awb ghost" onClick={() => act(() => setPostStatus(p.id, 'visible'), 'Post shown again')}>Show</button>}
                    <button className="awb danger" onClick={() => { if (window.confirm('Delete this post for good?')) act(() => removePost(p.id), 'Post deleted') }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export function Words() {
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
    <div className="awx-words">
      <form className="awx-panel awx-inline" onSubmit={add}>
        <label className="awx-field grow"><span>Block a word in names and comments</span><input value={word} maxLength="30" onChange={(e) => setWord(e.target.value)} placeholder="Word to block" autoComplete="off" /></label>
        <label className="awx-check"><input type="checkbox" checked={whole} onChange={(e) => setWhole(e.target.checked)} />Whole word only</label>
        <button className="awb primary">Add word</button>
      </form>
      <p className="awx-muted small">“Whole word only” blocks “ass” but still allows “class”. Spelling tricks like p*t4 are caught as well.</p>
      {!data ? <Loading /> : (
        <div className="awx-chips">
          {data.map((w) => (
            <span key={w.word} className="awx-chip">{w.word}{!w.whole && <em>inside words</em>}
              <button aria-label={`Remove ${w.word}`} onClick={async () => { try { await removeWord(w.word); retry() } catch (e) { say(e.message) } }}><Icon name="close" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
