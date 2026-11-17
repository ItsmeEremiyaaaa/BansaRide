import { useEffect, useRef } from 'react'

// Falling rain drawn over the map. It stops when the phone asks for less motion (a soft grey haze stays).
export default function RainOverlay({ night, level = 1, thunder = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf = 0
    const size = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    size()
    const drops = Array.from({ length: level >= 2 ? 300 : 90 }, () => ({ x: Math.random() * 1.2, y: Math.random(), l: (level >= 2 ? 16 : 9) + Math.random() * 16, v: (level >= 2 ? 1100 : 650) + Math.random() * 500 }))
    let last = performance.now()
    const frame = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = night ? 'rgba(190,210,255,.55)' : 'rgba(80,110,160,.5)'; ctx.lineWidth = level >= 2 ? 1.5 : 0.9; ctx.lineCap = 'round'
      ctx.beginPath()
      for (const d of drops) {
        d.y += (d.v * dt) / h; d.x -= (d.v * (level >= 2 ? 0.35 : 0.15) * dt) / w
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
  }, [night, level])
  // lightning: a bright flash, sometimes twice, every few seconds while a thunderstorm is on (never with reduced motion)
  const flash = useRef(null)
  useEffect(() => {
    if (!thunder || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let t
    const strike = () => {
      const el = flash.current
      if (el) {
        const seq = Math.random() < 0.5 ? [0.85, 0.15, 0.7, 0] : [0.9, 0]
        seq.forEach((o, i) => setTimeout(() => { if (flash.current) flash.current.style.opacity = o }, i * 90))
      }
      t = setTimeout(strike, 3500 + Math.random() * 7000)
    }
    t = setTimeout(strike, 1500 + Math.random() * 2500)
    return () => clearTimeout(t)
  }, [thunder])
  return (
    <>
      <canvas ref={ref} className="rain" aria-hidden="true" />
      {thunder && <div ref={flash} className="lightning" aria-hidden="true" />}
    </>
  )
}
