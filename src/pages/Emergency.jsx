import { useEffect, useMemo, useState } from 'react'
import {
  ArrowClockwise,
  CheckCircle,
  Drop,
  MapPin,
  PaperPlaneTilt,
  PhoneCall,
  Siren,
  UsersThree,
} from '@phosphor-icons/react'
import { BLOOD_GROUPS, DONATION_LABEL, DONATION_TYPES } from '../data.js'
import { api, fieldErrors } from '../lib/api.js'
import { dhakaDateTimeInputValue } from '../lib/geo.js'
import { isBdMobile } from '../lib/phone.js'
import { DIVISION_NAMES, citiesOf } from '../../shared/bd.js'
import { FormAlert, SelectField, TextAreaField, TextField, inputClass } from '../components/Form.jsx'

const emptyForm = {
  name: '',
  phone: '',
  bloodGroup: '',
  needType: 'blood',
  division: 'Dhaka',
  city: 'Dhaka',
  addressText: '',
  neededAt: '',
  note: '',
}

const timeLabel = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'As soon as possible'

const phoneLabel = (value) => String(value || '').replace('+880', '0')

const MIN_NEEDED_AT = dhakaDateTimeInputValue(new Date(Date.now() + 5 * 60_000))

/* The board is anonymous, so the close token is the only proof that this browser
   created the post. Keep it local; never put it on the public board. */
const SAVED_POSTS_KEY = 'bl-board-posts'

function readSavedPosts() {
  try {
    const raw = localStorage.getItem(SAVED_POSTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.publicId && entry?.token) : []
  } catch {
    return []
  }
}

function writeSavedPosts(entries) {
  try {
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(entries))
  } catch {
    /* private mode or storage full */
  }
}

