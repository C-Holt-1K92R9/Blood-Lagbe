import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Drop, HandHeart, ShieldCheck } from '@phosphor-icons/react'
import { BLOOD_GROUPS, DONATION_TYPES } from '../data.js'
import { useAuth } from '../lib/session.jsx'
import { fieldErrors } from '../lib/api.js'
import { isBdMobile } from '../lib/phone.js'
import {
  DivisionCityFields,
  FormAlert,
  LocationField,
  TextAreaField,
  TextField,
  SelectField,
  todayIso,
} from '../components/Form.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function RegisterDonor() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bloodGroup: '',
    donationType: 'blood',
    lastDonated: '',
    division: '',
    city: '',
    addressText: '',
    available: true,
    consent: false,
  })
  const [coords, setCoords] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [phase, setPhase] = useState('idle')

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!isBdMobile(form.phone)) {
      next.phone = 'Enter a Bangladeshi mobile number, e.g. 01712 345678 or +8801712 345678.'
    }
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (!form.bloodGroup) next.bloodGroup = 'Pick your blood group.'
    if (!form.division) next.division = 'Pick your division.'
    if (!form.city) next.city = 'Pick your city or district.'
    if (form.addressText.trim().length < 8) next.addressText = 'Write where you usually live, at least a street or area.'
    if (!form.consent) next.consent = 'We need your consent to store your details.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setPhase('submitting')
    setServerError('')
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        bloodGroup: form.bloodGroup,
        donationType: form.donationType,
        lastDonated: form.lastDonated || null,
        division: form.division,
        city: form.city,
        addressText: form.addressText,
        available: form.available,
        consent: form.consent,
        lat: coords?.lat,
        lng: coords?.lng,
      })
      navigate('/donor?welcome=1', { replace: true })
    } catch (err) {
      const mapped = fieldErrors(err)
      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setServerError(err.message)
      setPhase('idle')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="caption-3 uppercase tracking-widest text-brand">Become a donor</p>
          <h1 className="heading-3 mt-3 max-w-hero">One hour of your time can carry someone through the night</h1>
          <p className="body-3 mt-4 max-w-hero text-mute">
            Create your donor account once, then keep it current. When a patient near you needs your blood group, we
            email you the hospital, the contact number and the time. Decline if you cannot make it, no questions asked.
          </p>

          <ul className="mt-8 space-y-5">
            {[
              { icon: ShieldCheck, text: 'You control your pin and your availability. Update either from your own page.' },
              { icon: HandHeart, text: 'Donation is voluntary. You are never paid, and no one may pay you.' },
              { icon: Clock, text: 'Whole blood takes 8 to 10 minutes after registration and screening.' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
                  <Icon size={19} className="text-brand" aria-hidden="true" />
                </span>
                <span className="body-6 pt-1.5 text-mute">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <p className="title-4">Quick eligibility check</p>
            <ul className="body-6 mt-3 list-disc space-y-1.5 pl-5 text-mute">
              <li>Age 18 to 65, weight 45 kg or more</li>
              <li>At least 90 days since your last whole blood donation</li>
              <li>At least 28 days since your last plasma donation</li>
              <li>No fever, infection or antibiotics today</li>
              <li>Hemoglobin checked on the day at the donation site</li>
            </ul>
            <p className="caption-5 mt-3 text-faint">The doctor at the hospital makes the final call, not this list.</p>
          </div>

          <p className="caption-2 mt-8 text-mute">
            Already have a donor account?{' '}
            <Link to="/login" className="font-medium text-strong underline decoration-line underline-offset-4 hover:decoration-brand">
              Sign in
            </Link>
          </p>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="h-fit rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-7"
        >
          <p className="title-2">Donor registration</p>
          <p className="caption-2 mt-1 text-mute">
            Fields marked * are required. You can change everything later from your donor page.
          </p>

          <div className="mt-6 space-y-4">
            <FormAlert>{serverError}</FormAlert>

            <p className="caption-3 uppercase tracking-wider text-faint">Your account</p>

            <TextField
              id="name"
              label="Full name"
              required
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              placeholder="e.g. Soumyajit Roy"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="email"
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                error={errors.email}
                placeholder="name@example.com"
                hint="Requests and account notices arrive here."
              />
              <TextField
                id="phone"
                label="Mobile number"
                type="tel"
                inputMode="numeric"
                required
                autoComplete="tel-national"
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
                placeholder="01712 345678"
                className="font-mono"
                hint="Shown only on an immediate request so a family can call you."
              />
            </div>

            <TextField
              id="password"
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              placeholder="At least 8 characters"
            />

            <div className="border-t border-line pt-4">
              <p className="caption-3 uppercase tracking-wider text-faint">What you can donate</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="bloodGroup"
                label="Blood group"
                required
                value={form.bloodGroup}
                onChange={set('bloodGroup')}
                error={errors.bloodGroup}
              >
                <option value="">Select group</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </SelectField>

              <TextField
                id="lastDonated"
                label="Last donation"
                type="date"
                max={todayIso()}
                value={form.lastDonated}
                onChange={set('lastDonated')}
                error={errors.lastDonated}
                hint="Optional. Leave blank if you have never donated."
              />
            </div>

            <fieldset>
              <legend className="title-4 mb-2">I donate</legend>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Donation type">
                {DONATION_TYPES.map((type) => {
                  const active = form.donationType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setForm((f) => ({ ...f, donationType: type.value }))}
                      className={`button-sm rounded-xl border px-4 py-3 transition-all duration-300 ease-out active:scale-[0.98] ${
                        active
                          ? 'border-brand-solid bg-brand-soft text-brand-hover'
                          : 'border-line bg-surface text-mute hover:text-strong'
                      }`}
                    >
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="border-t border-line pt-4">
              <p className="caption-3 uppercase tracking-wider text-faint">Where you usually live</p>
            </div>

            <DivisionCityFields
              division={form.division}
              city={form.city}
              onDivision={(value) => {
                setForm((f) => ({ ...f, division: value, city: '' }))
                setErrors((err) => ({ ...err, division: undefined, city: undefined }))
              }}
              onCity={(value) => {
                setForm((f) => ({ ...f, city: value }))
                setErrors((err) => ({ ...err, city: undefined }))
              }}
              errors={errors}
            />

            <TextAreaField
              id="addressText"
              label="Home address in writing"
              required
              rows={2}
              value={form.addressText}
              onChange={set('addressText')}
              error={errors.addressText}
              placeholder="e.g. Road 8, Dhanmondi, near Jigatola bus stand, Dhaka"
              hint="Street, area and a landmark help us place you accurately on the map."
            />

            <LocationField
              value={coords}
              onChange={setCoords}
              label="Current GPS location"
              hint="Optional but preferred. If you share it, we use this pin instead of guessing from your address. Otherwise we look up your written address on OpenStreetMap."
            />

            <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
              <div>
                <p className="title-4">Available to donate right now</p>
                <p className="caption-5 text-faint">Flip this off when you travel, fall ill or finish a donation.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.available}
                aria-label="Available to donate right now"
                onClick={() => setForm((f) => ({ ...f, available: !f.available }))}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ease-out ${
                  form.available ? 'bg-good' : 'bg-raised-2'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    form.available ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={set('consent')}
                  aria-invalid={errors.consent ? 'true' : undefined}
                  className="mt-0.5 h-5 w-5 accent-[#d92d20]"
                />
                <span className="body-6 text-mute">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-strong underline decoration-line underline-offset-4">
                    terms and conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-strong underline decoration-line underline-offset-4">
                    privacy policy
                  </Link>
                  , including storing my blood group, location and contact details to connect me with seekers.
                </span>
              </label>
              {errors.consent && (
                <p className="caption-2 mt-1.5 text-brand" role="alert">
                  {errors.consent}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={phase === 'submitting'}
            className="button-md mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-solid text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98] disabled:opacity-70"
          >
            <Drop size={19} weight="fill" aria-hidden="true" />
            {phase === 'submitting' ? 'Creating your donor account…' : 'Create donor account'}
          </button>

          <p className="caption-5 mt-3 text-center text-faint">
            <CheckCircle size={13} className="mr-1 inline text-good" aria-hidden="true" />
            Your profile stays hidden while you are not eligible to donate.
          </p>
        </form>
      </div>
    </div>
  )
}
