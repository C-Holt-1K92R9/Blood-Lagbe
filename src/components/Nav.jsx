import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { List, Moon, Sun, UserCircle, X } from '@phosphor-icons/react'
import Logo from './Logo.jsx'
import { useAuth } from '../lib/session.jsx'

const LINKS = [
  { label: 'Find blood', to: '/find' },
  { label: 'Emergency board', to: '/emergency' },
  { label: 'Become a donor', to: '/register' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
  )
  const themeTimer = useRef(null)
  const location = useLocation()
  const { donor, loading } = useAuth()

  useEffect(() => () => window.clearTimeout(themeTimer.current), [])

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
    const root = document.documentElement
    root.classList.add('theme-transition')
    root.classList.toggle('dark', next)
    setDark(next)
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', next ? '#000000' : '#F9F9F5')
    window.clearTimeout(themeTimer.current)
    themeTimer.current = window.setTimeout(() => root.classList.remove('theme-transition'), 550)
    try {
      localStorage.setItem('bl-theme', next ? 'dark' : 'light')
    } catch {
      /* private mode */
    }
  }

  const linkClass = ({ isActive }) =>
    `title-4 rounded-lg px-3 py-2 transition-colors duration-300 ease-out ${
      isActive ? 'text-strong bg-lifted' : 'text-mute hover:text-strong'
    }`

  const accountTo = donor ? '/donor' : '/login'
  const accountLabel = donor ? `${donor.name.split(' ')[0]} · My page` : 'Donor sign in'

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-line px-4 backdrop-blur-xl sm:px-6"
        style={{ backgroundColor: 'var(--nav-surface)' }}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 rounded-lg" aria-label="Blood Lagbe home">
            <Logo className="h-7 w-7" />
            <span className="title-3 tracking-tight text-strong">Blood Lagbe</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-mute transition-colors duration-300 ease-out hover:bg-lifted hover:text-strong active:scale-[0.98]"
            >
              <span
                className={`theme-toggle-icon absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  dark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
                }`}
                aria-hidden="true"
              >
                <Sun size={19} weight="regular" />
              </span>
              <span
                className={`theme-toggle-icon absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  dark ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
                }`}
                aria-hidden="true"
              >
                <Moon size={19} weight="regular" />
              </span>
            </button>

            {!loading && (
              <Link
                to={accountTo}
                className="button-sm hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-strong transition-colors duration-300 ease-out hover:border-brand hover:text-brand sm:inline-flex"
              >
                <UserCircle size={17} aria-hidden="true" />
                {accountLabel}
              </Link>
            )}

            <Link
              to="/find"
              className="button-sm hidden items-center rounded-xl bg-brand-solid px-4 py-2 text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98] lg:inline-flex"
            >
              Find blood now
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-[5px] overflow-hidden rounded-lg text-strong transition-colors duration-300 hover:bg-lifted md:hidden"
            >
              <span
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                }`}
                aria-hidden="true"
              >
                <X size={20} />
              </span>
              <span
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                  open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                }`}
                aria-hidden="true"
              >
                <List size={20} />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile full-height menu panel */}
        {open && (
          <div
            id="mobile-menu"
            className="fixed inset-x-0 top-16 z-40 flex h-[calc(100dvh-4rem)] flex-col overflow-y-auto bg-canvas pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
          >
            <nav className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-6" aria-label="Menu">
              {LINKS.map((link, i) => {
                const delay = `${i * 60}ms`
                return (
                  <Link key={link.to} to={link.to} className="heading-6 py-3 text-strong animate-rise" style={{ animationDelay: delay }}>
                    {link.label}
                  </Link>
                )
              })}
              <Link
                to={accountTo}
                className="title-2 mt-1 flex items-center gap-2 py-3 text-strong animate-rise"
                style={{ animationDelay: '180ms' }}
              >
                <UserCircle size={20} aria-hidden="true" />
                {accountLabel}
              </Link>
              <Link
                to="/find"
                className="button-lg mt-4 flex items-center justify-center rounded-2xl bg-brand-solid px-6 py-4 text-onbrand animate-rise active:scale-[0.98]"
                style={{ animationDelay: '240ms' }}
              >
                Find blood now
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
