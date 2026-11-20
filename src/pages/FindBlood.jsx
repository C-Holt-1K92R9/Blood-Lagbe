import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CaretDown,
  CheckCircle,
  Drop,
  EnvelopeSimple,
  MapPin,
  PaperPlaneTilt,
  PhoneCall,
  Siren,
  Target,
  UsersThree,
} from '@phosphor-icons/react'
import { BLOOD_GROUPS, DONATION_LABEL, DONATION_TYPES } from '../data.js'
import { DIVISION_NAMES, citiesOf } from '../../shared/bd.js'
import { api, fieldErrors } from '../lib/api.js'
import { dhakaDateTimeInputValue } from '../lib/geo.js'
import { isBdMobile } from '../lib/phone.js'
import { FormAlert, LocationField, SelectField, TextField, inputClass } from '../components/Form.jsx'

const emptyForm = {
  bloodGroup: '',
  needType: 'blood',
  situation: 'immediate',
  requesterName: '',
  requesterPhone: '',
  requesterEmail: '',
  division: 'Dhaka',
  city: 'Dhaka',
  addressText: '',
  neededAt: '',
}

/* Earliest sensible "later" time, rounded to the datetime-local format. */
const MIN_NEEDED_AT = dhakaDateTimeInputValue(new Date(Date.now() + 5 * 60_000))

const timeLabel = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'As soon as possible'

const lastDonatedLabel = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'Not recorded'

