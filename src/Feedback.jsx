import { useCallback, useEffect, useState } from 'react'
import { Icon, useApp } from './components'
import { useAuth } from './auth'
import { PASSENGERS } from './data'
import { checkComment } from './moderation'
import { loadPosts, addPost, deletePost, reportPost, friendly } from './posts'

const ago = (iso) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000))
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`
}
const label = (id) => PASSENGERS.find((p) => p.id === id)?.short ?? id

// What riders say about a route, a place or a driver group: what they paid and short comments.
// `scope` is { routeId } or { placeId } or { stationId }. `fare` also shows the "I paid" form (routes only).
export default function Feedback({ scope, fare = false }) {
  const { go, say, t } = useApp()
  const a = useAuth()
  const [posts, setPosts] = useState(null) // null = loading
  const [failed, setFailed] = useState(false)
  const [mode, setMode] = useState(null) // 'fare' | 'comment'
  const [paid, setPaid] = useState('')
  const [who, setWho] = useState(a.profile?.passenger === 'regular' || !a.profile?.passenger ? 'adult' : a.profile.passenger)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const key = JSON.stringify(scope)

  const refresh = useCallback(() => loadPosts(scope).then((d) => { setPosts(d); setFailed(false) }, () => { setFailed(true); setPosts([]) }), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (a.configured) refresh(); else setPosts([]) }, [a.configured, refresh])

  if (!a.configured) return null // posts need accounts to be switched on
  const fares = (posts ?? []).filter((p) => p.kind === 'fare')
  const byWho = PASSENGERS.map((p) => ({ p, list: fares.filter((f) => f.passenger === p.id) })).filter((x) => x.list.length)
  const ready = a.user && a.profile?.displayName

  const submit = async (fields) => {
    setBusy(true)
    try { await addPost(a.user.id, scope, fields); setMode(null); setPaid(''); setText(''); say('Thank you. Posted.'); refresh() }
    catch (e) { say(friendly(e.message)) }
    setBusy(false)
  }
  const sendFare = (e) => { e.preventDefault(); const n = parseInt(paid, 10); if (!n || n < 5) { say('Type what you paid.'); return } submit({ kind: 'fare', passenger: who, paid: n }) }
  const sendComment = (e) => { e.preventDefault(); const err = checkComment(text); if (err) { say(err); return } submit({ kind: 'comment', body: text.trim() }) }
  const report = (id) => reportPost(id).then(() => { say('Reported. Thank you.'); refresh() }, (e) => say(friendly(e.message)))
  const remove = (id) => deletePost(id).then(() => refresh())

  return (
    <section className="card glass feedback" aria-label="What riders say">
      <h2 className="sec">{t('What riders say')}</h2>
      {posts === null && <p className="hint">Loading…</p>}
      {failed && <p className="hint">Could not load posts. They need a signal.</p>}

      {byWho.length > 0 && (
        <div className="paid-sum">
          {byWho.map(({ p, list }) => {
            const v = list.map((f) => f.paid); const lo = Math.min(...v), hi = Math.max(...v)
            return <span className="paid-chip" key={p.id}><b>{p.short}</b>₱{lo === hi ? lo : `${lo}–${hi}`}<em>{list.length} {list.length === 1 ? 'report' : 'reports'}</em></span>
          })}
        </div>
      )}
      {posts && posts.length === 0 && !failed && <p className="hint">No posts yet. Be the first to share what you paid{fare ? '' : ' or a tip'}.</p>}

      <ul className="posts">
        {(posts ?? []).slice(0, 12).map((p) => (
          <li key={p.id}>
            <span className="avatar" aria-hidden="true">{p.author_name[0].toUpperCase()}</span>
            <div>
              <b>{p.author_name}</b> <span className="row-sub inline-sub">{ago(p.created_at)}</span>
              <p>{p.kind === 'fare' ? <>Paid <b>₱{p.paid}</b> as {label(p.passenger)}</> : p.body}</p>
            </div>
            {a.user?.id === p.user_id
              ? <button className="post-act" onClick={() => remove(p.id)}>Delete</button>
              : <button className="post-act" onClick={() => (a.user ? report(p.id) : go('account'))} aria-label="Report this post">Report</button>}
          </li>
        ))}
      </ul>

      {!ready ? (
        <button className="btn secondary" onClick={() => go('account')}><Icon name="drivers" />{a.user ? 'Add your name to post' : 'Sign in to post'}</button>
      ) : mode === null ? (
        <div className="cta-row">
          {fare && <button className="btn" onClick={() => setMode('fare')}><Icon name="calc" />I paid…</button>}
          <button className="btn secondary" onClick={() => setMode('comment')}><Icon name="info" />Add a tip</button>
        </div>
      ) : mode === 'fare' ? (
        <form className="post-form" onSubmit={sendFare}>
          <div className="chips wrap" role="group" aria-label="Who paid">
            {PASSENGERS.map((p) => <button type="button" key={p.id} className="chip small" aria-pressed={who === p.id} onClick={() => setWho(p.id)}>{p.short}</button>)}
          </div>
          <input className="boxed input" inputMode="numeric" placeholder="Pesos you paid" value={paid} onChange={(e) => setPaid(e.target.value.replace(/\D/g, '').slice(0, 4))} aria-label="Pesos you paid" />
          <div className="cta-row"><button className="btn" disabled={busy}><Icon name="check" />Post</button><button type="button" className="btn secondary" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      ) : (
        <form className="post-form" onSubmit={sendComment}>
          <textarea className="boxed input" rows="3" maxLength="140" placeholder="A short tip for other riders" value={text} onChange={(e) => setText(e.target.value)} aria-label="Your tip" />
          <span className="row-sub">{text.length}/140 · posted as {a.profile.displayName}</span>
          <div className="cta-row"><button className="btn" disabled={busy}><Icon name="check" />Post</button><button type="button" className="btn secondary" onClick={() => setMode(null)}>Cancel</button></div>
        </form>
      )}
      {fare && scope.routeId && <button className="btn secondary" onClick={() => go('report', { id: scope.routeId })}><Icon name="alert" />Fare not right? Tell us what you paid</button>}
    </section>
  )
}
