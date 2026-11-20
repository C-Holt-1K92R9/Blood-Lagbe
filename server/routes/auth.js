import { Router } from 'express'
import { query } from '../db.js'
import { asyncRoute, HttpError } from '../lib/http.js'
import {
  clearSessionCookie,
  hashPassword,
  hashToken,
  newSessionToken,
  sessionExpiry,
  setSessionCookie,
  verifyPassword,
  SESSION_COOKIE,
  parseCookies,
} from '../lib/auth.js'
import { resolveCoordinates } from '../lib/geo.js'
import { publicDonor, requireDonor, todayIso } from '../lib/session.js'
import { rateLimit } from '../lib/ratelimit.js'
import * as v from '../lib/validate.js'

const router = Router()

function assertNotFuture(dateString, field) {
  if (dateString && dateString > todayIso()) {
    throw new HttpError(400, 'Last donation date cannot be in the future.', { field })
  }
}

function readDonationFields(body) {
  const bloodGroup = v.bloodGroup(body.bloodGroup)
  const donationType = v.oneOf(body.donationType, v.NEED_TYPES, 'donation type')
  const lastDonated = v.optionalDate(body.lastDonated, 'Last donation date')
  assertNotFuture(lastDonated, 'lastDonated')
  return { bloodGroup, donationType, lastDonated }
}

async function createSession(res, donorId) {
  const token = newSessionToken()
  await query(
    `insert into sessions (token_hash, donor_id, expires_at) values ($1, $2, $3)`,
    [hashToken(token), donorId, sessionExpiry()],
  )
  setSessionCookie(res, token)
}

router.post(
  '/register',
  rateLimit({ scope: 'register', max: 8, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const body = req.body || {}
    if (body.consent !== true) {
      throw new HttpError(400, 'Please accept the terms and privacy policy to register.', { field: 'consent' })
    }

    const name = v.text(body.name, 'Full name', { min: 2, max: 80 })
    const email = v.email(body.email)
    const phone = v.phone(body.phone)
    const passwordHash = hashPassword(v.password(body.password))
    const { bloodGroup, donationType, lastDonated } = readDonationFields(body)
    const division = v.division(body.division)
    const city = v.city(division, body.city)
    const addressText = v.multiline(body.addressText, 'Home address', { min: 8, max: 300 })
    const available = body.available !== false && body.available !== 'false'

    const coords = await resolveCoordinates({
      lat: body.lat,
      lng: body.lng,
      addressText,
      city,
      division,
    })

    let donor
    try {
      const { rows } = await query(
        `insert into donors
           (name, email, phone, password_hash, blood_group, donation_type, last_donated,
            division, city, address_text, lat, lng, location_source, available)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning *`,
        [
          name,
          email,
          phone,
          passwordHash,
          bloodGroup,
          donationType,
          lastDonated,
          division,
          city,
          addressText,
          coords.lat,
          coords.lng,
          coords.source,
          available,
        ],
      )
      donor = rows[0]
    } catch (err) {
      if (err.code === '23505') {
        throw new HttpError(409, 'An account already exists with this email. Try signing in instead.', {
          field: 'email',
        })
      }
      throw err
    }

    await createSession(res, donor.id)
    res.status(201).json({ donor: publicDonor(donor) })
  }),
)

router.post(
  '/login',
  rateLimit({ scope: 'login', max: 12, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const email = v.email(req.body?.email)
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!password) throw new HttpError(400, 'Password is required.', { field: 'password' })

    const { rows } = await query(`select * from donors where lower(email) = $1 limit 1`, [email])
    const donor = rows[0]
    if (!donor || !verifyPassword(password, donor.password_hash)) {
      throw new HttpError(401, 'Email or password is incorrect.')
    }

    await createSession(res, donor.id)
    res.json({ donor: publicDonor(donor) })
  }),
)

router.post(
  '/logout',
  asyncRoute(async (req, res) => {
    const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE]
    if (token) await query(`delete from sessions where token_hash = $1`, [hashToken(token)])
    clearSessionCookie(res)
    res.json({ ok: true })
  }),
)

router.get(
  '/me',
  asyncRoute(async (req, res) => {
    res.json({ donor: publicDonor(req.donor) })
  }),
)

