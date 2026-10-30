import { useMemo, useState } from 'react'
import { useApp, Trike, Moto, Icon, RouteRow, Tag } from '../components'
import { useStored } from '../hooks'
import MapView from '../MapView'
import Picker from '../Picker'
import InstallPrompt from '../InstallPrompt'
import { places, placeById, shortName, routes, routeBetween, bestRouteFrom, nearestPlace, popularRoutes, towns, fareText, nearestStands, compassName, walkMinutes, fmtDist } from '../data'

const TRY = ['rizal', 'market', 'dolo', 'libertad']
const countBy = (f) => routes.filter(f).length

// Live: the closest waiting spots and BTODA groups to where the person is, updating as they walk.
function NearYou({ loc, go, retry }) {
  if (loc.state === 'ok') {
    const list = nearestStands(loc.ll, 3)
    return (
      <section className="card glass nearyou" aria-label="Waiting spots near you">
        <div className="sec-line">
          <h2 className="sec">Near you</h2>
          <span className="live on" role="status"><i aria-hidden="true" />Live · within {loc.accuracy} m</span>
        </div>
        <p className="row-sub">Where to wait for a ride. The distances change as you move.</p>
        <div className="list tight">
          {list.map(({ station, place, meters, bearing }) => (
            <button key={station.id} className="row-item compact near-row" onClick={() => go('station', { id: station.id })}>
              {station.type === 'motor' ? <span className="badge-line moto"><Moto width={34} height={24} /></span> : <span className="badge-line trike"><Trike width={34} height={24} /></span>}
              <span className="row-main">
                <span className="row-title">{station.name}</span>
                <span className="row-sub">{place.kind === 'Waiting spot' ? place.note : `At ${place.name}`}</span>
              </span>
              <span className="row-right">
                <b className="price">{fmtDist(meters)}</b>
                <span className="eta"><Icon name="arrow" className="inline" style={{ transform: `rotate(${Math.round(bearing - 90)}deg)` }} /> {compassName(bearing)} · ~{walkMinutes(meters)} min</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    )
  }
  const text = {
    finding: 'Finding where you are…',
    outside: 'You are outside Bansalan. Waiting spots near you show when you are in town.',
    denied: 'Turn on location to see the nearest waiting spot and BTODA group. It updates as you move.',
    off: 'Location is not available. Turn it on to see the nearest waiting spot and BTODA group.',
  }[loc.state]
  return (
    <section className="card glass nearyou" aria-label="Waiting spots near you">
      <h2 className="sec">Near you</h2>
      <p className="row-sub">{text}</p>
      {(loc.state === 'denied' || loc.state === 'off') && <button className="btn sm" onClick={retry}><Icon name="locate" />Allow location</button>}
    </section>
  )
}

export default function Home() {
  const { go, t, lang, setLang, say, saved, recent, online, loc, retryLocation } = useApp()
  const [from, setFrom] = useState('me') // 'me' = where the person is now
  const [to, setTo] = useState(null)
  const [picker, setPicker] = useState(null) // 'from' | 'to' | 'slot:home' | 'slot:school' | 'slot:work' | null
  const [mine, setMine] = useStored('bansaride-myplaces', {}) // the person's own Home, School and Work
  const [spin, setSpin] = useState(0)
  const [scope, setScope] = useState('bansalan') // inside Bansalan, or going to another town
  const here = loc.state === 'ok' ? loc.ll : null
  const nearHere = here ? nearestPlace(here[0], here[1]) : null
  const fromName = from === 'me' ? 'My location' : placeById(from).name
  const fromSub = from !== 'me' ? '' : here ? `Near ${nearHere.place.name}` : loc.state === 'finding' ? 'Finding where you are…' : loc.state === 'outside' ? 'You are outside Bansalan' : 'Turn on location'
  const center = useMemo(() => [placeById('market').lat, placeById('market').lon], [])
  const focus = useMemo(() => (here ? [here[0], here[1]] : null), [here])
  const chip = {
    finding: { title: 'Finding where you are…', sub: 'Allow location to see your spot' },
    ok: { title: 'You are here', sub: 'Your location is shown on the map' },
    outside: { title: 'You are outside Bansalan', sub: 'Showing the Bansalan town center' },
    denied: { title: 'Location is off', sub: 'Turn on location to see where you are' },
    off: { title: 'Location is off', sub: 'Turn on location to see where you are' },
  }[loc.state]

  const open = (id) => go('route', { id })
  const openPair = (a, b) => {
    if (a === 'me') {
      // start from where the person is: use the stored route whose pickup is nearest to them
      if (!here) {
        const fallback = routeBetween('terminal', b)
        if (fallback) { say('Turn on location to start from where you are. Showing the route from the Bus Terminal.'); go('route', fallback.reversed ? { id: fallback.route.id, rev: true } : { id: fallback.route.id }); return }
        say('Turn on location to start from where you are.'); return
      }
      const best = bestRouteFrom(here, b)
      if (best) go('route', best.reversed ? { id: best.route.id, rev: true } : { id: best.route.id })
      else say(t('noRoute'))
      return
    }
    const hit = a !== b && routeBetween(a, b)
    if (hit) go('route', hit.reversed ? { id: hit.route.id, rev: true } : { id: hit.route.id })
    else say(t('noRoute'))
  }
  const pick = (id) => {
    const which = picker
    setPicker(null)
    if (which?.startsWith('slot:')) { setMine((m) => ({ ...m, [which.slice(5)]: id })); say('Saved.'); return }
    if (which === 'from') { setFrom(id); if (to) openPair(id, to) } else { setTo(id); openPair(from, id) }
  }
  const quickPick = (id) => { setTo(id); openPair(from, id) }
  const swap = () => {
    if (!to) { say('Choose a destination first.'); return }
    if (from === 'me') { say('Choose a pickup place first. Your location can only be the start.'); return }
    setSpin((n) => n + 1)
    setFrom(to); setTo(from)
  }

  const savedRoutes = saved.map((id) => routes.find((r) => r.id === id)).filter(Boolean)
  const recentRoutes = recent.map((id) => routes.find((r) => r.id === id)).filter((r) => r && !saved.includes(r.id)).slice(0, 3)
  const listRoutes = savedRoutes.length > 0 ? savedRoutes : recentRoutes

  const cats = [
    { id: 'Tricycle', name: 'Tricycle', sub: `${countBy((r) => r.vehicle !== 'Motor')} routes`, eg: 'Rizal, Dolo, Libertad, Tubod', tone: 'blue', art: <Trike width={92} height={64} /> },
    { id: 'Motor', name: 'Motorcycles', sub: `${countBy((r) => r.vehicle === 'Motor')} mountain routes`, eg: 'Balutakay, Gagpang, Alegre', tone: 'green', art: <Icon name="moto" /> },
    { id: 'Streets', name: 'Streets', sub: `${places.filter((p) => p.kind === 'Street').length} mapped`, eg: 'Via Aldi, J. P. Laurel, Roxas', tone: 'orange', art: <Icon name="road" /> },
    { id: 'Barangays', name: 'Barangays', sub: `${places.filter((p) => p.kind === 'Barangay' || p.kind === 'Sitio').length} and sitios`, eg: 'Mabuhay, Union, Managa', tone: 'red', art: <Icon name="town" /> },
  ]

  return (
    <>
      <header className="hero2">
        <div className="hero2-map" aria-hidden="true">
          <MapView preview center={center} zoom={16} fit={false} me={here} focus={focus} />
        </div>
        <div className="hero2-fade" aria-hidden="true" />
        <div className="hero2-bar">
          <div className="brand glass"><span className="brand-mark"><Trike width={30} height={21} /></span><span>BansaRide</span></div>
          <div className="hero2-actions">
            <button className="circ-btn glass" aria-label="Open the menu" onClick={() => go('menu')}><Icon name="menu" /></button>
            <div className="lang glass" role="group" aria-label="Language">
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
              <button aria-pressed={lang === 'bis'} onClick={() => { setLang('bis'); say('Sample Bisaya text. A local speaker should check it.') }}>BIS</button>
            </div>
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{chip.title}. {chip.sub}</p>
      </header>

      <div className="body home2">
        <InstallPrompt />
        <section className="card glass where" aria-label="Plan a ride">
          <div className="where-top">
            <span className="where-chip">{t('whereTo')}</span>
            <span className={'live ' + (online ? 'on' : 'off')} role="status"><i aria-hidden="true" />{online ? 'Ready offline' : 'Offline mode'}</span>
          </div>
          <div className="seg scope" role="tablist" aria-label="Where are you going">
            <button role="tab" aria-selected={scope === 'bansalan'} onClick={() => setScope('bansalan')}>{t('inBansalan')}</button>
            <button role="tab" aria-selected={scope === 'towns'} onClick={() => setScope('towns')}>{t('otherTowns')}</button>
          </div>
          {scope === 'bansalan' ? (<>
          <div className="where-row from first">
            <button className="where-main" onClick={() => setPicker('from')}>
              <span className="lbl">{t('from')}</span>
              <span className="val"><Icon name={from === 'me' ? 'locate' : 'pin'} className="inline" />{fromName}</span>
              {fromSub && <span className="row-sub">{fromSub}</span>}
            </button>
            <button className="circ-btn" onClick={swap} aria-label="Swap from and to" style={{ '--spin': `${spin * 180}deg` }}><Icon name="swap" /></button>
          </div>
          <div className="where-row to">
            <button className="where-main" onClick={() => setPicker('to')}>
              <span className={'where-title' + (to ? '' : ' ph')}>{to ? placeById(to).name : t('chooseTo')}</span>
            </button>
            <button className="circ-btn brand" onClick={() => setPicker('to')} aria-label="Search a destination"><Icon name="search" /></button>
          </div>
          <div className="try">
            <span className="lbl">Try</span>
            <div className="chips" role="group" aria-label="Quick destinations">
              {TRY.map((id) => <button key={id} className="chip small" onClick={() => quickPick(id)}>{placeById(id).name}</button>)}
            </div>
          </div>
          </>) : (
            <div className="towns-quick">
              <p className="row-sub">Tap a town for the fare, the hours and when the bus, van or mini bus runs.</p>
              <div className="town-grid">
                {towns.map((tw) => (
                  <button key={tw.id} className="town-chip" onClick={() => go('town', { id: tw.id })}>
                    <b>{tw.name.replace(' City', '')}</b><span>{tw.km} km</span>
                  </button>
                ))}
              </div>
              <button className="link-btn" onClick={() => go('towns')}>{t('seeAllTowns')}<Icon name="chevron" /></button>
            </div>
          )}
        </section>

        <section aria-label="My places">
          <div className="myplaces">
            {[['home', 'Home', 'home'], ['school', 'School', 'town'], ['work', 'Work', 'flag']].map(([slot, label, icon]) => {
              const id = mine[slot]
              const p = id && placeById(id)
              return (
                <div className={'mine-slot' + (p ? ' set' : '')} key={slot}>
                  <button className="mine-go" onClick={() => (p ? quickPick(p.id) : setPicker('slot:' + slot))} aria-label={p ? `Go to ${label}: ${p.name}` : `Set your ${label}`}>
                    <Icon name={icon} />
                    <b>{label}</b>
                    <span>{p ? shortName(p.id) : 'Tap to set'}</span>
                  </button>
                  {p && <button className="mine-x" onClick={() => setPicker('slot:' + slot)} aria-label={`Change ${label}`}><Icon name="repeat" /></button>}
                </div>
              )
            })}
          </div>
        </section>

        <NearYou loc={loc} go={go} retry={retryLocation} />

        <section aria-label="Kinds of rides and places">
          <div className="cats">
            {cats.map((c, i) => (
              <button key={c.id} className={`cat ${c.tone} rise`} style={{ '--i': i }} onClick={() => go('routes', { id: c.id })}>
                <span className="cat-art" aria-hidden="true">{c.art}</span>
                <span className="cat-name">{c.name}</span>
                <span className="cat-sub">{c.sub}</span>
                <span className="cat-eg">{c.eg}</span>
              </button>
            ))}
          </div>
        </section>

        <button className="drivers-banner glass" onClick={() => go('drivers')}>
          <span className="ico gold"><Icon name="vehicle" /></span>
          <span className="row-main"><b>Drivers and waiting spots</b><span className="row-sub">BTODA groups and motorcycles: where they wait and where they go</span></span>
          <Icon name="chevron" className="chev" />
        </button>

        <section>
          <div className="sec-line">
            <h2 className="sec">{t('popular')}</h2>
            <button className="link-btn" onClick={() => go('routes')}>{t('seeAll')}<Icon name="chevron" /></button>
          </div>
          <div className="hscroll boards-row">
            {popularRoutes.map((r, i) => (
              <button key={r.id} className={`board c${i % 4} rise`} style={{ '--i': i }} onClick={() => open(r.id)} aria-label={`${placeById(r.to).name}, ${r.km} kilometers, fare ${r.fareMin} to ${r.fare} pesos`}>
                <span className={'board-name' + (placeById(r.to).name.length > 8 ? ' long' : '')}>{placeById(r.to).name}</span>
                <span className="board-meta">{r.km} km · ~{r.minutes} min</span>
                <span className="board-fare">{fareText(r)}</span>
              </button>
            ))}
          </div>
          <p className="hint">From the Bus Terminal by tricycle. Fares are estimates.</p>
        </section>

        <section>
          <div className="sec-line">
            <h2 className="sec">{savedRoutes.length > 0 ? t('saved') : t('recent')}</h2>
            <button className="link-btn" onClick={() => go('routes')}>{t('seeAll')}<Icon name="chevron" /></button>
          </div>
          {listRoutes.length > 0
            ? <div className="list">{listRoutes.map((r, i) => <RouteRow key={r.id} route={r} onOpen={open} isSaved={saved.includes(r.id)} index={i} />)}</div>
            : <p className="empty-card glass">{t('savedEmpty')}</p>}
        </section>

        <section>
          <div className="sec-line">
            <h2 className="sec">{t('towns')}</h2>
            <button className="link-btn" onClick={() => go('towns')}>{t('seeAllTowns')}<Icon name="chevron" /></button>
          </div>
          <div className="hscroll">
            {towns.slice(0, 6).map((tw, i) => (
              <button key={tw.id} className="town-card rise" style={{ '--i': i }} onClick={() => go('town', { id: tw.id })}>
                <span className="town-name">{tw.name}</span>
                <span className="town-km">{tw.km}<small> km</small></span>
                <span className="town-time">{tw.duration}</span>
              </button>
            ))}
            <button className="town-card more" onClick={() => go('towns')}>
              <span className="town-km">{towns.length}</span>
              <span className="town-name">towns and cities</span>
              <span className="town-time">See all</span>
            </button>
          </div>
        </section>

        <p className="foot">
          Made for Bansalan, Davao del Sur. Places and roads come from OpenStreetMap. Fares and travel times are estimates
          until confirmed at the terminals. Tricycle and pedicab are the same ride. Motorcycles are for the mountain areas.
        </p>
      </div>

      {picker && (
        <Picker
          title={picker === 'from' ? 'Choose pickup' : picker.startsWith('slot:') ? `Choose your ${picker.slice(5)}` : 'Choose destination'}
          otherId={picker === 'from' ? to : (from === 'me' ? null : from)}
          selectedId={picker === 'from' ? from : to}
          allowMe={picker === 'from'}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  )
}
