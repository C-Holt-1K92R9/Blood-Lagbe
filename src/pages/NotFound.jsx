import { Link } from 'react-router-dom'
import { Drop, House, MagnifyingGlass } from '@phosphor-icons/react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 pt-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
        <Drop size={32} weight="fill" className="text-brand" aria-hidden="true" />
      </div>
      <p className="caption-3 mt-8 uppercase tracking-widest text-faint">404</p>
      <h1 className="heading-4 mt-3">This page does not exist</h1>
      <p className="body-3 mt-3 max-w-md text-mute">
        The link may be old, or the address may be mistyped. Search for a donor, or head back home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/find"
          className="button-md inline-flex items-center gap-2 rounded-2xl bg-brand-solid px-6 py-3 text-onbrand transition-all duration-300 hover:bg-brand-solid-hover active:scale-[0.98]"
        >
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
          Find blood now
        </Link>
        <Link
          to="/"
          className="button-md inline-flex items-center gap-2 rounded-2xl border border-line px-6 py-3 text-strong transition-colors duration-300 hover:bg-lifted"
        >
          <House size={18} aria-hidden="true" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
