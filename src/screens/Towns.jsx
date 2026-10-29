import { useState } from 'react'
import { useApp, BackButton, Icon, Tag, YHeader, Bus, Van } from '../components'
import Transit from '../Transit'
import TransitPop from '../TransitPop'
import { useAuth } from '../auth'
import { towns, routes, shortName, FARE_NOTE, PASSENGERS, fareFor, fareText, transitModesForTown, transitFare } from '../data'

function TownRow({ town, onOpen, index }) {
  return (
    <button className="row-item rise" style={{ '--i': Math.min(index, 8) }} onClick={() => onOpen(town.id)}>
      <span className="ico"><Icon name="town" /></span>
      <span className="row-main">
        <span className="row-title">{town.name}</span>
        <span className="row-sub">{town.km} km · {town.duration.replace('about ', '~')}</span>
      </span>
      {town.fare ? <span className="price">₱{town.fare}</span> : <Tag>Ask at terminal</Tag>}
      <Icon name="chevron" className="chev" />
    </button>
  )
}

// All towns and cities: Davao del Sur first, then other cities. Distance and travel time only.
export function TownsList() {
  const { go } = useApp()
  const [q, setQ] = useState('')
  const [g, setG] = useState('All')
  const term = q.trim().toLowerCase()
  const match = (t) => (!term || t.name.toLowerCase().includes(term))
  const dds = towns.filter((t) => t.inProvince && match(t))
  const other = towns.filter((t) => !t.inProvince && match(t))
  const open = (id) => go('town', { id })
  const showDds = g !== 'Other cities' && dds.length > 0
  const showOther = g !== 'Davao del Sur' && other.length > 0
  return (
    <>
      <YHeader title="Other towns" back={<BackButton to="home" />}>
        <label className="search-input">
          <Icon name="search" />
          <input type="search" placeholder="Search a town or city" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </label>
      </YHeader>
      <div className="body">
        <p className="lede">Road distance from the Bansalan Bus Terminal. Fares and trip times are not confirmed yet. Ask at the terminal before you go.</p>
        <div className="chips scroll" role="group" aria-label="Filter">
          {['All', 'Davao del Sur', 'Other cities'].map((k) => <button key={k} className="chip" aria-pressed={g === k} onClick={() => setG(k)}>{k}</button>)}
        </div>
        {!showDds && !showOther && <p className="hint">No town matches “{q}”.</p>}
        {showDds && (
          <section>
            <h2 className="sec">Davao del Sur · {dds.length} {dds.length === 1 ? 'municipality' : 'municipalities'}</h2>
            <div className="list">{dds.map((t, i) => <TownRow key={t.id} town={t} onOpen={open} index={i} />)}</div>
          </section>
        )}
        {showOther && (
          <section>
            <h2 className="sec">Other cities</h2>
            <div className="list">{other.map((t, i) => <TownRow key={t.id} town={t} onOpen={open} index={i} />)}</div>
          </section>
        )}
        <div className="note static">
          <Icon name="info" />
          <span><b>Routes stay inside Bansalan</b><span className="row-sub">BansaRide shows maps and waiting spots only inside Bansalan. For other towns it shows the road distance, travel time and fare.</span></span>
        </div>
      </div>
    </>
  )
}

// Other towns show distance, travel time and fare only. Maps and steps stay inside Bansalan.
export function Town() {
  const { go, params } = useApp()
  const tw = towns.find((x) => x.id === params.id) ?? towns[0]
  const [dir, setDir] = useState('out')
  const out = dir === 'out'

  return (
    <>
      <TransitPop modes={transitModesForTown(tw.id)} name={tw.name} />
      <YHeader title={out ? tw.name : 'Bansalan'} back={<BackButton to="towns" />} />
      <div className="body">
        <div className="chips scroll" role="group" aria-label="Choose a town">
          {towns.map((x) => (
            <button key={x.id} className="chip" aria-pressed={x.id === tw.id}
              ref={(el) => { if (el && x.id === tw.id) el.scrollIntoView({ inline: 'center', block: 'nearest' }) }}
              onClick={() => go('town', { id: x.id }, true)}>{x.name}</button>
          ))}
        </div>
        <div className="seg" role="tablist" aria-label="Direction">
          <button role="tab" aria-selected={out} onClick={() => setDir('out')}>From Bansalan</button>
          <button role="tab" aria-selected={!out} onClick={() => setDir('in')}>To Bansalan</button>
        </div>

        <section className="card stats3" aria-label="Trip summary">
          <div><span className="stat-k">Bus fare</span><span className="stat-v">₱{transitFare('bus', tw.km).student}–{transitFare('bus', tw.km).adult}</span></div>
          <div><span className="stat-k">Travel time</span><span className="stat-v small">{tw.duration}</span></div>
          <div><span className="stat-k">Distance</span><span className="stat-v">{tw.km}<small> km</small></span></div>
        </section>

        <p className="route-line">
          <b>{out ? 'Bansalan' : tw.name}</b><Icon name="arrow" className="inline" /><b>{out ? tw.name : 'Bansalan'}</b>
          <Tag tone="grey">{tw.province}</Tag>
          <Tag>Not confirmed</Tag>
        </p>
        {tw.ref && <p className="hint">{tw.ref}</p>}
        <p className="hint">Fares and trip times are not confirmed yet. Ask at the terminal before you go. The distance is the real road distance.</p>

        <section className="card ride-modes">
          <h2 className="sec">Ride by bus or van</h2>
          <Transit modes={transitModesForTown(tw.id)} km={tw.km} />
          <p className="hint">Hours are reported by riders. Fares are calculated from the Davao bus fare (₱140 to ₱200) and the Kapatagan mini bus fare (₱80 to ₱100 for a student), so they can be a little off. Ask the dispatcher.</p>
        </section>

        <section className="card">
          <h2 className="sec">{out ? 'Board in Bansalan' : 'You arrive in Bansalan'}</h2>
          <p className="row-title" style={{ marginBottom: 12 }}>Bansalan Bus Terminal</p>
          <button className="btn" onClick={() => (out ? go('map', { id: 'terminal' }) : go('home', {}, true))}>
            <Icon name={out ? 'pin' : 'home'} />{out ? 'See the terminal on the map' : 'Plan a ride in Bansalan'}
          </button>
        </section>

        <div className="note static">
          <Icon name="info" />
          <span><b>Routes stay inside Bansalan</b><span className="row-sub">BansaRide shows maps and waiting spots only inside Bansalan. For other towns it shows the distance, travel time and fare.</span></span>
        </div>
      </div>
    </>
  )
}

