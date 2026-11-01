// @ts-nocheck - this file runs on Supabase (Deno), not Node. VS Code checks it as Node, so it shows false errors for Deno and npm: imports.
// Sends the ride alerts: 30 minutes before the first ride and 1 hour before the last ride, for the big bus, van and mini bus,
// and the weather notices (rain, storm, very hot, dangerous heat).
// It runs every 5 minutes (see the README for the schedule). Times are Bansalan time (UTC+8).
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

// minutes after midnight
const MODES: Record<string, { label: string; first: number; last: number; firstText: string; lastText: string }> = {
  bus: { label: 'Big bus', first: 3 * 60, last: 23 * 60, firstText: '3:00 AM', lastText: '11:00 PM' },
  van: { label: 'Van', first: 5 * 60, last: 20 * 60, firstText: '5:00 AM', lastText: '8:00 PM' },
  mini: { label: 'Mini bus', first: 8 * 60, last: 17 * 60, firstText: '8:00 AM', lastText: '5:00 PM' },
}
const FIRST_BEFORE = 30 // minutes before the first ride
const LAST_BEFORE = 60 // minutes before the last ride
const WINDOW = 10 // the job runs every 5 minutes; this window makes sure one run catches each alert

// BEGIN weather (plain JavaScript on purpose: scripts/weather-alert.test.mjs runs this block)
// The same answer as the app (src/mood.js): the middle of four forecast models. The limits are the same as the pop-up in src/TransitPop.jsx.
// The feels-like temperature stands in for the official heat index (PAGASA calls 42 and above "danger").
const WX_MODELS = ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'gem_seamless']
const HOT = 37
const DANGER = 42
export function readWeather(h) {
  const all = (v) => WX_MODELS.map((m) => h[`${v}_${m}`]?.[0]).filter((x) => x != null)
  const med = (v) => { const a = all(v).sort((x, y) => x - y); return a.length ? (a[(a.length - 1) >> 1] + a[a.length >> 1]) / 2 : undefined }
  const storm = all('weather_code').filter((c) => c === 95 || c === 96 || c === 99).length >= 2
  return { mm: med('precipitation'), feels: med('apparent_temperature'), storm }
}
// which notices the weather calls for: rain starts at 0.5 mm an hour
export function weatherKinds({ mm, feels, storm }) {
  const kinds = []
  if (mm >= 0.5) kinds.push(storm ? 'storm' : 'rain')
  if (feels >= DANGER) kinds.push('danger')
  else if (feels >= HOT) kinds.push('heat')
  return kinds
}
// END weather

const wxMessage = (kind: string, feels: number) => {
  const n = Math.round(feels)
  return {
    rain: { title: 'Rain notice', body: 'It is raining now. Mountain roads can be slippery or blocked: ask the driver if the road is passable before you go.' },
    storm: { title: 'Storm notice', body: 'Thunderstorm now: do not travel up the mountain. Wait for the storm to pass.' },
    heat: { title: 'Heat notice', body: `Very hot: feels like ${n}°C. Ride a tricycle or pedicab instead of walking far. Drink water and rest in the shade.` },
    danger: { title: 'Heat warning', body: `Dangerous heat: feels like ${n}°C. Avoid walking in the sun. Ride a tricycle or pedicab, drink water and rest in the shade.` },
  }[kind]
}

Deno.serve(async () => {
  webpush.setVapidDetails(`mailto:${Deno.env.get('VAPID_SUBJECT')}`, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const now = new Date(Date.now() + 8 * 3600 * 1000) // Bansalan time
  const t = now.getUTCHours() * 60 + now.getUTCMinutes()
  const day = now.toISOString().slice(0, 10)
  const report: string[] = []

  // sends one message to every phone in `subs`, removes the phones that uninstalled or blocked alerts, and says how many got it
  const send = async (subs: { token: string; endpoint: string; p256dh: string; auth: string }[] | null, payload: string) => {
    const results = await Promise.allSettled((subs ?? []).map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)))
    const dead = (subs ?? []).filter((_, i) => { const r = results[i]; return r.status === 'rejected' && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0) })
    if (dead.length) await sb.from('push_subscriptions').delete().in('token', dead.map((d) => d.token))
    return `${results.filter((r) => r.status === 'fulfilled').length}/${subs?.length ?? 0} sent`
  }

  // 8 PM every day: tell everyone who turned alerts on that most pedicabs are gone for the night
  if (t >= 20 * 60 && t < 20 * 60 + WINDOW) {
    const { data: claimed } = await sb.from('alerts_sent').insert({ day, mode: 'night', kind: 'last' }).select()
    if (claimed?.length) {
      const { data: subs } = await sb.from('push_subscriptions').select('token, endpoint, p256dh, auth')
      const payload = JSON.stringify({ title: 'Night notice', body: 'Most pedicabs are not around after 8 PM. A few stay at the 7-Eleven and a hotel until 4 AM. Be careful.', tag: 'night', url: '/#/map' })
      report.push(`night notice: ${await send(subs, payload)}`)
    }
  }

  for (const [mode, m] of Object.entries(MODES)) {
    for (const kind of ['first', 'last'] as const) {
      const at = kind === 'first' ? m.first - FIRST_BEFORE : m.last - LAST_BEFORE
      if (t < at || t >= at + WINDOW) continue
      // claim the alert for today; if it was already claimed, another run sent it
      const { data: claimed } = await sb.from('alerts_sent').insert({ day, mode, kind }).select()
      if (!claimed?.length) continue
      const { data: subs } = await sb.from('push_subscriptions').select('token, endpoint, p256dh, auth').contains('modes', [mode])
      const payload = JSON.stringify(kind === 'first'
        ? { title: `${m.label}: first ride soon`, body: `The first ${m.label.toLowerCase()} leaves at ${m.firstText}, in ${FIRST_BEFORE} minutes.`, tag: `${mode}-first`, url: '/#/towns' }
        : { title: `${m.label}: last ride soon`, body: `The last ${m.label.toLowerCase()} leaves at ${m.lastText}, in 1 hour. Do not get stranded.`, tag: `${mode}-last`, url: '/#/towns' })
      report.push(`${mode} ${kind}: ${await send(subs, payload)}`)
    }
  }

  // weather notices for the phones that picked "Weather": between 5 AM and 9 PM, each kind once a day
  let weather = null
  if (t >= 5 * 60 && t < 21 * 60) {
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=6.79&longitude=125.21&models=${WX_MODELS}&hourly=apparent_temperature,precipitation,weather_code&forecast_hours=1`)
      weather = readWeather((await r.json()).hourly ?? {})
      for (const kind of weatherKinds(weather)) {
        const { data: claimed } = await sb.from('alerts_sent').insert({ day, mode: 'weather', kind }).select()
        if (!claimed?.length) continue
        const { data: subs } = await sb.from('push_subscriptions').select('token, endpoint, p256dh, auth').contains('modes', ['weather'])
        const msg = wxMessage(kind, weather.feels)
        report.push(`weather ${kind}: ${await send(subs, JSON.stringify({ ...msg, tag: `wx-${kind}`, url: '/#/map' }))}`)
      }
    } catch (e) { report.push(`weather: ${(e as Error).message}`) }
  }
  return new Response(JSON.stringify({ day, minute: t, weather, sent: report }), { headers: { 'Content-Type': 'application/json' } })
})
