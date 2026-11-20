import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Drop, ShieldCheck, HandHeart, Clock } from '@phosphor-icons/react'
import { BLOOD_GROUPS, COMPONENTS } from '../data.js'

const inputClass =
  'body-3 h-11 w-full rounded-xl border border-line bg-surface px-3 placeholder:text-faint focus:border-brand focus:outline-none'

export default function RegisterDonor() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    group: '',
    lastDonation: '',
    area: '',
    postcode: '',
    components: ['Whole blood'],
    available: true,
    consent: false,
  })
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('idle') // idle | submitting | done
  const [reference, setReference] = useState('')

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const toggleComponent = (c) =>
    setForm((f) => ({
      ...f,
      components: f.components.includes(c) ? f.components.filter((x) => x !== c) : [...f.components, c],
    }))

  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Enter your full name.'
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) next.phone = 'Enter a 11 digit Bangladeshi mobile number starting 01, e.g. 01712 345678.'
    if (!form.group) next.group = 'Pick your blood group.'
    if (form.postcode && !/^\d{4}$/.test(form.postcode.trim())) next.postcode = 'Post code must be 4 digits, e.g. 1205.'
    if (form.components.length === 0) next.components = 'Pick at least one donation type.'
    if (!form.consent) next.consent = 'We need your consent to store your details.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    setPhase('submitting')
    window.setTimeout(() => {
      setReference(`BLG-2026-${String(Math.floor(10000 + Math.random() * 89999))}`)
      setPhase('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 750)
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-canvas pt-28 sm:pt-36">
        <div className="mx-auto max-w-xl px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-good-soft">
            <CheckCircle size={36} weight="fill" className="text-good" aria-hidden="true" />
          </div>
          <h1 className="heading-4 mt-6">You are on the donor list, {form.name.split(' ')[0]}</h1>
          <p className="body-3 mt-3 text-mute">
            Your donor profile is saved as <span className="font-mono text-strong">{reference}</span>. When someone
            nearby needs {form.group}, we will send you an SMS. You can flip your availability any time from your
            profile.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/find"
              className="button-md inline-flex items-center gap-2 rounded-2xl bg-brand-solid px-6 py-3 text-onbrand transition-all duration-300 hover:bg-brand-solid-hover active:scale-[0.98]"
            >
              See how seekers search
            </Link>
            <button
              type="button"
              onClick={() => {
                setForm({ name: '', phone: '', group: '', lastDonation: '', area: '', postcode: '', components: ['Whole blood'], available: true, consent: false })
                setPhase('idle')
              }}
              className="button-md rounded-2xl border border-line px-6 py-3 text-strong transition-colors duration-300 hover:bg-lifted"
            >
              Add another donor
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12">
        {/* left rail */}
        <div className="lg:col-span-5">
          <p className="caption-3 uppercase tracking-widest text-brand">Become a donor</p>
          <h1 className="heading-3 mt-3 max-w-hero">One hour of your time can carry someone through the night</h1>
          <p className="body-3 mt-4 max-w-hero text-mute">
            Registering takes about two minutes. When a patient near you needs your blood group, you get one SMS with a
            hospital, a contact and a time slot. Decline if you cannot make it, no questions asked.
          </p>

          <ul className="mt-8 space-y-5">
            {[
              { icon: ShieldCheck, text: 'Your number stays hidden until a seeker sends a request you accept.' },
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
              <li>No fever, infection or antibiotics today</li>
              <li>Hemoglobin checked on the day at the donation site</li>
            </ul>
            <p className="caption-5 mt-3 text-faint">The doctor at the hospital makes the final call, not this list.</p>
          </div>
        </div>

        {/* form */}
        <form onSubmit={submit} noValidate className="h-fit rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)] sm:p-6 lg:col-span-7">
          <p className="title-2">Donor registration</p>
          <p className="caption-2 mt-1 text-mute">Fields marked * are required. We validate everything before you can submit.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="title-4 mb-2 block">Full name *</label>
              <input id="name" type="text" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} className={inputClass} placeholder="e.g. Soumyajit Roy" />
              {errors.name && <p className="caption-2 mt-1.5 text-brand" role="alert">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="title-4 mb-2 block">Mobile number *</label>
              <div className="flex">
                <span className="flex h-11 items-center rounded-l-xl border border-r-0 border-line bg-lifted px-3 font-mono text-sm text-mute">+880</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={form.phone}
                  onChange={set('phone')}
                  aria-invalid={!!errors.phone}
                  className={`${inputClass} rounded-l-none font-mono`}
                  placeholder="01712 345678"
                />
              </div>
              {errors.phone && <p className="caption-2 mt-1.5 text-brand" role="alert">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="group" className="title-4 mb-2 block">Blood group *</label>
              <select id="group" value={form.group} onChange={set('group')} aria-invalid={!!errors.group} className={`${inputClass} appearance-none`}>
                <option value="">Select group</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {errors.group && <p className="caption-2 mt-1.5 text-brand" role="alert">{errors.group}</p>}
            </div>

            <div>
              <label htmlFor="lastDonation" className="title-4 mb-2 block">Last donation <span className="text-faint">(optional)</span></label>
              <input id="lastDonation" type="month" max="2026-11" value={form.lastDonation} onChange={set('lastDonation')} className={inputClass} />
            </div>

            <div>
              <label htmlFor="postcode" className="title-4 mb-2 block">Post code</label>
              <input id="postcode" type="text" inputMode="numeric" value={form.postcode} onChange={set('postcode')} aria-invalid={!!errors.postcode} className={`${inputClass} font-mono`} placeholder="1205" />
              {errors.postcode && <p className="caption-2 mt-1.5 text-brand" role="alert">{errors.postcode}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="area" className="title-4 mb-2 block">Area or locality</label>
              <input id="area" type="text" value={form.area} onChange={set('area')} className={inputClass} placeholder="e.g. Dhanmondi, Dhaka" />
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="title-4 mb-2">I can donate</legend>
              <div className="flex flex-wrap gap-2">
                {COMPONENTS.map((c) => {
                  const active = form.components.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleComponent(c)}
                      aria-pressed={active}
                      className={`button-sm rounded-lg border px-4 py-2 transition-all duration-300 ease-out active:scale-[0.97] ${
                        active ? 'border-brand-solid bg-brand-soft text-brand-hover' : 'border-line bg-surface text-mute hover:text-strong'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
              {errors.components && <p className="caption-2 mt-1.5 text-brand" role="alert">{errors.components}</p>}
            </fieldset>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 sm:col-span-2">
              <div>
                <p className="title-4">Available to donate right now</p>
                <p className="caption-5 text-faint">Flip this off when you travel or finish a donation.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.available}
                aria-label="Available to donate right now"
                onClick={() => setForm((f) => ({ ...f, available: !f.available }))}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ease-out ${form.available ? 'bg-good' : 'bg-raised-2'}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${form.available ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>

            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={set('consent')}
                  aria-invalid={!!errors.consent}
                  className="mt-0.5 h-5 w-5 accent-[#d92d20]"
                />
                <span className="body-6 text-mute">
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-strong underline decoration-line underline-offset-4">terms of use</Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-strong underline decoration-line underline-offset-4">privacy policy</Link>,
                  including storing my blood group, area and phone number to connect me with seekers.
                </span>
              </label>
              {errors.consent && <p className="caption-2 mt-1.5 text-brand" role="alert">{errors.consent}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={phase === 'submitting'}
            className="button-md mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-solid text-onbrand transition-all duration-300 ease-out hover:bg-brand-solid-hover active:scale-[0.98] disabled:opacity-70"
          >
            <Drop size={19} weight="fill" aria-hidden="true" />
            {phase === 'submitting' ? 'Creating your donor profile…' : 'Register as donor'}
          </button>
        </form>
      </div>
    </div>
  )
}
