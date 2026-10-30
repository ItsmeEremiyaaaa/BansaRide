import { useEffect, useRef } from 'react'

// Falling rain drawn over the map. It stops when the phone asks for less motion (a soft grey haze stays).
export default function RainOverlay({ night }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf = 0
    const size = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    size()
    const drops = Array.from({ length: 110 }, () => ({ x: Math.random() * 1.2, y: Math.random(), l: 10 + Math.random() * 16, v: 700 + Math.random() * 500 }))
    let last = performance.now()
    const frame = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = night ? 'rgba(190,210,255,.55)' : 'rgba(80,110,160,.5)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round'
      ctx.beginPath()
      for (const d of drops) {
        d.y += (d.v * dt) / h; d.x -= (d.v * 0.22 * dt) / w
        if (d.y > 1.05) { d.y = -0.05; d.x = Math.random() * 1.2 }
        if (d.x < -0.05) d.x = 1.1
        const x = d.x * w, y = d.y * h
        ctx.moveTo(x, y); ctx.lineTo(x + d.l * 0.22, y - d.l)
      }
      ctx.stroke()
      raf = requestAnimationFrame(frame)
    }
    if (!still) raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(size); ro.observe(c)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [night])
  return <canvas ref={ref} className="rain" aria-hidden="true" />
}
