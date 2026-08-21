'use client'

import { useEffect, useRef, useState } from 'react'

/** Animated numeric roll — respects prefers-reduced-motion */
export function CountUp({
  value, decimals = 0, className, duration = 500,
}: { value: number; decimals?: number; className?: string; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      prev.current = value
      return
    }
    const from = prev.current
    const to = value
    if (from === to) return
    const start = performance.now()
    let lastUpdate = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      if (t >= 1) {
        setDisplay(to)
        prev.current = to
        return
      }
      if (now - lastUpdate >= 30) {
        lastUpdate = now
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(from + (to - from) * eased)
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return (
    <span className={`tabular ${className ?? ''}`}>
      {display.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
    </span>
  )
}