router.patch(
  '/me',
  requireDonor,
  asyncRoute(async (req, res) => {
    const body = req.body || {}
    const current = req.donor

    const name = body.name !== undefined ? v.text(body.name, 'Full name', { min: 2, max: 80 }) : current.name
    const phone = body.phone !== undefined ? v.phone(body.phone) : current.phone
    const bloodGroup = body.bloodGroup !== undefined ? v.bloodGroup(body.bloodGroup) : current.blood_group
    const donationType =
      body.donationType !== undefined ? v.oneOf(body.donationType, v.NEED_TYPES, 'donation type') : current.donation_type

    let lastDonated = current.last_donated
    if (body.lastDonated !== undefined) {
      lastDonated = v.optionalDate(body.lastDonated, 'Last donation date')
      assertNotFuture(lastDonated, 'lastDonated')
    }

    const division = body.division !== undefined ? v.division(body.division) : current.division
    const city = body.city !== undefined ? v.city(division, body.city) : current.city
    const addressText =
      body.addressText !== undefined
        ? v.multiline(body.addressText, 'Home address', { min: 8, max: 300 })
        : current.address_text

    const available =
      body.available === undefined
        ? current.available
        : body.available === true || body.available === 'true'

    const addressChanged =
      addressText !== current.address_text || city !== current.city || division !== current.division

    let { lat, lng, location_source: source } = current
    if (body.lat !== undefined || body.lng !== undefined) {
      const coords = await resolveCoordinates({ lat: body.lat, lng: body.lng, addressText, city, division })
      lat = coords.lat
      lng = coords.lng
      source = coords.source
    } else if (addressChanged) {
      const coords = await resolveCoordinates({ addressText, city, division })
      lat = coords.lat
      lng = coords.lng
      source = coords.source
    }

    const { rows } = await query(
      `update donors set
         name = $2, phone = $3, blood_group = $4, donation_type = $5, last_donated = $6,
         division = $7, city = $8, address_text = $9, lat = $10, lng = $11,
         location_source = $12, available = $13, updated_at = now()
       where id = $1
       returning *`,
      [current.id, name, phone, bloodGroup, donationType, lastDonated, division, city, addressText, lat, lng, source, available],
    )

    res.json({ donor: publicDonor(rows[0]) })
  }),
)

router.patch(
  '/me/location',
  requireDonor,
  asyncRoute(async (req, res) => {
    const body = req.body || {}
    const current = req.donor

    let { lat, lng, location_source: source } = current
    if (body.lat !== undefined && body.lng !== undefined) {
      const coords = await resolveCoordinates({ lat: body.lat, lng: body.lng })
      if (coords.source === 'none') throw new HttpError(400, 'Those coordinates are not valid.')
      lat = coords.lat
      lng = coords.lng
      source = 'gps'
    } else if (body.useAddress) {
      const coords = await resolveCoordinates({
        addressText: current.address_text,
        city: current.city,
        division: current.division,
      })
      lat = coords.lat
      lng = coords.lng
      source = coords.source
    } else {
      throw new HttpError(400, 'Send a latitude and longitude, or ask us to use your saved address.')
    }

    const { rows } = await query(
      `update donors set lat = $2, lng = $3, location_source = $4, updated_at = now()
        where id = $1 returning *`,
      [current.id, lat, lng, source],
    )
    res.json({ donor: publicDonor(rows[0]) })
  }),
)

router.post(
  '/me/password',
  requireDonor,
  asyncRoute(async (req, res) => {
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    if (!verifyPassword(currentPassword, req.donor.password_hash)) {
      throw new HttpError(400, 'Current password is incorrect.', { field: 'currentPassword' })
    }
    const next = hashPassword(v.password(req.body?.newPassword))
    await query(`update donors set password_hash = $2, updated_at = now() where id = $1`, [req.donor.id, next])
    await query(`delete from sessions where donor_id = $1`, [req.donor.id])
    await createSession(res, req.donor.id)
    res.json({ ok: true })
  }),
)

router.delete(
  '/me',
  requireDonor,
  asyncRoute(async (req, res) => {
    await query(`delete from donors where id = $1`, [req.donor.id])
    clearSessionCookie(res)
    res.json({ ok: true })
  }),
)

router.get(
  '/me/requests',
  requireDonor,
  asyncRoute(async (req, res) => {
    const { rows } = await query(
      `select r.public_id, r.requester_name, r.requester_phone, r.requester_email,
              r.address_text, r.division, r.city, r.blood_group, r.need_type, r.situation,
              r.needed_at, r.status, r.created_at,
              n.status as delivery_status, n.created_at as notified_at
         from request_notifications n
         join blood_requests r on r.id = n.request_id
        where n.donor_id = $1
        order by n.created_at desc
        limit 50`,
      [req.donor.id],
    )
    res.json({
      requests: rows.map((r) => ({
        publicId: r.public_id,
        requesterName: r.requester_name,
        requesterPhone: r.requester_phone,
        requesterEmail: r.requester_email,
        addressText: r.address_text,
        division: r.division,
        city: r.city,
        bloodGroup: r.blood_group,
        needType: r.need_type,
        situation: r.situation,
        neededAt: r.needed_at,
        status: r.status,
        createdAt: r.created_at,
        deliveryStatus: r.delivery_status,
        notifiedAt: r.notified_at,
      })),
    })
  }),
)

export default router
