// Makes the source pictures for the Android launcher icon and splash screen from public/logo.svg (white tricycle).
// Then: npx capacitor-assets generate --android --assetPath assets
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
mkdirSync('assets', { recursive: true })
const svg = readFileSync('public/logo.svg', 'utf8')
const bare = svg.replace(/<rect width="512" height="512" fill="#FFFFFF"\/>/, '') // the tricycle alone, no background
if (bare === svg) throw new Error('logo background not found')
// the tricycle trimmed to its own outline, scaled so its width is `w` pixels
const trike = async (w) => sharp(await sharp(Buffer.from(bare), { density: 300 }).resize(2048, 2048).png().toBuffer()).trim().resize({ width: w }).png().toBuffer()
const put = async (file, W, bg, size) => sharp({ create: { width: W, height: W, channels: 4, background: bg } }).composite([{ input: await trike(size), gravity: 'centre' }]).png().toFile(file)
// launcher icon: white background, the tricycle in the middle (the foreground stays inside the safe circle)
await put('assets/icon-only.png', 1024, '#ffffff', 780)
await put('assets/icon-foreground.png', 1024, { r: 0, g: 0, b: 0, alpha: 0 }, 560)
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#ffffff' } }).png().toFile('assets/icon-background.png')
// splash: the tricycle on the BansaRide yellow
await put('assets/splash.png', 2732, '#f4b400', 760)
await put('assets/splash-dark.png', 2732, '#f4b400', 760)
console.log('art ready')
