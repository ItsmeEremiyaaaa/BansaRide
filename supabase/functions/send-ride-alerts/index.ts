// @ts-nocheck - this file runs on Supabase (Deno), not Node. VS Code checks it as Node, so it shows false errors for Deno and npm: imports.
// Sends the two ride alerts: 30 minutes before the first ride and 1 hour before the last ride, for the big bus, van and mini bus.
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

Deno.serve(async () => {
  webpush.setVapidDetails(`mailto:${Deno.env.get('VAPID_SUBJECT')}`, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const now = new Date(Date.now() + 8 * 3600 * 1000) // Bansalan time
  const t = now.getUTCHours() * 60 + now.getUTCMinutes()
  const day = now.toISOString().slice(0, 10)
  const report: string[] = []

  // 8 PM every day: tell everyone who turned alerts on that most pedicabs are gone for the night
  if (t >= 20 * 60 && t < 20 * 60 + WINDOW) {
    const { data: claimed } = await sb.from('alerts_sent').insert({ day, mode: 'night', kind: 'last' }).select()
    if (claimed?.length) {
      const { data: subs } = await sb.from('push_subscriptions').select('token, endpoint, p256dh, auth')
      const payload = JSON.stringify({ title: 'Night notice', body: 'Most pedicabs are not around after 8 PM. A few stay at the 7-Eleven and a hotel until 4 AM. Be careful.', tag: 'night', url: '/#/map' })
      const results = await Promise.allSettled((subs ?? []).map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)))
      const dead = (subs ?? []).filter((_, i) => { const r = results[i]; return r.status === 'rejected' && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0) })
      if (dead.length) await sb.from('push_subscriptions').delete().in('token', dead.map((d) => d.token))
      report.push(`night notice: ${results.filter((r) => r.status === 'fulfilled').length}/${subs?.length ?? 0} sent`)
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
      const results = await Promise.allSettled((subs ?? []).map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)))
      // a phone that uninstalled or blocked alerts is removed
      const dead = (subs ?? []).filter((_, i) => { const r = results[i]; return r.status === 'rejected' && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0) })
      if (dead.length) await sb.from('push_subscriptions').delete().in('token', dead.map((d) => d.token))
      report.push(`${mode} ${kind}: ${results.filter((r) => r.status === 'fulfilled').length}/${subs?.length ?? 0} sent`)
    }
  }
  return new Response(JSON.stringify({ day, minute: t, sent: report }), { headers: { 'Content-Type': 'application/json' } })
})
