import { useEffect, useRef } from 'react'

/**
 * Scroll reveal: rises 32px and fades in once when the section enters
 * the viewport. Uses IntersectionObserver, never raw scroll events.
 */
export default function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    )
    io.observe(el)
    // Safety net: if the observer never fires (fast captures, odd browsers),
    // reveal anyway so content is never stuck invisible.
    const fallback = window.setTimeout(() => el.classList.add('is-visible'), 1200)
    return () => {
      window.clearTimeout(fallback)
      io.disconnect()
    }
  }, [])

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ '--reveal-delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}
