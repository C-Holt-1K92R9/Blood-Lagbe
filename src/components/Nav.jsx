import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { List, Moon, Sun, X } from '@phosphor-icons/react'
import Logo from './Logo.jsx'

const LINKS = [
  { label: 'Find blood', to: '/find' },
  { label: 'Become a donor', to: '/register' },
  { label: 'FAQ', hash: '#faq' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  )
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('bl-theme', next ? 'dark' : 'light')
    } catch {
      /* private mode */
    }
  }

  const goFaq = (e) => {
    e.preventDefault()
    setOpen(false)
    if (location.pathname !== '/') {
      navigate('/#faq')
      return
    }
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const linkClass = ({ isActive }) =>
    `title-4 rounded-lg px-3 py-2 transition-colors duration-300 ease-out ${
      isActive ? 'text-strong bg-lifted' : 'text-mute hover:text-strong'
    }`

  return (
    <>
      <header className="fixed top-3 sm:top-4 left-1/2 z-50 w-[min(1120px,calc(100%-1.5rem))] -translate-x-1/2">
        <div
          className="flex h-14 items-center justify-between gap-2 rounded-2xl border border-line px-3 sm:px-4 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          style={{ background: 'var(--nav-surface)' }}
        >
          <Link to="/" className="flex items-center gap-2 rounded-lg" aria-label="Blood Lagbe home">
            <Logo className="h-7 w-7" />
            <span className="title-3 tracking-tight text-strong">Blood Lagbe</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <NavLink to="/find" className={linkClass}>
              Find blood
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Become a donor
            </NavLink>
            <a href="/#faq" onClick={goFaq} className="title-4 rounded-lg px-3 py-2 text-mute transition-colors duration-300 ease-out hover:text-strong">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-mute transition-colors duration-300 ease-out hover:bg-lifted hover:text-strong active:scale-[0.98]"
            >
              {dark ? <Sun size={19} weight="regular" /> : <Moon size={19} weight="regular" />}
            </button>
            <Link
              to="/find"
              className="button-sm hidden items-center rounded-xl bg-brand-solid px-4 py-2 text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98] sm:inline-flex"
            >
              Find blood now
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg text-strong transition-colors duration-300 hover:bg-lifted md:hidden"
            >
              <span
                className={`block h-[1.5px] w-5 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open ? 'translate-y-[3.25px] rotate-45' : ''
                }`}
              />
              <span
                className={`block h-[1.5px] w-5 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open ? '-translate-y-[3.25px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile full height panel */}
        {open && (
          <div
            id="mobile-menu"
            className="fixed inset-0 top-0 z-[-1] flex flex-col justify-end pt-20 md:hidden"
            style={{ background: 'var(--panel-surface)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}
          >
            <nav className="flex flex-col gap-1 px-6 pb-16" aria-label="Menu">
              {LINKS.map((link, i) => {
                const delay = `${i * 60}ms`
                const common = 'heading-6 py-3 text-strong animate-rise'
                const style = { animationDelay: delay }
                if (link.hash) {
                  return (
                    <a key={link.label} href={`/${link.hash}`} onClick={goFaq} className={common} style={style}>
                      {link.label}
                    </a>
                  )
                }
                return (
                  <Link key={link.label} to={link.to} className={common} style={style}>
                    {link.label}
                  </Link>
                )
              })}
              <Link
                to="/find"
                className="button-lg mt-4 flex items-center justify-center rounded-2xl bg-brand-solid px-6 py-4 text-onbrand animate-rise active:scale-[0.98]"
                style={{ animationDelay: '180ms' }}
              >
                Find blood now
              </Link>
              <p className="caption-5 mt-6 text-center text-faint" style={{ animationDelay: '240ms' }}>
                Always free for seekers. Donors donate voluntarily.
              </p>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