export function Fares() {
  const { params } = useApp()
  const calcRoutes = routes.filter((x) => x.fare !== null) // motorcycles have no fare yet
  const first = calcRoutes.find((x) => x.id === params.id) ?? calcRoutes.find((x) => x.to === 'rizal') ?? calcRoutes[0]
  const [rid, setRid] = useState(first.id)
  const { discount } = useAuth()
  const [counts, setCounts] = useState({ [discount ?? 'adult']: 1 }) // starts with your own fare when you have a discount
  const [asked, setAsked] = useState('')
  const [townId, setTownId] = useState('davao')
  const r = calcRoutes.find((x) => x.id === rid) ?? first
  const rows = PASSENGERS.map((p) => ({ ...p, n: counts[p.id] ?? 0, each: fareFor(r.km, p.id) }))
  const riders = rows.reduce((a, x) => a + x.n, 0)
  const total = rows.reduce((a, x) => a + x.n * x.each, 0)
  const bump = (id, d) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(6, (c[id] ?? 0) + d)) }))
  const askedNum = parseInt(asked, 10)
  const diff = askedNum - total
  const fair = diff <= Math.round(total * 0.2)
  const hasAsk = asked.trim() !== '' && !Number.isNaN(askedNum) && riders > 0

  return (
    <>
      <YHeader title="Fare check" />
      <div className="body">
        <p className="lede">Choose a route and who is riding. Each person pays their own fare, by distance.</p>

        <section className="card form">
          <div>
            <label className="lbl" htmlFor="route">Route</label>
            <div className="select-wrap boxed">
              <select id="route" value={rid} onChange={(e) => setRid(e.target.value)}>
                {calcRoutes.map((x) => <option key={x.id} value={x.id}>{shortName(x.from)} → {shortName(x.to)}</option>)}
              </select>
              <Icon name="chevron" className="caret" />
            </div>
            <p className="row-sub" style={{ marginTop: 6 }}>{r.km} km · {r.minutes} min · Fare {fareText(r)} depending on who rides</p>
          </div>

          <div className="pax">
            {rows.map((p) => (
              <div key={p.id} className="pax-row">
                <div><b>{p.label}</b><span className="row-sub">₱{p.each} each</span></div>
                <div className="stepper">
                  <button aria-label={`Fewer ${p.short}`} onClick={() => bump(p.id, -1)}><Icon name="minus" /></button>
                  <b aria-live="polite">{p.n}</b>
                  <button aria-label={`More ${p.short}`} onClick={() => bump(p.id, 1)}><Icon name="plus" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="result">
            <div><span className="stat-k">Total for {riders} {riders === 1 ? 'rider' : 'riders'}</span><span className="stat-v huge">₱{total}</span></div>
          </div>
          <p className="hint">{FARE_NOTE}</p>
        </section>

        <section className="card form">
          <h2 className="sec">Bus, van and mini bus</h2>
          <div>
            <label className="lbl" htmlFor="town">Going to</label>
            <div className="select-wrap boxed">
              <select id="town" value={townId} onChange={(e) => setTownId(e.target.value)}>
                {towns.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.km} km</option>)}
              </select>
              <Icon name="chevron" className="caret" />
            </div>
          </div>
          <Transit modes={transitModesForTown(townId)} km={towns.find((x) => x.id === townId).km} />
          <p className="hint">Students, seniors and PWD pay the student fare. Based on the Davao bus fare and the Kapatagan mini bus fare riders told us.</p>
        </section>

        <section className="card form">
          <h2 className="sec">Was the price fair?</h2>
          <div>
            <label className="lbl" htmlFor="ask">The driver asked for (total, ₱)</label>
            <input id="ask" className="boxed input" inputMode="numeric" placeholder="Type the price" value={asked} onChange={(e) => setAsked(e.target.value)} />
          </div>
          <div className={'verdict ' + (!hasAsk ? 'idle' : fair ? 'good' : 'bad')} role="status">
            <Icon name={!hasAsk ? 'info' : fair ? 'check' : 'alert'} />
            <span>
              {!hasAsk && 'Add who is riding, then type the price to compare it.'}
              {hasAsk && fair && <><b>Looks fair.</b> It is close to ₱{total}.</>}
              {hasAsk && !fair && <><b>Higher than usual.</b> It is ₱{diff} above ₱{total}. Ask the driver or check at the terminal.</>}
            </span>
          </div>
        </section>
      </div>
    </>
  )
}
