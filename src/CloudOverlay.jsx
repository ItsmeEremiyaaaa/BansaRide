// Soft clouds drifting over the map when the sky is mostly covered. More cloud cover means more and thicker clouds.
// They stand still (and fainter) for people who asked for less motion.
export default function CloudOverlay({ cover = 0, night = false }) {
  if (cover < 40) return null
  const n = cover >= 90 ? 7 : cover >= 70 ? 5 : 3
  const op = Math.min(0.75, 0.25 + cover / 220)
  return (
    <div className={'clouds' + (night ? ' night' : '')} style={{ '--op': op }} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="cloud" style={{ '--i': i, top: `${(i * 37) % 70 + 4}%`, '--w': `${150 + (i * 53) % 130}px`, '--d': `${48 + (i * 17) % 40}s`, '--s': `${-(i * 11) % 40}s` }} />
      ))}
      <span className="cloud-haze" />
    </div>
  )
}
