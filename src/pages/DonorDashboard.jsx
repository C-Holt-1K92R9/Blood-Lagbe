import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  Crosshair,
  Drop,
  House,
  Medal,
  MapPin,
  SignOut,
  Trash,
  Warning,
} from '@phosphor-icons/react'
import { BLOOD_GROUPS, DONATION_TYPES } from '../data.js'
import { useAuth } from '../lib/session.jsx'
import { api, fieldErrors } from '../lib/api.js'
import { dhakaDateIso, getPosition, LOCATION_SOURCE_LABEL } from '../lib/geo.js'
import {
  DivisionCityFields,
  FormAlert,
  SelectField,
  TextAreaField,
  TextField,
} from '../components/Form.jsx'

const TODAY = dhakaDateIso()

const dateLabel = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Never'

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

export default function DonorDashboard() {
  const { donor, loading, logout, update, updateLocation, remove } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    bloodGroup: '',
    donationType: 'blood',
    showOnHonorWall: false,
  })
  const [address, setAddress] = useState({ division: '', city: '', addressText: '' })
  const [lastDonated, setLastDonated] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [achievements, setAchievements] = useState(null)
  const [achievementsLoading, setAchievementsLoading] = useState(true)
  const [achievementsError, setAchievementsError] = useState('')
  const [achievementsBusy, setAchievementsBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [passwordErrors, setPasswordErrors] = useState({})

  useEffect(() => {
    if (!donor) return
    setProfile({
      name: donor.name,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      donationType: donor.donationType,
      showOnHonorWall: donor.showOnHonorWall,
    })
    setAddress({ division: donor.division, city: donor.city, addressText: donor.addressText })
    setLastDonated(donor.lastDonated || '')
  }, [donor])

  useEffect(() => {
    if (!donor) return
    let alive = true
    api('/me/achievements')
      .then((data) => {
        if (alive) setAchievements(data)
      })
      .catch((err) => {
        if (alive) setAchievementsError(err.message)
      })
      .finally(() => {
        if (alive) setAchievementsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [donor])

  useEffect(() => {
    if (!donor) return
    let alive = true
    api('/me/requests')
      .then((data) => {
        if (alive) setRequests(data.requests)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setRequestsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [donor])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas pt-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />
        </div>
      </div>
    )
  }

  if (!donor) return <Navigate to="/login" replace state={{ from: '/donor' }} />

  const show = (message) => {
    setNotice(message)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fail = (err) => {
    const mapped = fieldErrors(err)
    setErrors(mapped)
    if (Object.keys(mapped).length === 0) setError(err.message)
    else setError('')
  }

  const run = async (key, task, message) => {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      const result = await task()
      if (message) show(message)
      return result
    } catch (err) {
      fail(err)
      return null
    } finally {
      setBusy('')
    }
  }

  const toggleAvailable = () =>
    run('availability', () => update({ available: !donor.available }), donor.available ? 'You are now hidden from search.' : 'You are visible to seekers again.')

  const saveLastDonated = () =>
    run('lastDonated', () => update({ lastDonated: lastDonated || null }), 'Last donation date saved.')

  const saveProfile = (e) => {
    e.preventDefault()
    run('profile', () => update(profile), 'Account details saved.')
  }

  const saveAddress = (e) => {
    e.preventDefault()
    run('address', () => update(address), 'Address saved. We recalculated your map pin.')
  }

  const refreshAchievements = async () => {
    setAchievementsBusy(true)
    setAchievementsError('')
    try {
      setAchievements(await api('/me/achievements'))
    } catch (err) {
      setAchievementsError(err.message)
    } finally {
      setAchievementsBusy(false)
    }
  }

  const useCurrentLocation = () =>
    run(
      'location',
      async () => {
        const position = await getPosition()
        return updateLocation({ lat: position.lat, lng: position.lng })
      },
      'Location updated to where you are now.',
    )

  const useHomeAddress = () =>
    run('location', () => updateLocation({ useAddress: true }), 'Pin moved to your saved home address.')

  const signOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const deleteAccount = () =>
    run(
      'delete',
      async () => {
        await remove()
        navigate('/', { replace: true })
      },
      '',
    )

  const changePassword = async (e) => {
    e.preventDefault()
    const next = {}
    if (!password.current) next.current = 'Enter your current password.'
    if (password.next.length < 8) next.next = 'Use at least 8 characters.'
    if (password.next !== password.confirm) next.confirm = 'The new passwords do not match.'
    setPasswordErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy('password')
    setError('')
    setNotice('')
    try {
      await api('/me/password', {
        method: 'POST',
        body: { currentPassword: password.current, newPassword: password.next },
      })
      setPassword({ current: '', next: '', confirm: '' })
      show('Password changed. Other signed-in devices were signed out.')
    } catch (err) {
      const mapped = fieldErrors(err)
      if (mapped.currentPassword) mapped.current = mapped.currentPassword
      if (mapped.password) mapped.next = mapped.password
      setPasswordErrors(mapped)
      if (Object.keys(mapped).length === 0) setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const eligibility = donor.eligibility
  const eligibilityLabel = eligibility.eligible
    ? 'Visible to seekers'
    : eligibility.reason === 'unavailable'
      ? 'Hidden from search'
      : eligibility.reason === 'recovery'
        ? 'Recovery period'
        : eligibility.reason === 'held'
          ? 'On hold'
          : 'Waiting period'
  const cannotEnableAvailability = eligibility.reason === 'recovery' || eligibility.reason === 'held'

  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {params.get('welcome') === '1' && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-good/25 bg-good-soft px-4 py-3">
            <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-good" aria-hidden="true" />
            <p className="caption-2 text-strong">
              Your donor account is live, {donor.name.split(' ')[0]}. Keep your location and last donation date fresh so
              patients can reach you.
            </p>
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-2xl border border-good/25 bg-good-soft px-4 py-3" role="status">
            <p className="caption-2 flex items-center gap-2 text-good">
              <CheckCircle size={16} weight="fill" aria-hidden="true" />
              {notice}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6">
            <FormAlert>{error}</FormAlert>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="caption-3 uppercase tracking-widest text-brand">Donor page</p>
            <h1 className="heading-4 mt-1">Hello, {donor.name.split(' ')[0]}</h1>
            <p className="caption-2 mt-1 text-mute">{donor.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`caption-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                eligibility.eligible
                  ? 'border-good/25 bg-good-soft text-good'
                  : 'border-amber/25 bg-amber-soft text-amber'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${eligibility.eligible ? 'bg-good' : 'bg-amber'}`} />
              {eligibilityLabel}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="button-sm flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-mute transition-colors duration-300 hover:text-strong"
            >
              <SignOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* availability + last donation */}
            <section className="rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="title-2">Availability</h2>
                  <p className="caption-2 mt-1 text-mute">
                    {eligibility.reason === 'recovery'
                      ? `You are in recovery until ${timeLabel(donor.recoveryUntil)}. Search will not show you during this period.`
                      : donor.available
                        ? 'You are marked available. Search only shows you if your waiting period is over.'
                        : 'You are switched off. Nobody can find you in search.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={donor.available}
                  aria-label="Available to donate right now"
                  disabled={busy === 'availability' || (!donor.available && cannotEnableAvailability)}
                  onClick={toggleAvailable}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ease-out disabled:opacity-60 ${
                    donor.available ? 'bg-good' : 'bg-raised-2'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      donor.available ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface p-4">
                  <p className="caption-4 flex items-center gap-1.5 text-mute">
                    <Clock size={15} aria-hidden="true" />
                    Eligibility
                  </p>
                  <p className="title-4 mt-1.5">
                    {eligibility.eligible
                      ? 'You can donate now'
                      : eligibility.reason === 'recovery'
                        ? `Recovery until ${timeLabel(donor.recoveryUntil)}`
                        : eligibility.reason === 'held'
                          ? `On hold until ${timeLabel(donor.lockedUntil)}`
                      : eligibility.reason === 'unavailable'
                        ? 'Availability is switched off'
                        : `Next eligible ${dateLabel(eligibility.nextEligibleAt)}`}
                  </p>
                  <p className="caption-5 mt-1 text-faint">
                    {eligibility.reason === 'recovery'
                      ? 'Availability will be restored automatically when this recovery period ends.'
                      : eligibility.reason === 'held'
                        ? 'Your temporary hold prevents other requests from reserving you.'
                        : eligibility.reason === 'unavailable'
                      ? 'Turn availability back on when you are ready to donate again.'
                      : eligibility.reason === 'cooldown'
                        ? `${eligibility.daysUntilEligible} ${eligibility.daysUntilEligible === 1 ? 'day' : 'days'} left in the ${eligibility.intervalDays}-day waiting period after a ${donor.donationType} donation.`
                        : `${eligibility.intervalDays} day waiting period after your last ${donor.donationType} donation.`}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface p-4">
                  <label htmlFor="lastDonated" className="caption-4 text-mute">
                    Last donated
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="lastDonated"
                      type="date"
                      max={TODAY}
                      value={lastDonated}
                      onChange={(e) => setLastDonated(e.target.value)}
                      className="body-6 h-10 min-w-0 flex-1 rounded-lg border border-line bg-raised px-2 font-mono focus:border-brand focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={saveLastDonated}
                      disabled={busy === 'lastDonated'}
                      className="button-sm shrink-0 rounded-lg bg-brand-solid px-3 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                  <p className="caption-5 mt-2 text-faint">Only you can change this. Keep it honest.</p>
                </div>
              </div>
            </section>

            {/* location */}
            <section className="rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="title-2">Your map pin</h2>
                  <p className="caption-2 mt-1 text-mute">{LOCATION_SOURCE_LABEL[donor.locationSource]}</p>
                </div>
                <span className="caption-5 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-mute">
                  {donor.lat?.toFixed(5)}, {donor.lng?.toFixed(5)}
                </span>
              </div>

              <p className="caption-2 mt-3 text-mute">
                {donor.addressText} · {donor.city}, {donor.division}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={busy === 'location'}
                  className="button-sm flex items-center gap-1.5 rounded-xl bg-brand-solid px-4 py-2.5 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover disabled:opacity-60"
                >
                  <Crosshair size={16} aria-hidden="true" />
                  {busy === 'location' ? 'Updating…' : 'Update to my current location'}
                </button>
                <button
                  type="button"
                  onClick={useHomeAddress}
                  disabled={busy === 'location'}
                  className="button-sm flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-strong transition-colors duration-300 hover:bg-lifted disabled:opacity-60"
                >
                  <House size={16} aria-hidden="true" />
                  Pin my home address
                </button>
              </div>
              <p className="caption-5 mt-3 text-faint">
                Distance is measured from this pin. Sharing your current location while you are away from home helps
                patients nearby, and you can move it back any time.
              </p>
            </section>

            {/* requests received */}
            <section className="rounded-2xl border border-line bg-raised shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="title-2">Requests sent to you</h2>
                <span className="caption-5 rounded-full bg-surface px-2.5 py-1 font-mono text-mute">{requests.length}</span>
              </div>

              {requestsLoading ? (
                <div className="space-y-3 p-5" aria-busy="true">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-lifted" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <MapPin size={28} weight="duotone" className="mx-auto text-faint" aria-hidden="true" />
                  <p className="body-6 mt-3 text-mute">
                    No requests yet. When a patient near you needs your group, the details land here and in your email.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {requests.map((r) => (
                    <li key={`${r.publicId}-${r.notifiedAt}`} className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="title-4">
                          {r.bloodGroup} {r.needType} · {r.city}
                        </p>
                        <span className="caption-5 font-mono text-faint">{r.publicId}</span>
                      </div>
                      <p className="caption-2 mt-1 text-mute">
                        {r.requesterName} · {r.addressText}
                      </p>
                      <p className="caption-5 mt-1 text-faint">
                        {r.situation === 'immediate' ? 'Needed immediately' : `Needed ${timeLabel(r.neededAt)}`} · sent{' '}
                        {timeLabel(r.notifiedAt)}
                      </p>
                      <a
                        href={`tel:${r.requesterPhone.replace(/[^\d+]/g, '')}`}
                        className="button-sm mt-2 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-strong transition-colors duration-300 hover:border-brand hover:text-brand"
                      >
                        Call {r.requesterName.split(' ')[0]} · {r.requesterPhone}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-line bg-raised shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 className="title-2 flex items-center gap-2">
                    <Medal size={19} className="text-good" aria-hidden="true" />
                    Achievements
                  </h2>
                  <p className="caption-5 mt-1 text-mute">
                    {achievementsLoading ? 'Loading donation record…' : `${achievements?.confirmedDonations || 0} confirmed donations`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshAchievements}
                  disabled={achievementsBusy}
                  className="button-sm rounded-lg border border-line px-3 py-2 caption-5 text-mute hover:text-strong disabled:opacity-60"
                >
                  {achievementsBusy ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              {achievementsError && (
                <p className="m-4 rounded-lg border border-brand/20 bg-brand-soft p-3 caption-5 text-brand" role="alert">
                  Could not load achievements: {achievementsError}
                </p>
              )}
              {achievementsLoading ? (
                <div className="space-y-3 p-5" aria-busy="true">
                  {[0, 1].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-lifted" />)}
                </div>
              ) : achievements?.certificates?.length ? (
                <ul className="divide-y divide-line">
                  {achievements.certificates.map((certificate, index) => (
                    <li key={certificate.certificateNumber || `${certificate.donatedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="title-4">{certificate.certificateNumber || 'Donation recognition'}</p>
                        <p className="caption-5 mt-1 text-mute">Donation confirmed {timeLabel(certificate.donatedAt)}</p>
                        {certificate.status !== 'ready' && (
                          <p className="caption-5 mt-1 text-faint">Certificate will appear after the background job runs.</p>
                        )}
                      </div>
                      {certificate.downloadUrl && (
                        <a
                          href={certificate.downloadUrl}
                          className="button-sm rounded-lg bg-good-soft px-3 py-2 caption-5 text-good hover:bg-good-soft/70"
                        >
                          Download certificate
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 caption-2 text-mute">
                  No confirmed donations are recorded yet. Once a donation is confirmed, its certificate and total will
                  appear here.
                </p>
              )}
              <div className="border-t border-line px-5 py-3">
                <Link to="/honorary-donors" className="caption-5 text-mute underline underline-offset-4 hover:text-strong">
                  View the public Honorary Donors wall
                </Link>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* account details */}
            <form onSubmit={saveProfile} className="rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)]">
              <h2 className="title-2">Account</h2>
              <div className="mt-4 space-y-4">
                <TextField
                  id="accName"
                  label="Full name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  error={errors.name}
                />
                <TextField
                  id="accPhone"
                  label="Mobile number"
                  type="tel"
                  inputMode="numeric"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  error={errors.phone}
                  className="font-mono"
                />
                <SelectField
                  id="accGroup"
                  label="Blood group"
                  value={profile.bloodGroup}
                  onChange={(e) => setProfile((p) => ({ ...p, bloodGroup: e.target.value }))}
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </SelectField>

                <fieldset>
                  <legend className="title-4 mb-2">I donate</legend>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Donation type">
                    {DONATION_TYPES.map((type) => {
                      const active = profile.donationType === type.value
                      return (
                        <button
                          key={type.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setProfile((p) => ({ ...p, donationType: type.value }))}
                          className={`button-sm rounded-lg border px-3 py-2 transition-all duration-300 ${
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

                <label htmlFor="showOnHonorWall" className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
                  <input
                    id="showOnHonorWall"
                    type="checkbox"
                    checked={Boolean(profile.showOnHonorWall)}
                    onChange={(e) => setProfile((p) => ({ ...p, showOnHonorWall: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-brand-solid"
                  />
                  <span>
                    <span className="title-4 block">Show my name on the Honorary Donors wall</span>
                    <span className="caption-5 mt-1 block text-mute">
                      This is optional. Only your name and confirmed donation count are public; contact details and
                      location are never shown there.
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={busy === 'profile'}
                  className="button-sm h-10 w-full rounded-xl bg-brand-solid text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover disabled:opacity-60"
                >
                  {busy === 'profile' ? 'Saving…' : 'Save account details'}
                </button>
              </div>
            </form>

            {/* password */}
            <form onSubmit={changePassword} className="rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)]">
              <h2 className="title-2">Password</h2>
              <p className="caption-5 mt-1 text-faint">Changing it signs out every other device.</p>
              <div className="mt-4 space-y-4">
                <TextField
                  id="currentPassword"
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={password.current}
                  onChange={(e) => {
                    setPassword((p) => ({ ...p, current: e.target.value }))
                    setPasswordErrors((x) => ({ ...x, current: undefined }))
                  }}
                  error={passwordErrors.current}
                />
                <TextField
                  id="newPassword"
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={password.next}
                  onChange={(e) => {
                    setPassword((p) => ({ ...p, next: e.target.value }))
                    setPasswordErrors((x) => ({ ...x, next: undefined }))
                  }}
                  error={passwordErrors.next}
                  hint="At least 8 characters."
                />
                <TextField
                  id="confirmPassword"
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={password.confirm}
                  onChange={(e) => {
                    setPassword((p) => ({ ...p, confirm: e.target.value }))
                    setPasswordErrors((x) => ({ ...x, confirm: undefined }))
                  }}
                  error={passwordErrors.confirm}
                />
                <button
                  type="submit"
                  disabled={busy === 'password'}
                  className="button-sm h-10 w-full rounded-xl border border-line text-strong transition-colors duration-300 hover:bg-lifted disabled:opacity-60"
                >
                  {busy === 'password' ? 'Changing…' : 'Change password'}
                </button>
              </div>
            </form>

            {/* address */}
            <form onSubmit={saveAddress} className="rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)]">
              <h2 className="title-2">Home address</h2>
              <p className="caption-5 mt-1 text-faint">Used to place you when you have not shared GPS.</p>
              <div className="mt-4 space-y-4">
                <DivisionCityFields
                  division={address.division}
                  city={address.city}
                  onDivision={(value) => setAddress((a) => ({ ...a, division: value, city: '' }))}
                  onCity={(value) => setAddress((a) => ({ ...a, city: value }))}
                  errors={errors}
                />
                <TextAreaField
                  id="accAddress"
                  label="Address in writing"
                  rows={2}
                  value={address.addressText}
                  onChange={(e) => setAddress((a) => ({ ...a, addressText: e.target.value }))}
                  error={errors.addressText}
                />
                <button
                  type="submit"
                  disabled={busy === 'address'}
                  className="button-sm h-10 w-full rounded-xl border border-line text-strong transition-colors duration-300 hover:bg-lifted disabled:opacity-60"
                >
                  {busy === 'address' ? 'Saving…' : 'Save address'}
                </button>
              </div>
            </form>

            <section className="rounded-2xl border border-line bg-raised p-5">
              <h2 className="title-3 flex items-center gap-2">
                <Warning size={17} className="text-brand" aria-hidden="true" />
                Delete account
              </h2>
              <p className="caption-2 mt-2 text-mute">
                This removes your donor profile, sessions and request history. It cannot be undone.
              </p>
              {confirmDelete ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={deleteAccount}
                    disabled={busy === 'delete'}
                    className="button-sm flex-1 rounded-lg bg-brand-solid px-3 py-2 text-onbrand disabled:opacity-60"
                  >
                    {busy === 'delete' ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="button-sm flex-1 rounded-lg border border-line px-3 py-2 text-strong"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="button-sm mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-brand hover:bg-brand-soft"
                >
                  <Trash size={15} aria-hidden="true" />
                  Delete my account
                </button>
              )}
            </section>

            <p className="caption-5 flex items-center gap-1.5 px-1 text-faint">
              <Drop size={13} className="text-brand" aria-hidden="true" />
              Need help?{' '}
              <Link to="/terms" className="underline decoration-line underline-offset-4 hover:decoration-brand">
                Read the terms
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
