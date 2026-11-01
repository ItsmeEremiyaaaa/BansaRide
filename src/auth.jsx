import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { isNative, NATIVE_LOGIN_URL } from './native'

// Accounts are optional. A guest can use the whole app. A signed-in, verified student, senior or PWD gets their own
// discounted fare everywhere. We keep only the passenger type, the school or the kind of ID. No photos, no ID numbers.
// A build setting pasted as "NAME=value", or with a stray space, must not crash the whole app: it is cleaned, and a value that
// still does not work just switches accounts off.
const clean = (v) => String(v ?? '').trim().replace(/^[A-Z_]+=/, '')
const url = clean(import.meta.env.VITE_SUPABASE_URL)
const anon = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)
export const supabase = (() => {
  if (!url || !anon) return null
  try { return createClient(url, anon, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } }) } catch { return null }
})()

export const GOV_IDS = ['PhilSys National ID', 'Senior Citizen (OSCA) ID', 'PWD ID', "Driver's license", 'Passport', 'UMID', 'SSS ID', 'PRC ID', "Voter's ID", 'Postal ID', 'Other government ID']
export const KINDS = [
  { id: 'elementary', label: 'Elementary', student: true },
  { id: 'highschool', label: 'High school', student: true },
  { id: 'college', label: 'College', student: true },
  { id: 'senior', label: 'Senior citizen', needsId: true },
  { id: 'pwd', label: 'PWD', needsId: true },
  { id: 'regular', label: 'Regular' },
]
const LOCAL = 'bansaride.profile.v1'
const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL)) ?? null } catch { return null } }
const writeLocal = (p) => { try { localStorage.setItem(LOCAL, JSON.stringify(p)) } catch { /* storage is optional */ } }

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(readLocal)
  const [ready, setReady] = useState(!supabase)
  const [isAdmin, setIsAdmin] = useState(false) // shows the Admin menu row; the database still checks every admin call

  useEffect(() => {
    if (!supabase) return
    const sync = async (session) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u) setIsAdmin(false)
      else supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true), () => setIsAdmin(false))
      if (u) {
        const { data } = await supabase.from('profiles').select('*').eq('user_id', u.id).maybeSingle()
        if (data) { const p = { passenger: data.passenger, school: data.school ?? '', idType: data.id_type ?? '', displayName: data.display_name ?? '' }; setProfile(p); writeLocal(p) }
      }
      setReady(true)
    }
    supabase.auth.getSession().then(({ data }) => sync(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { sync(session) })
    // In the Android app the sign-in email link opens ph.bansaride.app://login?code=...; the app finishes the sign-in with it.
    let off = null
    if (isNative) {
      import('@capacitor/app').then(({ App }) => App.addListener('appUrlOpen', ({ url }) => {
        try { const code = new URL(url).searchParams.get('code'); if (code) supabase.auth.exchangeCodeForSession(code) } catch { /* not a sign-in link */ }
      })).then((h) => { off = h }, () => {})
    }
    return () => { sub.subscription.unsubscribe(); off?.remove() }
  }, [])

  // An email link signs in and verifies the email at the same time.
  const sendLink = useCallback(async (email) => {
    if (!supabase) return { error: 'Sign-in is not switched on yet.' }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: isNative ? NATIVE_LOGIN_URL : window.location.origin + window.location.pathname } })
    // Supabase sends only a few sign-in emails an hour; say so plainly instead of its technical message
    if (error && /rate limit|too many/i.test(error.message)) return { error: 'Too many sign-in emails were sent just now. Use the link already in your email, or try again in about an hour.' }
    return { error: error?.message ?? null }
  }, [])
  // Admins can also sign in with a password (set when the account is made in the Supabase dashboard), so no email is needed.
  const signInPassword = useCallback(async (email, password) => {
    if (!supabase) return { error: 'Sign-in is not switched on yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error && /invalid/i.test(error.message)) return { error: 'Wrong email or password.' }
    return { error: error?.message ?? null }
  }, [])
  const signOut = useCallback(async () => { if (supabase) await supabase.auth.signOut(); setUser(null) }, [])
  const saveProfile = useCallback(async (p) => {
    setProfile(p); writeLocal(p)
    if (supabase && user) {
      const row = { user_id: user.id, passenger: p.passenger, school: p.school || null, id_type: p.idType || null, updated_at: new Date().toISOString() }
      let { error } = await supabase.from('profiles').upsert({ ...row, display_name: p.displayName?.trim() || null })
      // the display-name column comes with the community database update; until then save the rest
      if (error && /display_name/.test(error.message)) ({ error } = await supabase.from('profiles').upsert(row))
      return { error: error?.message ?? null }
    }
    return { error: null }
  }, [user])

  const verified = !!user?.email_confirmed_at || !!user?.confirmed_at
  const kind = KINDS.find((k) => k.id === profile?.passenger)
  const complete = !!kind && (!kind.student || !!profile?.school) && (!kind.needsId || !!profile?.idType)
  // With accounts switched on, the discount needs a verified sign-in. Without them (testing), it applies from the phone.
  const discount = complete && (supabase ? verified : true) && kind.id !== 'regular' ? kind.id : null
  const value = useMemo(() => ({ user, profile, ready, verified, kind, complete, discount, configured: !!supabase, isAdmin, sendLink, signInPassword, signOut, saveProfile }),
    [user, profile, ready, verified, kind, complete, discount, isAdmin, sendLink, signInPassword, signOut, saveProfile])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
