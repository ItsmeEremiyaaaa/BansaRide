// Run with: npm test. Checks the weather rules of the alert server (supabase/functions/send-ride-alerts) without Deno or a network.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../supabase/functions/send-ride-alerts/index.ts', import.meta.url), 'utf8')
const block = src.slice(src.indexOf('// BEGIN weather'), src.indexOf('// END weather')).replace(/export /g, '')
assert.ok(block.length > 100, 'the weather block was not found in index.ts')
const { readWeather, weatherKinds } = new Function(`${block}; return { readWeather, weatherKinds }`)()

const M = ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'gem_seamless']
const hourly = (o) => { const h = {}; for (const [k, arr] of Object.entries(o)) M.forEach((m, i) => { h[`${k}_${m}`] = [arr[i]] }); return h }
const kinds = (o) => weatherKinds(readWeather(hourly(o)))

test('a real answer from the API (a quiet night): no notice', () => {
  const real = JSON.parse(readFileSync(new URL('./fixtures/open-meteo-hourly.json', import.meta.url), 'utf8')).hourly
  const w = readWeather(real)
  assert.ok(Number.isFinite(w.mm) && Number.isFinite(w.feels), 'the real answer must be readable')
  assert.deepEqual(weatherKinds(w), [])
})

test('model drizzle in one model is not rain, and an ordinary hot day is not a notice', () => {
  assert.deepEqual(kinds({ precipitation: [0.3, 0, 0, 0], apparent_temperature: [35, 36, 35, 34], weather_code: [51, 3, 2, 1] }), [])
})

test('very hot, then dangerous heat (only one of the two)', () => {
  assert.deepEqual(kinds({ precipitation: [0, 0, 0, 0], apparent_temperature: [38, 39, 38, 38], weather_code: [1, 1, 1, 1] }), ['heat'])
  assert.deepEqual(kinds({ precipitation: [0, 0, 0, 0], apparent_temperature: [43, 44, 43, 42], weather_code: [1, 1, 1, 1] }), ['danger'])
})

test('rain from 0.5 mm an hour, and a storm only when two models say thunder', () => {
  assert.deepEqual(kinds({ precipitation: [1.2, 1.5, 0.9, 1.0], apparent_temperature: [30, 30, 30, 30], weather_code: [61, 61, 61, 61] }), ['rain'])
  assert.deepEqual(kinds({ precipitation: [3.5, 4, 2.7, 1.2], apparent_temperature: [30, 30, 30, 30], weather_code: [95, 80, 80, 63] }), ['rain'])
  assert.deepEqual(kinds({ precipitation: [3.5, 4, 2.7, 1.2], apparent_temperature: [30, 30, 30, 30], weather_code: [95, 95, 80, 63] }), ['storm'])
})

test('rain and heat together give both notices; missing data gives none', () => {
  assert.deepEqual(kinds({ precipitation: [1, 1, 1, 1], apparent_temperature: [38, 38, 38, 38], weather_code: [61, 61, 61, 61] }), ['rain', 'heat'])
  assert.deepEqual(weatherKinds(readWeather({})), [])
})
