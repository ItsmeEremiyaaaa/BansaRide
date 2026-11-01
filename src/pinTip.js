// The small details card shown when the pointer rests on a pin (mouse or pen): name, what it is, if drivers are around, how far.
export const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
export const canHover = () => typeof matchMedia === 'function' && matchMedia('(hover: hover)').matches
export function pinTipHtml(k, me) {
  if (!k?.title) return ''
  const m = me && k.lat != null ? Math.round(Math.hypot((k.lat - me[0]) * 111000, (k.lon - me[1]) * 110500)) : null
  const status = k.closed ? '<b class="pt-s off">Closed now</b>' : k.hoursUnknown ? '<b class="pt-s">Hours not confirmed</b>' : k.kind === 'spot' ? '<b class="pt-s on">Drivers around</b>' : ''
  const far = m === null ? '' : `<span class="pt-d">${m < 1000 ? m + ' m' : (m / 1000).toFixed(1) + ' km'} from you · about ${Math.max(1, Math.round(m / 80))} min walk</span>`
  return `<div class="pt"><strong>${esc(k.title)}</strong>${k.sub ? `<span class="pt-k">${esc(k.sub)}</span>` : ''}${status}${far}</div>`
}

// On a phone there is no hover: press and hold a pin to see the card; a quick tap still opens the full details.
export const HOLD_MS = 450
let lastHold = 0
export const markHold = () => { lastHold = Date.now() }
export const justHeld = () => Date.now() - lastHold < 800
