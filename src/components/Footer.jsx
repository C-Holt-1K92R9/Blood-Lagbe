import { Link, useLocation } from 'react-router-dom'
import { Siren } from '@phosphor-icons/react'
import Logo from './Logo.jsx'

export default function Footer() {
  const { pathname } = useLocation()

  if (pathname === '/') return null

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link to="/" className="flex w-fit items-center gap-2 rounded-lg" aria-label="Blood Lagbe home">
              <Logo className="h-7 w-7" />
              <span className="title-2 tracking-tight">Blood Lagbe</span>
            </Link>
            <p className="body-6 mt-4 max-w-xs text-mute">
              Connecting families in an emergency with donors who are nearby, verified and available right now.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-raised p-4">
              <Siren size={20} className="mt-0.5 shrink-0 text-brand" weight="regular" aria-hidden="true" />
              <p className="caption-2 text-mute">
                Life threatening emergency? Call <span className="font-semibold text-strong">999</span> or go to the
                nearest hospital first. Blood Lagbe is not a substitute for emergency medical care.
              </p>
            </div>
          </div>

          <nav className="md:col-span-2" aria-label="Product">
            <p className="caption-3 uppercase tracking-wider text-faint">Product</p>
            <ul className="mt-3 space-y-3">
              <li><Link to="/find" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Find blood</Link></li>
              <li><Link to="/emergency" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Emergency board</Link></li>
              <li><Link to="/register" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Become a donor</Link></li>
              <li><Link to="/login" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Donor sign in</Link></li>
            </ul>
          </nav>

          <nav className="md:col-span-3" aria-label="Company">
            <p className="caption-3 uppercase tracking-wider text-faint">Company</p>
            <ul className="mt-3 space-y-3">
              <li><a href="mailto:hello@bloodlagbe.com.bd" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">hello@bloodlagbe.com.bd</a></li>
              <li><a href="mailto:partners@bloodlagbe.com.bd" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Partner with us</a></li>
              <li><a href="mailto:trust@bloodlagbe.com.bd" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Report a concern</a></li>
            </ul>
          </nav>

          <nav className="md:col-span-3" aria-label="Legal">
            <p className="caption-3 uppercase tracking-wider text-faint">Legal</p>
            <ul className="mt-3 space-y-3">
              <li><Link to="/privacy" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Privacy policy</Link></li>
              <li><Link to="/terms" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Terms of use</Link></li>
              <li><Link to="/terms#donations" className="caption-1 text-mute transition-colors duration-300 hover:text-strong">Donation disclaimer</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="caption-5 text-faint">© 2026 Blood Lagbe. Dhaka pilot, Bangladesh.</p>
          <p className="caption-5 text-faint">Dhaka pilot · 14 districts</p>
        </div>
      </div>
    </footer>
  )
}
