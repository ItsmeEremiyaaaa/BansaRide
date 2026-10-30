import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'BansaRide',
        short_name: 'BansaRide',
        description: 'Ride and fare guide for Bansalan, Davao del Sur',
        theme_color: '#F4B400',
        background_color: '#F2F2F6',
        id: '/',
        scope: '/',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'en-PH',
        categories: ['travel', 'navigation', 'transportation'],
        // long-press the app icon for quick links
        shortcuts: [
          { name: 'Map', short_name: 'Map', url: '/#/map', icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Routes', short_name: 'Routes', url: '/#/routes', icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Fare list', short_name: 'Fares', url: '/#/farelist', icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
        ],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        importScripts: ['push-sw.js'], // shows ride alerts sent by the server
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,pmtiles}'], // the Bansalan map file is saved too, so the map works offline
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Saves the map pictures people have viewed, so those places still show offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