export default function FindBlood() {
  const [form, setForm] = useState(emptyForm)
  const [coords, setCoords] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [phase, setPhase] = useState('idle')
  const [result, setResult] = useState(null)

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const near = useMemo(() => (result?.donors || []).filter((d) => d.withinRadius), [result])
  const sameCity = useMemo(() => (result?.donors || []).filter((d) => !d.withinRadius), [result])

  const validate = () => {
    const next = {}
    if (!form.bloodGroup) next.bloodGroup = 'Pick the blood group the patient needs.'
    if (form.requesterName.trim().length < 2) next.requesterName = 'Enter your name.'
    if (!isBdMobile(form.requesterPhone)) {
      next.requesterPhone = 'Enter a Bangladeshi mobile number, e.g. 01712 345678 or +8801712 345678.'
    }
    if (form.requesterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.requesterEmail.trim())) {
      next.requesterEmail = 'Enter a valid email, or leave it blank.'
    }
    if (!form.division) next.division = 'Pick the division.'
    if (!form.city) next.city = 'Pick the city or district.'
    if (form.addressText.trim().length < 6) next.addressText = 'Write the hospital or address where blood is needed.'
    if (form.situation === 'later' && !form.neededAt) next.neededAt = 'Choose the date and time blood is needed.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setPhase('loading')
    try {
      const data = await api('/requests/search', {
        method: 'POST',
        body: {
          ...form,
          requesterEmail: form.requesterEmail || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        },
      })
      setResult(data)
      setPhase('done')
    } catch (err) {
      const mapped = fieldErrors(err)
      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setServerError(err.message)
      setPhase('idle')
    }
  }

  const reset = () => {
    setForm(emptyForm)
    setCoords(null)
    setErrors({})
    setServerError('')
    setResult(null)
    setPhase('idle')
  }

  const emailsSent = result?.emails?.sent || 0
  const emailsQueued = result?.emails?.queued || 0
  const receiptStatus = result?.emails?.receipt || 'not_requested'

  return (
    <div className="min-h-screen bg-canvas pt-20 sm:pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-brand-soft px-4 py-3">
          <p className="caption-2 flex items-center gap-2 text-strong">
            <Siren size={18} weight="fill" className="shrink-0 text-brand" aria-hidden="true" />
            Life threatening emergency? Call an ambulance first, then search.
          </p>
          <a
            href="tel:999"
            className="button-sm flex items-center gap-2 rounded-lg bg-brand-solid px-3 py-1.5 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover"
          >
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
            <span className="caption-4 rounded-full border border-line bg-surface px-3 py-1.5 text-mute">Bangladesh</span>
            <span className="caption-4 rounded-full border border-good/20 bg-good-soft px-3 py-1.5 text-good">Live availability</span>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          {/* ------------- request form ------------- */}
          <form onSubmit={submit} noValidate className="h-fit rounded-2xl border-2 border-strong bg-raised p-5 shadow-[var(--shadow-card)]">
            <p className="caption-3 uppercase tracking-widest text-brand">Emergency request</p>
            <h2 className="heading-5 mt-2">Find blood near you</h2>

            <fieldset className="mt-5">
              <legend className="title-4 mb-2">
                Blood group <span className="text-brand" aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Blood group">
                {BLOOD_GROUPS.map((g) => {
                  const active = form.bloodGroup === g
                  return (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setForm((f) => ({ ...f, bloodGroup: g }))
                        setErrors((err) => ({ ...err, bloodGroup: undefined }))
                      }}
                      className={`button-md h-10 rounded-lg border transition-all duration-300 ease-out active:scale-[0.97] ${
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
              {errors.bloodGroup && (
                <p className="caption-2 mt-2 text-brand" role="alert">
                  {errors.bloodGroup}
                </p>
              )}
            </fieldset>

            <fieldset className="mt-4">
              <legend className="title-4 mb-2">The patient needs</legend>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="What is needed">
                {DONATION_TYPES.map((type) => {
                  const active = form.needType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setForm((f) => ({ ...f, needType: type.value }))}
                      className={`button-sm rounded-lg border px-3 py-2 transition-all duration-300 ${
                        active ? 'border-brand-solid bg-brand-soft text-brand-hover' : 'border-line bg-surface text-mute hover:text-strong'
                      }`}
                    >
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="title-4 mb-2">When is it needed</legend>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Situation type">
                {[
                  { value: 'immediate', label: 'Immediate' },
                  { value: 'later', label: 'Later' },
                ].map((option) => {
                  const active = form.situation === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setForm((f) => ({ ...f, situation: option.value }))
                        setErrors((err) => ({ ...err, neededAt: undefined }))
                      }}
                      className={`button-sm rounded-lg border px-3 py-2 transition-all duration-300 ${
                        active ? 'border-brand-solid bg-brand-soft text-brand-hover' : 'border-line bg-surface text-mute hover:text-strong'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {form.situation === 'later' && (
                <TextField
                  id="neededAt"
                  label="Date and time"
                  type="datetime-local"
                  required
                  min={MIN_NEEDED_AT}
                  value={form.neededAt}
                  onChange={set('neededAt')}
                  error={errors.neededAt}
                  className="mt-3"
                  hint="Bangladesh time. Donors are emailed this schedule."
                />
              )}

              {form.situation === 'immediate' && (
                <p className="caption-5 mt-2 text-faint">
                  Immediate requests show a call button so you can phone donors directly.
                </p>
              )}
            </fieldset>

            <div className="mt-5 border-t border-line pt-4">
              <p className="caption-3 uppercase tracking-wider text-faint">Your details</p>
              <p className="caption-5 mt-1 text-faint">Donors need these to reach you.</p>
            </div>

            <div className="mt-3 space-y-3">
              <TextField
                id="requesterName"
                label="Your name"
                required
                autoComplete="name"
                value={form.requesterName}
                onChange={set('requesterName')}
                error={errors.requesterName}
                placeholder="e.g. Saurabh Chatterjee"
              />
              <TextField
                id="requesterPhone"
                label="Your phone number"
                type="tel"
                inputMode="numeric"
                required
                autoComplete="tel-national"
                value={form.requesterPhone}
                onChange={set('requesterPhone')}
                error={errors.requesterPhone}
                placeholder="01712 345678"
                className="font-mono"
              />
              <TextField
                id="requesterEmail"
                label="Your email"
                type="email"
                autoComplete="email"
                value={form.requesterEmail}
                onChange={set('requesterEmail')}
                error={errors.requesterEmail}
                placeholder="Optional, for a receipt"
              />
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <p className="caption-3 uppercase tracking-wider text-faint">Where it is needed</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <SelectField
                id="fDivision"
                label="Division"
                required
                value={form.division}
                onChange={(e) => {
                  setForm((f) => ({ ...f, division: e.target.value, city: '' }))
                  setErrors((x) => ({ ...x, division: undefined, city: undefined }))
                }}
                error={errors.division}
              >
                <option value="">Select</option>
                {DIVISION_NAMES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </SelectField>

              <SelectField
                id="fCity"
                label="City"
                required
                value={form.city}
                onChange={set('city')}
                error={errors.city}
                disabled={!form.division}
              >
                <option value="">Select</option>
                {citiesOf(form.division).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="mt-3">
              <label htmlFor="addressText" className="title-4 mb-2 block">
                Hospital or address <span className="text-brand" aria-hidden="true">*</span>
              </label>
              <input
                id="addressText"
                type="text"
                value={form.addressText}
                onChange={set('addressText')}
                aria-invalid={errors.addressText ? 'true' : undefined}
                className={`${inputClass} ${errors.addressText ? 'border-brand' : ''}`}
                placeholder="e.g. Ananda Nursing Home, Dhanmondi"
              />
              {errors.addressText && (
                <p className="caption-2 mt-1.5 text-brand" role="alert">
                  {errors.addressText}
                </p>
              )}
            </div>

            <div className="mt-3">
              <LocationField
                value={coords}
                onChange={setCoords}
                label="Your current location"
                error={errors.lat}
                hint="We measure the 10 km radius from here. If you skip GPS, we place the hospital address with OpenStreetMap. If that address cannot be placed, share your location and try again."
              />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
              <MapPin size={17} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="title-4">Fixed search radius: 10 km</p>
                <p className="caption-5 mt-1 text-faint">
                  Donors inside 10 km come first. Then we show eligible donors in the rest of {form.city || 'your city'}.
                </p>
              </div>
            </div>

            {serverError && (
              <div className="mt-4">
                <FormAlert>{serverError}</FormAlert>
              </div>
            )}

            <button
              type="submit"
              disabled={phase === 'loading'}
              className="button-md mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-solid text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98] disabled:opacity-70"
            >
              {form.situation === 'later' ? <PaperPlaneTilt size={18} aria-hidden="true" /> : <Drop size={18} weight="fill" aria-hidden="true" />}
              {phase === 'loading'
                ? 'Searching donors…'
                : form.situation === 'later'
                  ? 'Search and email donors'
                  : 'Search donors'}
            </button>

            {phase === 'done' && (
              <button
                type="button"
                onClick={reset}
                className="button-sm mt-2 h-10 w-full rounded-xl border border-line text-mute transition-colors duration-300 hover:text-strong"
              >
                Start a new request
              </button>
            )}
          </form>

          {/* ------------- results ------------- */}
          <div className="flex min-w-0 flex-col gap-4">
            {phase === 'idle' && (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
                <Drop size={34} weight="duotone" className="text-faint" aria-hidden="true" />
                <p className="title-2 mt-4">Results appear here</p>
                <p className="body-6 mt-2 max-w-sm text-mute">
                  Share the patient's blood group, where it is needed and your location. We list eligible donors within
                  10 km first, then the rest of your city.
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
              <div className="flex flex-1 flex-col rounded-2xl border-2 border-strong bg-raised shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                  <div>
                    <p className="title-3">
                      {result.donors.length === 0
                        ? 'No eligible donors found'
                        : `${result.donors.length} ${result.donors.length === 1 ? 'donor' : 'donors'} matched`}
                      <span className="text-mute">
                        {' '}· {result.request.bloodGroup} {DONATION_LABEL[result.request.needType]}
                      </span>
                    </p>
                    <p className="caption-5 mt-1 font-mono text-faint">
                      {result.request.publicId} · radius {result.radiusKm} km around {result.origin.source === 'gps' ? 'your GPS pin' : 'your address'}
                    </p>
                  </div>
                  <Link
                    to="/emergency"
                    className="button-sm inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-strong transition-colors duration-300 hover:bg-lifted"
                  >
                    <UsersThree size={15} aria-hidden="true" />
                    Emergency board
                  </Link>
                </div>

                {result.donors.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                    <Target size={34} weight="duotone" className="text-faint" aria-hidden="true" />
                    <p className="title-2 mt-4">
                      No available {result.request.bloodGroup} {DONATION_LABEL[result.request.needType].toLowerCase()} donors
                    </p>
                    <p className="body-6 mt-2 max-w-md text-mute">
                      Nobody eligible is within 10 km or elsewhere in {result.request.city}. Donors who donated recently
                      are hidden until their waiting period ends. Post the request on the emergency board so people
                      outside the network can help.
                    </p>
                    <p className="caption-5 mt-3 font-mono text-faint">
                      Request {result.request.publicId} saved
                      {receiptStatus === 'sent'
                        ? ` · receipt emailed to ${form.requesterEmail}`
                        : receiptStatus === 'logged'
                          ? ` · receipt queued for ${form.requesterEmail}`
                          : ''}
                    </p>
                    <Link
                      to="/emergency"
                      className="button-md mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-solid px-5 py-2.5 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover"
                    >
                      <PaperPlaneTilt size={17} aria-hidden="true" />
                      Post on the emergency board
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-line bg-good-soft/60 px-5 py-3">
                      <p className="caption-2 flex items-start gap-2 text-good">
                        <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                          Request {result.request.publicId} saved.{' '}
                          {result.request.situation === 'later'
                            ? emailsSent > 0
                              ? `We emailed ${emailsSent} ${emailsSent === 1 ? 'donor' : 'donors'} with your name, phone number, address and schedule. They will contact you directly.`
                              : emailsQueued > 0
                                ? `${emailsQueued} donor ${emailsQueued === 1 ? 'email is' : 'emails are'} queued with your details. No mail provider is configured in this build, so delivery is recorded in the outbox.`
                                : 'We could not deliver the donor emails. Call the donors below directly if the need is urgent.'
                            : `${result.donors.length} eligible ${result.donors.length === 1 ? 'donor is' : 'donors are'} listed below. Call the closest match directly.`}
                        </span>
                      </p>
                      {receiptStatus === 'sent' && (
                        <p className="caption-5 mt-1 pl-6 text-mute">
                          A receipt was emailed to {form.requesterEmail}.
                        </p>
                      )}
                      {receiptStatus === 'logged' && (
                        <p className="caption-5 mt-1 pl-6 text-mute">
                          A receipt for {form.requesterEmail} is in the outbox. No mail provider is configured in this
                          build, so it was recorded instead of sent.
                        </p>
                      )}
                      {receiptStatus === 'failed' && (
                        <p className="caption-5 mt-1 pl-6 text-mute">
                          We could not email your receipt. Keep the reference above for follow-up.
                        </p>
                      )}
                    </div>

                    <div className="divide-y divide-line">
                      <Group
                        title="Within 10 km"
                        note="Nearest eligible donors, sorted by distance"
                        donors={near}
                        situation={result.request.situation}
                      />
                      {sameCity.length > 0 && (
                        <Group
                          title={`Elsewhere in ${result.request.city}`}
                          note="Same city, beyond the 10 km radius"
                          donors={sameCity}
                          situation={result.request.situation}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ------------- summary ------------- */}
          <aside className="h-fit rounded-2xl border-2 border-strong bg-raised shadow-[var(--shadow-card)] xl:sticky xl:top-20">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="caption-3 uppercase tracking-wider text-mute">Current request</p>
              <span className="caption-5 rounded-full bg-brand-soft px-2 py-1 font-mono text-brand">
                {phase === 'done' ? 'Sent' : phase === 'loading' ? 'Searching' : 'Draft'}
              </span>
            </div>
            <div className="p-4">
              <p className="title-4">
                {form.bloodGroup ? `${form.bloodGroup} ${DONATION_LABEL[form.needType].toLowerCase()} needed` : 'Choose a blood group'}
              </p>
              <p className="caption-2 mt-1 text-mute">
                {form.situation === 'later' ? timeLabel(form.neededAt) : 'Immediate'} · 10 km · {form.city || 'city'}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border-2 border-strong bg-surface p-3 shadow-[3px_3px_0_var(--text)]">
                  <dt className="caption-5 text-faint">Within 10 km</dt>
                  <dd className="font-mono text-lg font-semibold text-strong">{phase === 'done' ? near.length : '—'}</dd>
                </div>
                <div className="rounded-xl border-2 border-strong bg-surface p-3 shadow-[3px_3px_0_var(--text)]">
                  <dt className="caption-5 text-faint">Same city</dt>
                  <dd className="font-mono text-lg font-semibold text-strong">{phase === 'done' ? sameCity.length : '—'}</dd>
                </div>
              </dl>

              {result?.emails?.requested && (emailsSent > 0 || emailsQueued > 0) && (
                <div className="mt-3 rounded-xl border border-good/20 bg-good-soft p-3">
                  <p className="caption-3 text-good">{emailsSent > 0 ? 'Emails sent' : 'Emails queued'}</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-good">{emailsSent > 0 ? emailsSent : emailsQueued}</p>
                  <p className="caption-5 mt-1 text-mute">
                    {emailsSent > 0
                      ? `Delivery is recorded against request ${result.request.publicId}.`
                      : 'No mail provider is configured in this build, so messages wait in the outbox.'}
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-brand/15 bg-brand-soft p-3">
                <p className="caption-3 text-brand">Before you call</p>
                <ul className="mt-2 space-y-2 caption-5 text-mute">
                  <li>Confirm the hospital, blood group and how many units.</li>
                  <li>Donors marked available may still be screened out on the day.</li>
                  <li>Never pay for blood or accept a paid donor.</li>
                </ul>
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="caption-4 text-faint">Emergency support</p>
                <a
                  href="tel:999"
                  className="button-sm mt-2 flex h-10 items-center justify-center rounded-xl border border-line bg-surface text-strong transition-colors hover:border-brand hover:text-brand"
                >
                  Call ambulance · 999
                </a>
                <Link
                  to="/emergency"
                  className="button-sm mt-2 flex h-10 items-center justify-center rounded-xl border border-line bg-surface text-strong transition-colors hover:border-brand hover:text-brand"
                >
                  Browse emergency board
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {phase === 'done' && result?.donors.length === 0 && (
        <p className="mx-auto max-w-6xl px-4 pb-8 font-mono text-xs text-faint sm:px-6" aria-live="polite">
          No match for {result.request.bloodGroup} {result.request.needType} in {result.request.city}.
          <CaretDown size={12} className="ml-1 inline rotate-90" aria-hidden="true" />
        </p>
      )}
    </div>
  )
}

function Group({ title, note, donors, situation }) {
  if (donors.length === 0) return null
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-5 py-2.5">
        <p className="caption-3 uppercase tracking-wider text-mute">{title}</p>
        <span className="caption-5 text-faint">{note}</span>
      </div>
      <ul>
        {donors.map((d) => {
          return (
            <li
              key={d.id}
              className="border-t border-line px-5 py-4 transition-colors duration-300 hover:bg-lifted"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft" aria-hidden="true">
                  <span className="font-mono text-sm font-semibold text-brand">{d.bloodGroup}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="title-4">{d.name}</p>
                  <p className="caption-2 mt-0.5 text-mute">
                    {d.city} ·{' '}
                    <span className="font-mono">
                      {d.withinRadius ? `${d.distanceKm.toFixed(1)} km away` : 'same city, beyond 10 km'}
                    </span>
                  </p>
                  <p className="caption-5 mt-1 text-faint">
                    {DONATION_LABEL[d.donationType]} donor · last donated {lastDonatedLabel(d.lastDonated)}
                  </p>
                  <a
                    href={`mailto:${d.email}`}
                    className="caption-5 mt-1 inline-flex items-center gap-1.5 text-mute underline decoration-line underline-offset-4 hover:text-strong hover:decoration-brand"
                  >
                    <EnvelopeSimple size={13} aria-hidden="true" />
                    {d.email}
                  </a>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2">
                  {situation === 'immediate' && d.phone ? (
                    <a
                      href={`tel:${d.phone.replace(/[^\d+]/g, '')}`}
                      className="button-sm flex items-center justify-center gap-1.5 rounded-xl bg-brand-solid px-4 py-2 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover"
                      aria-label={`Call ${d.name} on ${d.phone}`}
                    >
                      <PhoneCall size={16} weight="bold" aria-hidden="true" />
                      Call now
                    </a>
                  ) : (
                    <span className="caption-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-mute">
                      <EnvelopeSimple size={14} aria-hidden="true" />
                      {d.notifyStatus === 'sent'
                        ? 'Emailed'
                        : d.notifyStatus === 'logged'
                          ? 'Email queued'
                          : d.notifyStatus === 'failed'
                            ? 'Email failed'
                            : 'Not emailed'}
                    </span>
                  )}
                  {situation === 'immediate' && d.phone && (
                    <span className="caption-5 text-center font-mono text-faint">{d.phone}</span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
