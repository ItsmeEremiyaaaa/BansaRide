import { supabase } from './auth'

// Counts what people open and search for, so the app maker can see what to improve first. Nothing personal is kept:
// no name, no email, no account, no location. Only the kind of event, a route or search word, and the day.
const seen = new Set()
export function track(kind, ref) {
  if (!supabase || !ref) return
  const key = kind + '|' + ref
  if (seen.has(key)) return // once per visit, so the numbers are not inflated
  seen.add(key)
  supabase.from('events').insert({ kind, ref: String(ref).slice(0, 60) }).then(() => {}, () => {})
}
