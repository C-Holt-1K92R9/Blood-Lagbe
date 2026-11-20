import { ArrowRight, Drop, Siren } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <section className="flex min-h-[calc(100svh-4rem)] items-center justify-center border-b border-line px-6 pb-8 pt-24 text-center">
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
          <Drop size={26} weight="fill" className="text-brand" aria-hidden="true" />
        </div>
        <h1 className="heading-2 mt-6">
          When every minute counts, help should be one tap away
        </h1>
        <p className="body-3 mx-auto mt-4 max-w-hero text-mute">
          Search for blood donors by blood group and location.
        </p>
        <Link
          to="/find"
          className="button-lg group mx-auto mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-solid px-6 py-3 text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98]"
        >
          Find blood now
          <ArrowRight
            size={20}
            weight="bold"
            className="transition-transform duration-500 ease-out group-hover:translate-x-1"
          />
        </Link>
        <p className="caption-5 mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-faint">
          <Siren size={15} aria-hidden="true" /> Life-threatening emergency? Call 999 first.
        </p>
      </div>
    </section>
  )
}
