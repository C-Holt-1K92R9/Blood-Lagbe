import { query } from '../db.js'
import { hashToken, parseCookies, SESSION_COOKIE } from './auth.js'

const DONATION_INTERVAL_DAYS = { blood: 90, plasma: 28 }

function addDays(dateString, days) {
  const d = new Date(`${dateString}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/* Donation dates are calendar dates in Bangladesh, not UTC. Using the UTC date
   would mark a donation a day early or late between midnight and 6 am Dhaka. */
const DHAKA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function todayIso() {
  return DHAKA_DATE.format(new Date())
}

export function eligibilityFor(donationType, lastDonated, available) {
  const interval = DONATION_INTERVAL_DAYS[donationType] || 90
  const nextEligibleAt = lastDonated ? addDays(lastDonated, interval) : null
  const daysUntilEligible = nextEligibleAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${nextEligibleAt}T00:00:00Z`) - new Date(`${todayIso()}T00:00:00Z`)) / 86_400_000,
        ),
      )
    : 0
  const reason = !available ? 'unavailable' : daysUntilEligible > 0 ? 'cooldown' : 'eligible'
  return {
    eligible: Boolean(available) && daysUntilEligible === 0,
    nextEligibleAt,
    daysUntilEligible,
    intervalDays: interval,
    reason,
  }
}

export function publicDonor(row) {
  if (!row) return null
  const eligibility = eligibilityFor(row.donation_type, row.last_donated, row.available)
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    bloodGroup: row.blood_group,
    donationType: row.donation_type,
    lastDonated: row.last_donated || null,
    division: row.division,
    city: row.city,
    addressText: row.address_text,
    lat: row.lat,
    lng: row.lng,
    locationSource: row.location_source,
    available: row.available,
    createdAt: row.created_at,
    eligibility,
  }
}

export async function attachDonor(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || '')
    const token = cookies[SESSION_COOKIE]
    if (!token) return next()

    const { rows } = await query(
      `select d.*, s.expires_at
         from sessions s
         join donors d on d.id = s.donor_id
        where s.token_hash = $1 and s.expires_at > now()
        limit 1`,
      [hashToken(token)],
    )
    if (rows[0]) req.donor = rows[0]
    return next()
  } catch (err) {
    return next(err)
  }
}

export function requireDonor(req, res, next) {
  if (!req.donor) {
    return res.status(401).json({ error: 'Please sign in to your donor account.' })
  }
  return next()
}
