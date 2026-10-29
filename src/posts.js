import { supabase } from './auth'

// Fare reports and short comments, kept in Supabase. Names and text are filtered here and again in the database.
const COLUMN = { routeId: 'route_id', placeId: 'place_id', stationId: 'station_id' }
const column = (scope) => Object.keys(COLUMN).find((k) => scope[k])

// What the database says when it refuses something, in plain words.
const WORDS = {
  need_name: 'Add your display name in Account first.',
  too_many: 'You have posted a lot today. Try again tomorrow.',
  bad_fare: 'Check the price and who paid it.',
  bad_comment: 'Write 3 to 140 characters.',
  comment_not_allowed: 'Please keep it respectful, with no links or phone numbers.',
  name_not_allowed: 'Please choose a respectful name.',
  name_length: 'Use 3 to 20 characters for your name.',
  sign_in: 'Sign in first.',
}
export const friendly = (message = '') => Object.entries(WORDS).find(([k]) => message.includes(k))?.[1] ?? 'Something went wrong. Try again.'

export async function loadPosts(scope) {
  if (!supabase) return []
  const col = COLUMN[column(scope)]
  const { data, error } = await supabase.from('posts').select('id, user_id, author_name, kind, passenger, paid, body, created_at')
    .eq(col, scope[column(scope)]).order('created_at', { ascending: false }).limit(40)
  if (error) throw error
  return data
}
export async function addPost(userId, scope, fields) {
  const col = COLUMN[column(scope)]
  const { error } = await supabase.from('posts').insert({ user_id: userId, [col]: scope[column(scope)], ...fields })
  if (error) throw error
}
export const deletePost = (id) => supabase.from('posts').delete().eq('id', id)
export async function reportPost(id) {
  const { error } = await supabase.rpc('report_post', { p: id })
  if (error) throw error
}
