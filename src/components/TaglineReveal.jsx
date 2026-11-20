import { useEffect, useRef, useState } from 'react'

/**
 * Word by word tagline reveal (B11). Words start muted at ~28% opacity and
 * warm to full color in reading order when the block enters the viewport.
 */
export default function TaglineReveal({ text, className = '' }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  const words = text.split(' ')

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOn(true)
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setOn(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.45, rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(el)
    const fallback = window.setTimeout(() => setOn(true), 1200)
    return () => {
      window.clearTimeout(fallback)
      io.disconnect()
    }
  }, [])

  return (
    <p ref={ref} className={`tagline text-balance ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className={`tagline-word ${on ? 'is-on' : ''}`}
          style={{ '--word-delay': `${i * 90}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </p>
  )
}
