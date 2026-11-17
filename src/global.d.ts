/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
import 'react'

// CSS variables passed through style, e.g. style={{ '--i': 3 }}
declare module 'react' {
  interface CSSProperties { [key: `--${string}`]: string | number | undefined }
}

// Browser extras the app reads when present, and the test hooks it puts on window.
declare global {
  interface Navigator { standalone?: boolean; deviceMemory?: number }
  interface Window { Capacitor?: any; __bansaNow?: () => number; __bansaMap?: unknown; __map3d?: unknown }
}

export {}
