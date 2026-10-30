import { useState } from 'react'
import { BackButton, Icon, Tag, YHeader, useApp } from '../components'
import { useAuth, KINDS, GOV_IDS } from '../auth'
import { places, PASSENGERS, fareFor } from '../data'
import { checkName } from '../moderation'
import { friendly } from '../posts'

const schools = places.filter((p) => p.kind === 'School').map((p) => p.name)

// Sign in with an email link, say who you are (and your school), and get your own fare everywhere.
export default function Account() {
  const { say } = useApp()
  const a = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState(a.profile ?? { passenger: 'regular', school: '', idType: '', displayName: '' })
  const kind = KINDS.find((k) => k.id === draft.passenger)
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const send = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) { say('Type a valid email.'); return }
    setBusy(true)
    const { error } = await a.sendLink(email.trim())
    setBusy(false)
    if (error) say(error); else setSent(true)
  }
  const save = async () => {
    if (a.user) { const bad = checkName(draft.displayName); if (bad) { say(bad); return } }
    if (kind.student && !draft.school.trim()) { say('Tell us your school.'); return }
    if (kind.needsId && !draft.idType) { say('Choose which government ID you have.'); return }
    const { error } = await a.saveProfile({ ...draft, school: kind.student ? draft.school.trim() : '', idType: kind.needsId ? draft.idType : '' })
    say(error ? friendly(error) : 'Saved.')
  }
  const mine = a.discount && PASSENGERS.find((p) => p.id === a.discount)

  return (
    <>
      <YHeader title="Account" back={<BackButton to="menu" />} />
      <div className="body">
        <section className="card form">
          <h2 className="sec">Your discount</h2>
          {a.discount && mine
            ? <div className="acct-status"><Tag>{a.verified ? 'Verified' : 'On this phone only'}</Tag><p>{mine.label} fare is shown everywhere. Rizal costs <b>₱{fareFor(3.7, mine.id)}</b>.</p></div>
            : <p className="row-sub">Students, senior citizens and PWD pay less. Sign in and tell us who you are to see your own fare on every route, bus and van. You can still use the whole app as a guest.</p>}
        </section>

        {a.configured && !a.user && (
          <form className="card form acct-form" onSubmit={send}>
            <h2 className="sec">Sign in with your email</h2>
            {sent ? (
              <p className="hint"><Icon name="check" className="inline" /> Check your email for the link. Open it on this phone and you are signed in and verified.</p>
            ) : (
              <>
                <div className="acct-field">
                  <label className="lbl" htmlFor="em">Email</label>
                  <input id="em" className="boxed input" type="email" autoComplete="email" inputMode="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button className="btn" disabled={busy}><Icon name="check" />{busy ? 'Sending…' : 'Send me a sign-in link'}</button>
              </>
            )}
          </form>
        )}
        {!a.configured && <p className="hint">Sign-in is not switched on yet. You can still set who you are below. It stays on this phone and is not verified.</p>}
        {a.user && <div className="acct-email"><Tag>{a.verified ? 'Email verified' : 'Email not verified'}</Tag><span>{a.user.email}</span></div>}

        {(!a.configured || a.user) && (
          <section className="card form acct-form">
            {a.user && (
              <div className="acct-field">
                <label className="lbl" htmlFor="dn">Your display name</label>
                <input id="dn" className="boxed input" maxLength="20" autoComplete="nickname" placeholder="Shown with your fare reports and tips" value={draft.displayName ?? ''} onChange={(e) => set({ displayName: e.target.value })} />
                <p className="hint">3 to 20 letters or numbers. No # or @, no links, and no rude words. This is the only thing other people see.</p>
              </div>
            )}
            <h2 className="sec acct-sec">Who is riding?</h2>
            <div className="chips wrap" role="group" aria-label="Passenger type">
              {KINDS.map((k) => <button key={k.id} className="chip" aria-pressed={draft.passenger === k.id} onClick={() => set({ passenger: k.id })}>{k.label}</button>)}
            </div>
            {kind.student && (
              <div className="acct-field">
                <label className="lbl" htmlFor="school">What school do you go to?</label>
                <input id="school" className="boxed input" list="schools" placeholder="Type or choose your school" value={draft.school} onChange={(e) => set({ school: e.target.value })} />
                <datalist id="schools">{schools.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
            )}
            {kind.needsId && (
              <div className="acct-field">
                <label className="lbl" htmlFor="idt">Which government ID do you have?</label>
                <div className="select-wrap boxed">
                  <select id="idt" value={draft.idType} onChange={(e) => set({ idType: e.target.value })}>
                    <option value="">Choose one</option>
                    {GOV_IDS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <Icon name="chevron" className="caret" />
                </div>
                <p className="hint">Drivers may ask to see this ID. We keep only the kind of ID, never a photo or a number.</p>
              </div>
            )}
            <button className="btn" onClick={save}><Icon name="check" />Save</button>
          </section>
        )}

        {a.user && <button className="btn secondary acct-out" onClick={() => a.signOut().then(() => say('Signed out.'))}>Sign out</button>}
        <p className="hint">The app keeps only your email, who you are, your school or the kind of ID. Prices shown are estimates. The driver sets the real price.</p>
      </div>
    </>
  )
}
