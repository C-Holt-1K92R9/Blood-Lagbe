import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Medal } from '@phosphor-icons/react'
import { api } from '../lib/api.js'

export default function HonoraryDonors() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api('/honorary-donors')
      .then((data) => {
        if (active) setDonors(data.donors)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-line bg-brand-soft p-6 sm:p-8">
          <p className="caption-3 uppercase tracking-widest text-brand">Community recognition</p>
          <h1 className="heading-4 mt-2">Honorary Donors</h1>
          <p className="body-6 mt-3 max-w-2xl text-mute">
            With permission, we recognize donors who are active or have completed a confirmed donation. Only names and
            donation counts appear here; contact details and locations stay private.
          </p>
        </div>

        {error && <p className="mt-5 rounded-xl border border-brand/20 bg-brand-soft p-4 caption-2 text-brand" role="alert">{error}</p>}
        {loading ? (
          <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading honorary donors">
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl border border-line bg-raised" />)}
          </div>
        ) : donors.length === 0 && !error ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-raised px-6 py-12 text-center">
            <Medal size={34} weight="duotone" className="mx-auto text-faint" aria-hidden="true" />
            <p className="title-3 mt-3">The wall is waiting for its first volunteer</p>
            <p className="caption-2 mt-2 text-mute">Donors can opt in from their profile page.</p>
            <Link to="/register" className="button-sm mt-5 inline-flex rounded-xl bg-brand-solid px-4 py-2.5 text-onbrand hover:bg-brand-solid-hover">
              Become a donor
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {donors.map((donor, index) => (
              <li key={`${donor.name}-${index}`} className="flex items-center gap-4 rounded-xl border border-line bg-raised p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-good-soft text-good" aria-hidden="true">
                  <Medal size={22} weight="fill" />
                </span>
                <div>
                  <p className="title-4">{donor.name}</p>
                  <p className="caption-5 mt-1 text-mute">
                    {donor.donationCount} {donor.donationCount === 1 ? 'confirmed donation' : 'confirmed donations'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
