import { useState } from 'react'
import { BackButton, Icon, YHeader, useApp } from '../components'
import { placeById, routes, shortName } from '../data'

const KINDS = ['Missing place or waiting spot', 'Real fare I paid', 'Wrong fare', 'Wrong place or waiting spot', 'Wrong time or hours', 'Wrong driver or contact', 'Something else']

// Tell the app maker about a mistake. The report is written for you to send (copy it or share it).
export default function Report() {
  const { say, params } = useApp()
  const r = routes.find((x) => x.id === params.id)
  const p = placeById(params.id)
  const about = r ? `${shortName(r.from)} to ${shortName(r.to)}` : p ? p.name : ''
  const [kind, setKind] = useState(KINDS[0])
  const [where, setWhere] = useState(about)
  const [what, setWhat] = useState('')

  const text = ['BansaRide problem report', `Type: ${kind}`, `About: ${where || '(not said)'}`, `What is wrong / what is right: ${what || '(not said)'}`, `Page: ${window.location.href}`].join('\n')
  const send = async () => {
    if (what.trim().length < 3) { say('Tell us what is wrong.'); return }
    try {
      if (navigator.share) { await navigator.share({ title: 'BansaRide problem report', text }); return }
      await navigator.clipboard.writeText(text)
      say('Copied. Send it to the app maker.')
    } catch { say('Could not share. Copy the text below instead.') }
  }

  return (
    <>
      <YHeader title="Report a problem" back={<BackButton to="menu" />} />
      <div className="body">
        <p className="lede">Found a wrong fare, place, time or number? Tell us so we can fix it for everyone.</p>
        <section className="card form">
          <div className="chips wrap" role="group" aria-label="What kind of problem">
            {KINDS.map((k) => <button key={k} className="chip small" aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}
          </div>
          <div>
            <label className="lbl" htmlFor="rw">Which route, place or driver?</label>
            <input id="rw" className="boxed input" maxLength="80" placeholder="For example: Bansalan to Rizal" value={where} onChange={(e) => setWhere(e.target.value)} />
          </div>
          <div>
            <label className="lbl" htmlFor="rt">What is wrong, and what is right?</label>
            <textarea id="rt" className="boxed input" rows="4" maxLength="300" placeholder="For example: the student fare is 20, not 30" value={what} onChange={(e) => setWhat(e.target.value)} />
          </div>
          <button className="btn" onClick={send}><Icon name="check" />{navigator.share ? 'Share this report' : 'Copy this report'}</button>
          <p className="hint">Do not add anyone's private details. The report has no name, only what you type.</p>
        </section>
      </div>
    </>
  )
}
