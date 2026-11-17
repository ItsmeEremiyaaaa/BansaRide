// Keeps names and posts clean. The same rules run in the database (supabase/community.sql), so they cannot be skipped.
// [word, wholeWord]: long words are blocked anywhere inside the text, short words only when they stand alone
// (so "putahe", a dish, is fine). Spelling tricks are normalised first: p*ta, pu7a, p u t a, puuuta.
// This list is a start. Someone who speaks Bisaya and Tagalog well should review and extend it.
export const BLOCKED = [
  ['putang', false], ['putangina', false], ['tangina', false], ['tarantado', false], ['pakyu', false], ['punyeta', false],
  ['bwisit', false], ['buwisit', false], ['kantot', false], ['jakol', false], ['pekpek', false], ['demonyo', false],
  ['fuck', false], ['shit', false], ['bitch', false], ['pussy', false], ['nigger', false], ['nigga', false], ['retard', false],
  ['puta', true], ['pota', true], ['gago', true], ['gaga', true], ['ulol', true], ['bobo', true], ['tanga', true], ['inutil', true],
  ['hayop', true], ['leche', true], ['kupal', true], ['lintik', true], ['yawa', true], ['piste', true], ['pisti', true],
  ['puke', true], ['titi', true], ['tite', true], ['tae', true], ['dick', true], ['bastos', true], ['animal', true],
]

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i' }
const dedupe = (s) => s.replace(/(.)\1+/g, '$1')
const norm = (t) => [...t.toLowerCase()].map((c) => LEET[c] ?? c).join('')
const spaced = (t) => ` ${norm(t).replace(/[^a-z]+/g, ' ').trim()} `
const squashed = (t) => dedupe(norm(t).replace(/[^a-z]+/g, ''))

export const hasBlockedWord = (text) => {
  const sp = spaced(text).split(' ').map(dedupe).join(' ')
  const sq = squashed(text)
  return BLOCKED.some(([w, whole]) => (whole ? sp.includes(` ${dedupe(w)} `) : sq.includes(dedupe(w))))
}
const hasContact = (t) => /https?:|www\.|\.(com|net|ph|org)\b|\d[\d\s-]{6,}\d/i.test(t)

// A display name: 3 to 20 letters, numbers, spaces, dots, dashes or apostrophes. No # or @, no links, no bad words.
export const checkName = (name) => {
  const n = (name ?? '').trim()
  if (n.length < 3 || n.length > 20) return 'Use 3 to 20 characters for your name.'
  if (/[#@]/.test(n)) return 'Your name cannot have # or @.'
  if (!/^[\p{L}\p{N} .'_-]+$/u.test(n)) return 'Use letters, numbers, spaces, dots or dashes only.'
  if (hasContact(n)) return 'Your name cannot have links or phone numbers.'
  if (hasBlockedWord(n)) return 'Please choose a respectful name.'
  return null
}
// A comment: up to 140 characters, no links, no phone numbers, no bad words.
export const checkComment = (text) => {
  const t = (text ?? '').trim()
  if (t.length < 3) return 'Write a little more.'
  if (t.length > 140) return 'Keep it to 140 characters.'
  if (hasContact(t) || /[#@]/.test(t)) return 'No links, phone numbers, # or @ please.'
  if (hasBlockedWord(t)) return 'Please keep it respectful.'
  return null
}
