// Added to the app's service worker. It shows a ride alert when the server sends one, even if the app is closed.
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data.json() } catch { /* an empty push still shows a basic alert */ }
  event.waitUntil(self.registration.showNotification(data.title || 'BansaRide', {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: data.tag,
    data: { url: data.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    for (const w of windows) { if ('focus' in w) { w.navigate?.(url); return w.focus() } }
    return self.clients.openWindow(url)
  }))
})
