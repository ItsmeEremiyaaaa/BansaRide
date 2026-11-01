import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/nunito'
import '@fontsource-variable/baloo-2'
import './styles.css'
import './liveData' // the admin's saved changes (fares, BTODA groups, spots) apply before the first screen
import App from './App.jsx'
import { AuthProvider } from './auth'
import { isNative } from './native'

// Saves the app on the phone so it keeps working without signal. Only in the real build: while developing, an old
// saved copy used to hide new changes, so any saved copy is removed and the page reloads once.
// In the installed Android app the files are inside the app itself, so there is no service worker at all.
if (isNative) { /* nothing to save: the app is already on the phone */ } else if (import.meta.env.PROD) registerSW({ immediate: true })
else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async (regs) => {
    if (!regs.length) return
    await Promise.all(regs.map((r) => r.unregister()))
    if (window.caches) await Promise.all((await caches.keys()).filter((k) => !k.includes('osm-tiles')).map((k) => caches.delete(k)))
    window.location.reload()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
