import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Ctx, Defs, Icon, Trike } from '../components'
import { useAuth } from '../auth'
import { checkAdmin, loadOverview } from '../admin'
import { Overview, Posts, Inbox, Users, Words } from './sections'

// The admin website: a sidebar of sections and a wide work area, in the app's signboard style.
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'chart', note: 'Accounts, posts, alerts and what riders open' },
  { id: 'inbox', label: 'Inbox', icon: 'mail', note: 'Problem reports and new waiting spots from riders' },
  { id: 'posts', label: 'Posts', icon: 'chat', note: 'Fare reports and comments, and the ones riders reported' },
  { id: 'users', label: 'Accounts', icon: 'drivers', note: 'Everyone who signed in, with their discount type' },
  { id: 'words', label: 'Blocked words', icon: 'alert', note: 'Words that cannot be used in names and comments' },
]
const BODY = { overview: Overview, inbox: Inbox, posts: Posts, users: Users, words: Words }
const fromHash = () => { const id = window.location.hash.replace(/^#\/?/, ''); return BODY[id] ? id : 'overview' }
const today = () => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date())

// small line icons that the rider app does not have
const EXTRA = {
  chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M2 20h20" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 10h8" /></>,
}
const Glyph = ({ name }) => (EXTRA[name] ? <svg className="aw-ico" viewBox="0 0 24 24" aria-hidden="true">{EXTRA[name]}</svg> : <Icon name={name} />)

// Admins sign in with an email and a password (the account is made in Supabase: Authentication, Users). No email is sent.
function SignIn() {
  const { signInPassword, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const send = async (e) => {
    e.preventDefault()
    if (!/^S+@S+.S+$/.test(email)) { setErr('Type a valid email.'); return }
    if (!password) { setErr('Type your password.'); return }
    setErr(''); setBusy(true)
    const { error } = await signInPassword(email.trim(), password)
    setBusy(false)
    if (error) setErr(error)
  }
  return (
    <form className="aw-login" onSubmit={send}>
      <span className="aw-login-art"><Trike width={120} height={83} /></span>
      <h1>BansaRide admin</h1>
      {!configured ? <p>Accounts are not switched on for this copy of the site.</p> : (
        <>
          <p>Sign in with your admin email and password.</p>
          <label className="lbl" htmlFor="aw-email">Email</label>
          <input id="aw-email" className="boxed input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          <label className="lbl" htmlFor="aw-pass">Password</label>
          <input id="aw-pass" className="boxed input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <span className="aw-err" role="alert">{err}</span>}
          <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </>
      )}
    </form>
  )
}

export default function AdminApp() {
  const { user, ready, signOut } = useAuth()
  const [allowed, setAllowed] = useState(null) // null = checking
  const [section, setSection] = useState(fromHash)
  const [inbox, setInbox] = useState(0)
  const [toast, setToast] = useState('')
  const [clock, setClock] = useState(today)
  const timer = useRef(null)

  // (while developing, the sample-data mode in admin.js can open it without an account)
  useEffect(() => { if (!ready) return; checkAdmin().then((yes) => setAllowed(yes && (!!user || import.meta.env.DEV))) }, [user, ready])
  useEffect(() => { const f = () => setSection(fromHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  useEffect(() => { const id = setInterval(() => setClock(today()), 30000); return () => clearInterval(id) }, [])
  // the number on the Inbox button, refreshed when moving between sections
  useEffect(() => { if (allowed) loadOverview().then((o) => setInbox(o.inbox ?? 0), () => {}) }, [allowed, section])

  const say = useCallback((msg) => { setToast(msg); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 2600) }, [])
  const ctx = useMemo(() => ({ say, go: () => {}, t: (k) => k, lang: 'en' }), [say])
  const open = (id) => { window.location.hash = '/' + id }
  const cur = SECTIONS.find((s) => s.id === section)
  const Body = BODY[section]

  return (
    <Ctx.Provider value={ctx}>
      <Defs />
      {allowed === null ? <p className="aw-wait">Checking your account…</p> : !allowed ? (
        <main className="aw-gate">
          {user ? (
            <div className="aw-login">
              <span className="aw-login-art"><Trike width={120} height={83} /></span>
              <h1>Admins only</h1>
              <p>{user.email} is not an admin. Ask the app owner to add this account, or sign in with another one.</p>
              <button className="btn secondary" onClick={signOut}>Sign out</button>
            </div>
          ) : <SignIn />}
        </main>
      ) : (
        <div className="aw">
          <aside className="aw-side">
            <div className="aw-brand"><span className="aw-brand-art"><Trike width={46} height={32} /></span><b>BansaRide</b><em>Admin</em></div>
            <nav className="aw-nav" aria-label="Admin sections">
              {SECTIONS.map((s) => (
                <button key={s.id} className="aw-nav-item" aria-current={section === s.id ? 'page' : undefined} onClick={() => open(s.id)}>
                  <Glyph name={s.icon} /><span>{s.label}</span>{s.id === 'inbox' && inbox > 0 && <i className="aw-badge">{inbox}</i>}
                </button>
              ))}
            </nav>
            <div className="aw-side-foot">
              <span className="aw-who">{user?.email ?? 'Sample data'}</span>
              <a className="aw-link" href="/" target="_blank" rel="noreferrer"><Icon name="map" />Open the rider app</a>
              <button className="aw-link" onClick={signOut}><Icon name="back" />Sign out</button>
            </div>
          </aside>
          <main className="aw-main">
            <header className="aw-head">
              <div><h1>{cur.label}</h1><p>{cur.note}</p></div>
              <span className="aw-clock">{clock}</span>
            </header>
            <div className={'aw-content adm aw-' + section}><Body key={section} /></div>
          </main>
        </div>
      )}
      {toast && <div className="aw-toast" role="status">{toast}</div>}
    </Ctx.Provider>
  )
}
