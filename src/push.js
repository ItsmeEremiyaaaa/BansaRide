import { supabase } from './auth'

// Ride alerts: a phone asks to be told 30 minutes before the first ride and 1 hour before the last ride of the big bus,
// van and mini bus. The phone's push address goes to Supabase; a scheduled job there sends the alerts.
const KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
const TOKEN_KEY = 'bansaride.push.token'
const MODES_KEY = 'bansaride.push.modes'

export const pushSupported = () => !!(KEY && supabase && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)

const toBytes = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}
const token = () => {
  try {
    let t = localStorage.getItem(TOKEN_KEY)
    if (!t) { t = crypto.randomUUID().replace(/-/g, ''); localStorage.setItem(TOKEN_KEY, t) }
    return t
  } catch { return null }
}
export const savedModes = () => { try { return JSON.parse(localStorage.getItem(MODES_KEY)) ?? [] } catch { return [] } }

// the app's service worker only exists in the real build, so wait a moment for it
const registration = () => Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('no-sw')), 4000))])

export async function pushState() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  try {
    const sub = await (await registration()).pushManager.getSubscription()
    return sub && savedModes().length ? 'on' : 'off'
  } catch { return 'no-sw' }
}

// Turn alerts on (asks the phone for permission) or change which rides are picked.
export async function setAlerts(modes) {
  if (!modes.length) return disableAlerts()
  if (Notification.permission !== 'granted' && (await Notification.requestPermission()) !== 'granted') throw new Error('blocked')
  const reg = await registration()
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(KEY) }))
  const j = sub.toJSON()
  const { error } = await supabase.rpc('save_push', { p_token: token(), p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_modes: modes })
  if (error) throw error
  try { localStorage.setItem(MODES_KEY, JSON.stringify(modes)) } catch { /* optional */ }
}

export async function disableAlerts() {
  try { await supabase.rpc('remove_push', { p_token: token() }) } catch { /* the phone side below still turns it off */ }
  try { await (await (await registration()).pushManager.getSubscription())?.unsubscribe() } catch { /* nothing to remove */ }
  try { localStorage.setItem(MODES_KEY, '[]') } catch { /* optional */ }
}

// Shows one alert right now so the person can see that it works.
export async function testAlert() {
  const reg = await registration()
  await reg.showNotification('BansaRide alerts are on', { body: 'You will get a notice 30 minutes before the first ride and 1 hour before the last ride.', icon: '/pwa-192x192.png', badge: '/pwa-64x64.png' })
}
