import { Bus, Van, Icon, useApp } from './components'
import { useAuth } from './auth'
import { TRANSIT, TOWN_RIDES, transitFare, transitStatus, transitKind } from './data'

// Bus, van and mini bus for a trip of `km`: hours, whether it runs now, and the fare for a regular rider and a student.
export default function Transit({ modes, km, townId }) {
  const rule = TOWN_RIDES[townId]
  const { discount } = useAuth()
  const { t } = useApp()
  const mine = discount ? transitKind(discount) : null
  return (
    <div className="transit">
      {modes.map((id) => {
        const m = TRANSIT[id]
        const fare = transitFare(id, km)
        const s = transitStatus(m)
        const Art = id === 'van' ? Van : Bus
        const tone = id === 'mini' ? 'm-mini' : ''
        return (
          <div className="transit-row" key={id}>
            <span className="transit-art"><Art className={tone} width={64} height={44} /></span>
            <div className="transit-main">
              <b>{m.label}</b>
              <span className="row-sub">{m.where}</span>
              <span className="row-sub"><Icon name="clock" className="inline" /> {m.firstText} to {m.lastText}</span>
              {s.ending && <span className="transit-warn">Last ride in {s.left} min</span>}
              <span className={'transit-state' + (s.open ? ' open' : '')}>{s.open ? `${t('runningNow')} · ${t('lastRide')} ${m.lastText}` : `${t('notRunning')} · ${t('firstRide')} ${m.firstText}`}</span>
            </div>
            {rule?.ask ? (
              <div className="transit-fare ask">
                <b>Ask</b><span className="row-sub">the conductor</span>
                {rule.guide && <span className="row-sub">Students about ₱{rule.guide.student[0]}–{rule.guide.student[1]}</span>}
              </div>
            ) : (
            <div className="transit-fare">
              <b className={mine === 'adult' ? 'mine' : ''}>₱{fare.adult}</b><span className="row-sub">{t('regular')}</span>
              <b className={mine === 'student' ? 'mine' : ''}>₱{fare.student}</b><span className="row-sub">{mine === 'student' ? t('yourFare') : t('student')}</span>
            </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