export default function Emergency() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [needFilter, setNeedFilter] = useState('')

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const [savedPosts, setSavedPosts] = useState(readSavedPosts)
  const [closingId, setClosingId] = useState('')
  const [manageMessage, setManageMessage] = useState('')
  const [manageError, setManageError] = useState('')

  const load = () => {
    setLoading(true)
    setLoadError('')
    api('/emergency')
      .then((data) => setPosts(data.posts))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const visible = useMemo(
    () =>
      posts.filter(
        (p) => (!groupFilter || p.bloodGroup === groupFilter) && (!needFilter || p.needType === needFilter),
      ),
    [posts, groupFilter, needFilter],
  )

  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Enter your name.'
    if (!isBdMobile(form.phone)) {
      next.phone = 'Enter a Bangladeshi mobile number, e.g. 01712 345678 or +8801712 345678.'
    }
    if (!form.bloodGroup) next.bloodGroup = 'Pick the blood group.'
    if (!form.division) next.division = 'Pick the division.'
    if (!form.city) next.city = 'Pick the city or district.'
    if (form.addressText.trim().length < 6) next.addressText = 'Write the hospital or address.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccess('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const data = await api('/emergency', {
        method: 'POST',
        body: { ...form, neededAt: form.neededAt || undefined },
      })
      setPosts((p) => [data.post, ...p])
      if (data.closeToken) {
        const entry = {
          publicId: data.post.publicId,
          token: data.closeToken,
          name: data.post.name,
          city: data.post.city,
        }
        setSavedPosts((prev) => {
          const next = [entry, ...prev.filter((post) => post.publicId !== entry.publicId)]
          writeSavedPosts(next)
          return next
        })
      }
      setSuccess(
        `Posted to the board as ${data.post.publicId}. People can now call you directly. You can close it from "Your posts from this browser" below.`,
      )
      setManageMessage('')
      setManageError('')
      setForm(emptyForm)
      setErrors({})
    } catch (err) {
      const mapped = fieldErrors(err)
      setErrors(mapped)
      if (Object.keys(mapped).length === 0) setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const closeSavedPost = async (entry) => {
    setManageMessage('')
    setManageError('')
    setClosingId(entry.publicId)
    try {
      const data = await api(`/emergency/${encodeURIComponent(entry.publicId)}/fulfil`, {
        method: 'POST',
        body: { token: entry.token },
      })
      setPosts((p) => p.filter((post) => post.publicId !== data.post.publicId))
      setSavedPosts((prev) => {
        const next = prev.filter((post) => post.publicId !== entry.publicId)
        writeSavedPosts(next)
        return next
      })
      setManageMessage(`Post ${data.post.publicId} is now closed. Thank you for updating the board.`)
    } catch (err) {
      if (err.status === 404) {
        setSavedPosts((prev) => {
          const next = prev.filter((post) => post.publicId !== entry.publicId)
          writeSavedPosts(next)
          return next
        })
        setManageError('That post is already closed or no longer exists. It was removed from this list.')
      } else {
        setManageError(err.message)
      }
    } finally {
      setClosingId('')
    }
  }

  return (
    <div className="min-h-screen bg-canvas pt-24 sm:pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-brand-soft px-4 py-3">
          <p className="caption-2 flex items-center gap-2 text-strong">
            <Siren size={18} weight="fill" className="shrink-0 text-brand" aria-hidden="true" />
            Life threatening emergency? Call 999 and go to the nearest hospital first.
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

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="max-w-2xl">
          <p className="caption-3 uppercase tracking-widest text-brand">Public board</p>
          <h1 className="heading-3 mt-2">Emergency blood board</h1>
          <p className="body-3 mt-3 text-mute">
            When no donor in the network matches, post the request here. Anyone visiting can see it and call you. Keep
            the post short, accurate and take it down once the patient is helped.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* board */}
          <section aria-labelledby="board-heading" className="order-2 lg:order-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="board-heading" className="title-2">
                Open requests
                <span className="ml-2 font-mono text-sm text-faint">{visible.length}</span>
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  aria-label="Filter by blood group"
                  className={`${inputClass} h-9 w-auto appearance-none px-2.5 font-mono text-sm`}
                >
                  <option value="">All groups</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <select
                  value={needFilter}
                  onChange={(e) => setNeedFilter(e.target.value)}
                  aria-label="Filter by what is needed"
                  className={`${inputClass} h-9 w-auto appearance-none px-2.5 text-sm`}
                >
                  <option value="">Blood and plasma</option>
                  {DONATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={load}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-mute transition-colors duration-300 hover:text-strong"
                  aria-label="Refresh the board"
                >
                  <ArrowClockwise size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 space-y-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl border border-line bg-surface" />
                ))}
              </div>
            ) : loadError ? (
              <div className="mt-4">
                <FormAlert>{loadError}</FormAlert>
                <button
                  type="button"
                  onClick={load}
                  className="button-sm mt-3 rounded-lg border border-line px-4 py-2 text-strong"
                >
                  Try again
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
                <UsersThree size={32} weight="duotone" className="mx-auto text-faint" aria-hidden="true" />
                <p className="title-2 mt-4">No open posts match this filter</p>
                <p className="body-6 mt-2 text-mute">Change the filter, or post a request using the form.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {visible.map((post) => (
                  <li key={post.publicId} className="rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)]">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft">
                        <span className="font-mono text-base font-semibold text-brand">{post.bloodGroup}</span>
                        <span className="caption-5 text-brand">{DONATION_LABEL[post.needType]}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="title-3">{post.name}</p>
                          <span className="caption-5 rounded-full bg-surface px-2 py-0.5 font-mono text-faint">
                            {post.publicId}
                          </span>
                        </div>
                        <p className="caption-2 mt-1 flex items-start gap-1.5 text-mute">
                          <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                          {post.addressText} · {post.city}, {post.division}
                        </p>
                        <p className="caption-5 mt-1 text-faint">Needed {timeLabel(post.neededAt)}</p>
                        {post.note && <p className="body-6 mt-2 text-mute">{post.note}</p>}
                      </div>

                      <a
                        href={`tel:${post.phone.replace(/[^\d+]/g, '')}`}
                        className="button-sm flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-solid px-4 py-2 text-onbrand transition-colors duration-300 hover:bg-brand-solid-hover"
                        aria-label={`Call ${post.name} on ${phoneLabel(post.phone)}`}
                      >
                        <PhoneCall size={16} weight="bold" aria-hidden="true" />
                        Call
                      </a>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <p className="caption-5 font-mono text-mute">{phoneLabel(post.phone)}</p>
                      {post.createdAt && (
                        <p className="caption-5 text-faint">Posted {timeLabel(post.createdAt)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <section className="mt-6 rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)]">
              <h2 className="title-2">Your posts from this browser</h2>
              <p className="caption-2 mt-1 text-mute">
                Posts you create on this device are listed here so you can close them once the patient is helped.
                Closing removes the post from the public board so donors do not keep calling.
              </p>
              <p className="caption-5 mt-2 text-faint">
                The close permission is stored only in this browser. Clearing site data removes it.
              </p>

              {manageMessage && (
                <p className="caption-2 mt-3 flex items-start gap-2 text-good" role="status">
                  <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />
                  {manageMessage}
                </p>
              )}
              {manageError && (
                <div className="mt-3">
                  <FormAlert>{manageError}</FormAlert>
                </div>
              )}

              {savedPosts.length === 0 ? (
                <p className="caption-5 mt-4 rounded-xl border border-dashed border-line bg-surface px-4 py-5 text-center text-faint">
                  No saved posts yet. After you post a request, it appears here.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                  {savedPosts.map((entry) => (
                    <li key={entry.publicId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="title-4">
                          {entry.name} · {entry.city}
                        </p>
                        <p className="caption-5 mt-0.5 font-mono text-faint">{entry.publicId}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => closeSavedPost(entry)}
                        disabled={closingId === entry.publicId}
                        className="button-sm flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-strong transition-colors duration-300 hover:border-brand hover:text-brand disabled:opacity-60"
                      >
                        <CheckCircle size={15} aria-hidden="true" />
                        {closingId === entry.publicId ? 'Closing…' : 'Close post'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </section>

          {/* post form */}
          <form
            onSubmit={submit}
            noValidate
            className="order-1 h-fit rounded-2xl border border-line bg-raised p-5 shadow-[var(--shadow-card)] lg:order-2 lg:sticky lg:top-20"
          >
            <p className="caption-3 uppercase tracking-widest text-brand">Post a request</p>
            <h2 className="heading-5 mt-1">Put it on the board</h2>
            <p className="caption-2 mt-2 text-mute">
              Your name and phone number are public on this board. Do not post someone else's number without their
              consent.
            </p>

            <div className="mt-4 space-y-3">
              <FormAlert>{serverError}</FormAlert>
              {success && (
                <div className="rounded-xl border border-good/25 bg-good-soft px-4 py-3" role="status">
                  <p className="caption-2 flex items-start gap-2 text-good">
                    <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />
                    {success}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  id="eGroup"
                  label="Blood group"
                  required
                  value={form.bloodGroup}
                  onChange={set('bloodGroup')}
                  error={errors.bloodGroup}
                >
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  id="eNeed"
                  label="Needed"
                  value={form.needType}
                  onChange={set('needType')}
                >
                  {DONATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </SelectField>
              </div>

              <TextField
                id="eName"
                label="Your name"
                required
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
              />

              <TextField
                id="ePhone"
                label="Your phone number"
                type="tel"
                inputMode="numeric"
                required
                autoComplete="tel-national"
                value={form.phone}
                onChange={set('phone')}
                error={errors.phone}
                placeholder="01712 345678"
                className="font-mono"
              />

              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  id="eDivision"
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
                  id="eCity"
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

              <TextField
                id="eAddress"
                label="Hospital or address"
                required
                value={form.addressText}
                onChange={set('addressText')}
                error={errors.addressText}
                placeholder="e.g. Dhaka Medical College Hospital"
              />

              <TextField
                id="eWhen"
                label="Needed at"
                type="datetime-local"
                min={MIN_NEEDED_AT}
                value={form.neededAt}
                onChange={set('neededAt')}
                error={errors.neededAt}
                hint="Optional. Leave blank for as soon as possible."
              />

              <TextAreaField
                id="eNote"
                label="Note"
                rows={3}
                value={form.note}
                onChange={set('note')}
                error={errors.note}
                placeholder="Ward, units needed, doctor's instruction, anything a donor should know."
                hint="Optional, up to 300 characters."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="button-md mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-solid text-onbrand transition-all duration-300 hover:bg-brand-solid-hover active:scale-[0.98] disabled:opacity-70"
            >
              <PaperPlaneTilt size={17} aria-hidden="true" />
              {submitting ? 'Posting…' : 'Post to the board'}
            </button>

            <p className="caption-5 mt-3 flex items-start gap-1.5 text-faint">
              <Drop size={13} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              Never pay for blood. Report paid donors to trust@bloodlagbe.com.bd.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
