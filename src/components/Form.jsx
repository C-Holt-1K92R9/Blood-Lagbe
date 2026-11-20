import { useId, useState } from 'react'
import { Crosshair, X } from '@phosphor-icons/react'
import { DIVISIONS, citiesOf } from '../../shared/bd.js'
import { dhakaDateIso, getPosition, formatCoords } from '../lib/geo.js'

export const inputClass =
  'body-3 h-11 w-full rounded-xl border border-line bg-surface px-3 placeholder:text-faint transition-colors duration-300 focus:border-brand focus:outline-none disabled:opacity-60'

export const textareaClass =
  'body-3 w-full rounded-xl border border-line bg-surface px-3 py-2.5 placeholder:text-faint transition-colors duration-300 focus:border-brand focus:outline-none'

export function Field({ id, label, error, hint, required = false, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="title-4 mb-2 block">
        {label}
        {required && (
          <span className="text-brand" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="caption-2 mt-1.5 text-brand" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="caption-5 mt-1.5 text-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextField({ id, label, error, hint, required, className, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <Field id={fieldId} label={label} error={error} hint={hint} required={required} className={className}>
      <input
        id={fieldId}
        aria-invalid={error ? 'true' : undefined}
        className={`${inputClass} ${error ? 'border-brand' : ''}`}
        {...props}
      />
    </Field>
  )
}

export function SelectField({ id, label, error, hint, required, className, children, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <Field id={fieldId} label={label} error={error} hint={hint} required={required} className={className}>
      <select
        id={fieldId}
        aria-invalid={error ? 'true' : undefined}
        className={`${inputClass} appearance-none ${error ? 'border-brand' : ''}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  )
}

export function TextAreaField({ id, label, error, hint, required, className, rows = 3, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <Field id={fieldId} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={`${textareaClass} ${error ? 'border-brand' : ''}`}
        {...props}
      />
    </Field>
  )
}

export function DivisionCityFields({ division, city, onDivision, onCity, errors = {}, required = true }) {
  const cities = citiesOf(division)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        id="division"
        label="Division"
        required={required}
        error={errors.division}
        value={division}
        onChange={(e) => {
          onDivision(e.target.value)
          onCity('')
        }}
      >
        <option value="">Select division</option>
        {DIVISIONS.map((d) => (
          <option key={d.name} value={d.name}>
            {d.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="city"
        label="City or district"
        required={required}
        error={errors.city}
        value={city}
        onChange={(e) => onCity(e.target.value)}
        disabled={!division}
        hint={!division ? 'Pick a division first.' : undefined}
      >
        <option value="">Select city</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </SelectField>
    </div>
  )
}

/* GPS capture. Value shape: { lat, lng, accuracy } or null. */
export function LocationField({ value, onChange, label = 'Current location', hint, error }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const locate = async () => {
    setBusy(true)
    setMessage('')
    try {
      const position = await getPosition()
      onChange(position)
      setMessage(`Location captured, accurate to about ${Math.round(position.accuracy)} m.`)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`rounded-xl border bg-surface p-3.5 ${error ? 'border-brand' : 'border-line'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="title-4">{label}</p>
          <p className="caption-5 mt-1 font-mono text-faint">{value ? formatCoords(value.lat, value.lng) : 'Not shared yet'}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={busy}
            className="button-sm flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-strong transition-colors duration-300 hover:border-brand hover:text-brand active:scale-[0.97] disabled:opacity-60"
          >
            <Crosshair size={16} aria-hidden="true" />
            {busy ? 'Locating…' : 'Use my location'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setMessage('')
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-mute transition-colors duration-300 hover:text-strong"
              aria-label="Clear saved location"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {message && <p className="caption-5 mt-2 text-mute">{message}</p>}
      {error && (
        <p className="caption-2 mt-2 text-brand" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="caption-5 mt-2 text-faint">{hint}</p>}
    </div>
  )
}

export function FormAlert({ children }) {
  if (!children) return null
  return (
    <div className="rounded-xl border border-brand/25 bg-brand-soft px-4 py-3" role="alert">
      <p className="caption-2 text-brand">{children}</p>
    </div>
  )
}

export function todayIso() {
  return dhakaDateIso()
}
