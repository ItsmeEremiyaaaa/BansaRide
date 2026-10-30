import { useEffect, useRef } from 'react'

// Only one popover, panel or card is open at a time: opening one tells the others to close.
const listeners = new Set()
const announce = (id) => listeners.forEach((f) => f(id))

export function useExclusive(id, open, close) {
  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => { if (open) announce(id) }, [open, id])
  useEffect(() => {
    const f = (who) => { if (who !== id) closeRef.current() }
    listeners.add(f)
    return () => { listeners.delete(f) }
  }, [id])
}
