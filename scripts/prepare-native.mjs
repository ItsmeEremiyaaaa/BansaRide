// Gets the built website ready to go inside the Android app: the admin website and the service worker are not needed there.
import { rmSync, readdirSync } from 'node:fs'
rmSync('dist/admin', { recursive: true, force: true })
for (const f of readdirSync('dist/assets')) if (f.startsWith('adminpage-')) rmSync('dist/assets/' + f)
for (const f of readdirSync('dist')) if (f === 'sw.js' || f.startsWith('workbox-') || f === 'registerSW.js' || f === 'push-sw.js') rmSync('dist/' + f)
console.log('dist is ready for the Android app')
