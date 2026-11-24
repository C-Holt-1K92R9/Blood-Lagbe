import { HttpError } from './http.js'
import { isKnownCity } from '../../shared/bd.js'
import { isApprovedEmail } from '../../shared/email.js'

export const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
export const NEED_TYPES = ['blood', 'plasma']
export const SITUATIONS = ['immediate', 'later']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function text(value, field, { min = 1, max = 500, required = true } = {}) {
  const clean = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!clean) {
    if (required) throw new HttpError(400, `${field} is required.`, { field })
    return ''
  }
  if (clean.length < min) throw new HttpError(400, `${field} looks too short.`, { field })
  if (clean.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer.`, { field })
  return clean
}

export function multiline(value, field, { min = 5, max = 500, required = true } = {}) {
  const clean = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!clean) {
    if (required) throw new HttpError(400, `${field} is required.`, { field })
    return ''
  }
  if (clean.length < min) throw new HttpError(400, `${field} looks too short.`, { field })
  if (clean.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer.`, { field })
  return clean
}

export function email(value, field = 'Email', required = true) {
  const clean = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!clean) {
    if (required) throw new HttpError(400, `${field} is required.`, { field })
    return ''
  }
  if (!EMAIL_RE.test(clean) || clean.length > 254) {
    throw new HttpError(400, 'Enter a valid email address, e.g. name@example.com.', { field })
  }
  return clean
}

export function registrationEmail(value) {
  const clean = email(value)
  if (!isApprovedEmail(clean)) {
    throw new HttpError(400, 'Use a Gmail, Yahoo, or Outlook email address.', { field: 'email' })
  }
  return clean
}

/* Accepts 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX and stores a single
   canonical +880 form. */
export function phone(value, field = 'Mobile number') {
  const digits = String(value ?? '').replace(/[^\d+]/g, '')
  const national = digits
    .replace(/^\+?880/, '')
    .replace(/^0?(1[3-9]\d{8})$/, '$1')
  if (!/^1[3-9]\d{8}$/.test(national)) {
    throw new HttpError(400, 'Enter a valid Bangladeshi mobile number, e.g. 01712 345678.', { field })
  }
  return `+880${national}`
}

export function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new HttpError(400, `Choose a valid ${field.toLowerCase()}.`, { field })
  }
  return value
}

export function bloodGroup(value) {
  return oneOf(value, BLOOD_GROUPS, 'blood group')
}

export function division(value) {
  return text(value, 'Division', { max: 40 })
}

export function city(divisionName, value) {
  const clean = text(value, 'City', { max: 60 })
  if (!isKnownCity(divisionName, clean)) {
    throw new HttpError(400, 'Pick a city from the list for that division.', { field: 'city' })
  }
  return clean
}

export function optionalDate(value, field) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `${field} is not a valid date.`, { field })
  return d.toISOString().slice(0, 10)
}

/* The browser's datetime-local input sends a naive value such as
   "2026-11-22T19:30". The UI promises Bangladesh time, so a value without an
   explicit offset is interpreted as Asia/Dhaka (UTC+06:00, no DST) instead of
   whatever timezone the server process happens to run in. */
const DHAKA_OFFSET = '+06:00'
const NAIVE_DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/

export function futureOrNow(value, field) {
  if (!value) return null
  const raw = String(value).trim()
  if (!raw) return null

  const normalized = NAIVE_DATETIME_RE.test(raw)
    ? `${raw.replace(' ', 'T')}${DHAKA_OFFSET}`
    : raw
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `${field} is not a valid date and time.`, { field })

  // Two minutes of slack covers the gap between picking a time and submitting.
  if (d.getTime() < Date.now() - 2 * 60_000) {
    throw new HttpError(400, `${field} must be in the future.`, { field })
  }
  return d.toISOString()
}

export function password(value) {
  const clean = typeof value === 'string' ? value : ''
  if (clean.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.', { field: 'password' })
  if (clean.length > 200) throw new HttpError(400, 'Password is too long.', { field: 'password' })
  return clean
}
