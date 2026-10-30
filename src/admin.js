import { supabase } from './auth'

// Everything the admin screen reads and changes. The database checks that the person is an admin for every call
// (see supabase/admin.sql), so these do nothing for anyone else.

// Development only (never in the live app): localStorage 'bansaride.admin.demo' = '1' shows sample data, to check the look.
const DEMO = import.meta.env.DEV && typeof localStorage !== 'undefined' && localStorage.getItem('bansaride.admin.demo') === '1'
const ago = (h) => new Date(Date.now() - h * 3600e3).toISOString()
const SAMPLE = {
  overview: { users: 128, users_week: 14, discount: { college: 41, highschool: 22, senior: 9, pwd: 3 }, posts: 63, hidden: 2, reported: 3, inbox: 5, push: 37, opens_week: 412, top_routes: [{ ref: 'terminal-rizal', n: 96 }, { ref: 'terminal-dolo', n: 71 }, { ref: 'market-newclarin', n: 44 }], missing: [{ ref: 'gaisano', n: 6 }, { ref: 'jollibee', n: 4 }] },
  posts: [
    { id: 'a', author_name: 'Jessa', kind: 'comment', route_id: 'terminal-rizal', body: 'Driver asked for ₱50 at night, is that normal?', status: 'visible', reports: 2, created_at: ago(3) },
    { id: 'b', author_name: 'Mark', kind: 'fare', route_id: 'terminal-dolo', passenger: 'college', paid: 25, status: 'hidden', reports: 3, created_at: ago(20) },
  ],
  inbox: [
    { id: 'x', kind: 'problem', topic: 'Wrong fare', about: 'Bansalan to Rizal', body: 'Student fare is 25 now, not 30.', status: 'new', created_at: ago(1) },
    { id: 'y', kind: 'spot', about: 'near Roxas Street · Public Market 120 m away', lat: 6.78712, lon: 125.21245, status: 'new', created_at: ago(5) },
  ],
  users: [{ user_id: '1', email: 'owner@example.com', display_name: 'Jeremiah', passenger: 'college', school: 'UM Bansalan', created_at: ago(400), last_sign_in_at: ago(2), is_admin: true }, { user_id: '2', email: 'rider@example.com', display_name: null, passenger: 'senior', id_type: 'Senior Citizen (OSCA) ID', created_at: ago(30), last_sign_in_at: ago(26), is_admin: false }],
  words: [{ word: 'bobo', whole: true }, { word: 'putangina', whole: false }, { word: 'tanga', whole: true }],
}
const need = () => { if (!supabase) throw new Error('Accounts are not switched on.') }
const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data }

export const checkAdmin = async () => {
  if (DEMO) return true
  if (!supabase) return false
  const { data, error } = await supabase.rpc('is_admin')
  return !error && data === true
}
export const loadOverview = async () => { if (DEMO) return SAMPLE.overview; need(); return ok(await supabase.rpc('admin_overview')) }
export const loadUsers = async () => { if (DEMO) return SAMPLE.users; need(); return ok(await supabase.rpc('admin_users')) }

export const loadPosts = async (filter) => {
  if (DEMO) return SAMPLE.posts
  need()
  let q = supabase.from('posts').select('id, author_name, kind, route_id, place_id, station_id, passenger, paid, body, status, reports, created_at').order('created_at', { ascending: false }).limit(200)
  if (filter === 'reported') q = q.gt('reports', 0)
  if (filter === 'hidden') q = q.neq('status', 'visible')
  return ok(await q)
}
export const setPostStatus = async (id, status) => { need(); ok(await supabase.from('posts').update(status === 'visible' ? { status, reports: 0 } : { status }).eq('id', id)); if (status === 'visible') ok(await supabase.from('post_reports').delete().eq('post_id', id)) }
export const removePost = async (id) => { need(); ok(await supabase.from('posts').delete().eq('id', id)) }

export const loadInbox = async (status) => { if (DEMO) return status === 'new' ? SAMPLE.inbox : []; need(); return ok(await supabase.from('submissions').select('*').eq('status', status).order('created_at', { ascending: false }).limit(200)) }
export const setInboxStatus = async (id, status) => { need(); ok(await supabase.from('submissions').update({ status }).eq('id', id)) }
export const removeInbox = async (id) => { need(); ok(await supabase.from('submissions').delete().eq('id', id)) }

export const loadWords = async () => { if (DEMO) return SAMPLE.words; need(); return ok(await supabase.from('blocked_words').select('word, whole').order('word')) }
export const addWord = async (word, whole) => { need(); ok(await supabase.from('blocked_words').insert({ word: word.trim().toLowerCase(), whole })) }
export const removeWord = async (word) => { need(); ok(await supabase.from('blocked_words').delete().eq('word', word)) }

// From the app: a problem report or a new waiting spot also goes to the admin inbox. Works for guests too.
export const sendToInbox = async (row) => {
  if (!supabase) return false
  const { error } = await supabase.from('submissions').insert({ ...row, status: 'new' })
  return !error
}
