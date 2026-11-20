import { useEffect, useMemo, useState } from 'react'
import {
  CaretDown,
  CheckCircle,
  Drop,
  MapPin,
  PhoneCall,
  Siren,
  Target,
  UsersThree,
  PaperPlaneTilt,
  Crosshair,
} from '@phosphor-icons/react'
import { BLOOD_GROUPS, COMPONENTS, DONORS } from '../data.js'
import DonorMap from '../components/DonorMap.jsx'

const RADIUS_OPTIONS = [2, 5, 10]

export default function FindBlood() {
  const [group, setGroup] = useState(null)
  const [component, setComponent] = useState('Whole blood')
  const [hospital, setHospital] = useState('')
  const [location, setLocation] = useState('Dhanmondi, Dhaka 1205')
  const [radius, setRadius] = useState(5)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('idle') // idle | loading | done
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [requestedIds, setRequestedIds] = useState([])
  const [blastSent, setBlastSent] = useState(false)

  const results = useMemo(() => {
    if (phase !== 'done') return []
    return DONORS.filter((d) => (group ? d.group === group : true))
      .filter((d) => d.components.includes(component))
      .filter((d) => d.km <= radius)
      .filter((d) => (onlyAvailable ? d.available : true))
      .sort((a, b) => a.km - b.km)
  }, [phase, group, component, radius, onlyAvailable])

  useEffect(() => {
    if (selectedId && !results.some((d) => d.id === selectedId)) setSelectedId(null)
  }, [results, selectedId])

  const search = (e) => {
    e.preventDefault()
    if (!group) {
      setError('Pick a blood group first.')
      return
    }
    setError('')
    setPhase('loading')
    setBlastSent(false)
    window.setTimeout(() => setPhase('done'), 950)
  }

  const requestDonor = (id) => setRequestedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))

  const selected = results.find((d) => d.id === selectedId) || null

  return (
    <div className="min-h-screen bg-canvas pt-20 sm:pt-20">
      {/* emergency strip */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-brand-soft px-4 py-3">
          <p className="caption-2 flex items-center gap-2 text-strong">
            <Siren size={18} weight="fill" className="shrink-0 text-brand" aria-hidden="true" />
            Life threatening emergency? Call an ambulance first, then search.
          </p>
          <a href="tel:999" className="button-sm flex items-center gap-2 rounded-lg bg-brand-solid px-3 py-1.5 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover">
            <PhoneCall size={15} weight="bold" aria-hidden="true" />
            Call 999
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="caption-3 uppercase tracking-widest text-brand">Emergency network</p>
            <h1 className="heading-5 mt-1">Find a matching blood donor</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="caption-4 rounded-full border border-line bg-surface px-3 py-1.5 text-mute">Dhaka pilot</span>
            <span className="caption-4 rounded-full border border-good/20 bg-good-soft px-3 py-1.5 text-good">Live availability</span>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        {/* ------------- search panel ------------- */}
        <form onSubmit={search} className="h-fit rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-4">
          <p className="caption-3 uppercase tracking-widest text-brand">Emergency request</p>
          <h1 className="heading-5 mt-2">Find blood near you</h1>

          <fieldset className="mt-6">
            <legend className="title-4 mb-2 flex items-center gap-2">
              Blood group <span className="text-brand" aria-hidden="true">*</span>
            </legend>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Blood group">
              {BLOOD_GROUPS.map((g) => {
                const active = group === g
                return (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setGroup(g)
                      setError('')
                    }}
                    className={`button-md h-11 rounded-xl border transition-all duration-300 ease-out active:scale-[0.97] ${
                      active
                        ? 'border-brand-solid bg-brand-solid text-onbrand'
                        : 'border-line bg-surface font-mono text-strong hover:border-brand hover:text-brand'
                    }`}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
            {error && (
              <p className="caption-2 mt-2 flex items-center gap-1.5 text-brand" role="alert">
                <span aria-hidden="true">!</span> {error}
              </p>
            )}
          </fieldset>

          <fieldset className="mt-5">
            <legend className="title-4 mb-2">What is needed</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Component">
              {COMPONENTS.map((c) => {
                const active = component === c
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setComponent(c)}
                    className={`button-sm rounded-lg border px-3 py-2 transition-all duration-300 ease-out active:scale-[0.97] ${
                      active ? 'border-brand-solid bg-brand-soft text-brand-hover' : 'border-line bg-surface text-mute hover:text-strong'
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-5">
            <label htmlFor="hospital" className="title-4 mb-2 block">
              Hospital or landmark
            </label>
            <input
              id="hospital"
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="e.g. Ananda Nursing Home, Dhanmondi"
              className="body-3 h-11 w-full rounded-xl border border-line bg-surface px-3 placeholder:text-faint focus:border-brand focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="loc" className="title-4 mb-2 block">
              Donor search origin
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
                <input
                  id="loc"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="body-3 h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-3 focus:border-brand focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setLocation('Dhanmondi, Dhaka 1205')}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-mute transition-colors duration-300 hover:text-strong active:scale-[0.97]"
                aria-label="Use my current location"
                title="Use my current location"
              >
                <Crosshair size={17} aria-hidden="true" />
                <span className="caption-4 hidden sm:inline">Locate me</span>
              </button>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="title-4 mb-2">Search radius</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Radius">
              {RADIUS_OPTIONS.map((r) => {
                const active = radius === r
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRadius(r)}
                    className={`button-sm h-9 rounded-lg font-mono transition-all duration-300 ease-out ${
                      active ? 'bg-raised text-strong shadow-sm' : 'text-mute hover:text-strong'
                    }`}
                  >
                    {r} km
                  </button>
                )
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            className="button-md mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-solid text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98]"
          >
            {phase === 'loading' ? 'Searching donors…' : 'Search donors'}
          </button>
        </form>

        {/* ------------- map + results ------------- */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="dot-grid relative h-56 overflow-hidden rounded-2xl border border-line sm:h-72">
            <DonorMap donors={phase === 'done' ? results : []} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          {phase === 'idle' && (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
              <Drop size={34} weight="duotone" className="text-faint" aria-hidden="true" />
              <p className="title-2 mt-4">Results appear here</p>
              <p className="body-6 mt-2 max-w-sm text-mute">
                Pick a blood group and press Search donors. Matching donors, distances and one tap calling show up.
              </p>
            </div>
          )}

          {phase === 'loading' && (
            <div className="space-y-3" aria-busy="true" aria-label="Searching donors">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-line bg-raised p-4">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-lifted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-lifted" />
                    <div className="h-3 w-56 animate-pulse rounded bg-lifted" />
                  </div>
                  <div className="h-9 w-20 animate-pulse rounded-lg bg-lifted" />
                </div>
              ))}
            </div>
          )}

          {phase === 'done' && (
            <div className="flex flex-1 flex-col rounded-2xl border border-line bg-raised">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <p className="title-3">
                  {results.length === 0 ? 'No donors matched' : `${results.length} ${results.length === 1 ? 'donor' : 'donors'} matched`}
                  {group ? <span className="text-mute"> · {group}</span> : null}
                </p>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="h-4 w-4 accent-[#d92d20]"
                  />
                  <span className="caption-2 text-mute">Available only</span>
                </label>
              </div>

              {results.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <Target size={34} weight="duotone" className="text-faint" aria-hidden="true" />
                  <p className="title-2 mt-4">No {group} donors within {radius} km</p>
                  <p className="body-6 mt-2 max-w-sm text-mute">
                    Try a wider radius, different component, or send a request blast so every matching donor in range is
                    notified at once.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {radius < 10 && (
                      <button
                        onClick={() => setRadius(10)}
                        className="button-sm rounded-xl border border-line px-4 py-2 text-strong transition-colors duration-300 hover:bg-lifted"
                      >
                        Expand to 10 km
                      </button>
                    )}
                    <BlastButton sent={blastSent} onSend={() => setBlastSent(true)} />
                  </div>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {results.map((d) => {
                      const requested = requestedIds.includes(d.id)
                      const isSel = d.id === selectedId
                      return (
                        <li
                          key={d.id}
                          onClick={() => setSelectedId(d.id)}
                          className={`flex cursor-pointer flex-wrap items-center gap-4 px-5 py-4 transition-colors duration-300 ${
                            isSel ? 'bg-brand-soft/60' : 'hover:bg-lifted'
                          }`}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                            <span className="font-mono text-sm font-semibold text-brand">{d.group}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="title-4">{d.name}</p>
                              <span className={`caption-5 inline-flex items-center gap-1.5 ${d.available ? 'text-good' : 'text-faint'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${d.available ? 'bg-good' : 'bg-faint'}`} />
                                {d.available ? 'Available now' : 'Unavailable'}
                              </span>
                            </div>
                            <p className="caption-2 mt-0.5 text-mute">
                              {d.area} · <span className="font-mono">{d.km.toFixed(1)} km</span> · last donated {d.lastDonation} · {d.donations} donations
                            </p>
                            <p className="caption-5 mt-1 text-faint">{d.components.join(' · ')}</p>
                            {requested && (
                              <p className="caption-5 mt-2 flex items-center gap-1.5 text-good">
                                <CheckCircle size={14} weight="fill" aria-hidden="true" />
                                Request sent. {d.name.split(' ')[0]} will get an SMS and call you back.
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 sm:flex-row" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`tel:${d.phone.replace(/\s/g, '')}`}
                              className="button-sm flex items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2 text-strong transition-colors duration-300 hover:bg-lifted"
                              aria-label={`Call ${d.name}`}
                            >
                              <PhoneCall size={16} aria-hidden="true" />
                              Call
                            </a>
                            <button
                              type="button"
                              disabled={!d.available || requested}
                              onClick={() => requestDonor(d.id)}
                              className={`button-sm rounded-xl px-4 py-2 transition-all duration-300 ease-out active:scale-[0.98] ${
                                requested
                                  ? 'cursor-default bg-good-soft text-good'
                                  : d.available
                                    ? 'bg-brand-solid text-onbrand hover:bg-brand-solid-hover'
                                    : 'cursor-not-allowed bg-lifted text-faint'
                              }`}
                            >
                              {requested ? 'Requested' : d.available ? 'Request' : 'Unavailable'}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
                    <p className="caption-4 flex items-center gap-2 text-faint">
                      <UsersThree size={16} aria-hidden="true" />
                      None of these work? Blast everyone in range.
                    </p>
                    <BlastButton sent={blastSent} onSend={() => setBlastSent(true)} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-raised shadow-[var(--shadow-card)] xl:sticky xl:top-20">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="caption-3 uppercase tracking-wider text-mute">Current request</p>
            <span className="caption-5 rounded-full bg-brand-soft px-2 py-1 font-mono text-brand">
              {phase === 'done' ? 'Searching' : 'Ready'}
            </span>
          </div>
          <div className="p-4">
            <p className="title-4">{group ? `${group} blood needed` : 'Choose a blood group'}</p>
            <p className="caption-2 mt-1 text-mute">
              {component} · within {radius} km
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="caption-5 text-faint">Matches</dt>
                <dd className="font-mono text-lg font-semibold text-strong">{phase === 'done' ? results.length : '—'}</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="caption-5 text-faint">Available</dt>
                <dd className="font-mono text-lg font-semibold text-good">
                  {phase === 'done' ? results.filter((d) => d.available).length : '—'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-brand/15 bg-brand-soft p-3">
              <p className="caption-3 text-brand">Response tips</p>
              <ul className="mt-2 space-y-2 caption-5 text-mute">
                <li>Call only donors marked available.</li>
                <li>Confirm hospital and blood component.</li>
                <li>Use request blast if none respond.</li>
              </ul>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="caption-4 text-faint">Emergency support</p>
              <a href="tel:999" className="button-sm mt-2 flex h-10 items-center justify-center rounded-xl border border-line bg-surface text-strong transition-colors hover:border-brand hover:text-brand">
                Call ambulance · 999
              </a>
            </div>
          </div>
        </aside>
        </div>
      </div>

      {selected && (
        <p className="mx-auto max-w-6xl px-4 pb-8 font-mono text-xs text-faint sm:px-6" aria-live="polite">
          Selected: {selected.name} · {selected.area} · {selected.km.toFixed(1)} km · {selected.group}
          <CaretDown size={12} className="ml-1 inline rotate-90" aria-hidden="true" />
        </p>
      )}
    </div>
  )
}

function BlastButton({ sent, onSend }) {
  if (sent) {
    return (
      <p className="caption-2 flex items-center gap-2 rounded-xl bg-good-soft px-4 py-2 text-good">
        <CheckCircle size={16} weight="fill" aria-hidden="true" />
        Blast sent to all matching donors in range
      </p>
    )
  }
  return (
    <button
      type="button"
      onClick={onSend}
      className="button-sm flex items-center gap-2 rounded-xl border border-brand bg-brand-soft px-4 py-2 text-brand transition-all duration-300 ease-out hover:bg-brand-solid hover:text-onbrand active:scale-[0.98]"
    >
      <PaperPlaneTilt size={16} aria-hidden="true" />
      Send request blast
    </button>
  )
}
