// True inside the installed Android app (Capacitor). The app's files are inside the APK there, so it has no service worker,
// and the website's background push alerts do not exist. On the website this is false and nothing changes.
export const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()

// The sign-in email link opens this address; Android hands it to the app (see the intent filter in AndroidManifest.xml).
export const NATIVE_LOGIN_URL = 'ph.bansaride.app://login'
