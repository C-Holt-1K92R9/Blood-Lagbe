import { Router } from 'express'
import { query, withTransaction } from '../db.js'
import { asyncRoute, HttpError } from '../lib/http.js'
import { resolveCoordinates } from '../lib/geo.js'
import { publicId } from '../lib/ids.js'
import { hashToken, newSessionToken } from '../lib/auth.js'
import { enqueueMail, sendMail } from '../lib/mail.js'
import {
  confirmManagedDonation,
  getManagedRequest,
  holdImmediateDonor,
  releaseImmediateHold,
  requestResponseUrl,
  respondToScheduledRequest,
} from '../lib/requestWorkflow.js'
import { rateLimit } from '../lib/ratelimit.js'
import * as v from '../lib/validate.js'

const router = Router()

const RADIUS_KM = 10
const MAX_EMAILS = 10
const REQUEST_MANAGEMENT_DAYS = 7
const SCHEDULED_HOLD_MS = 4 * 60 * 60 * 1000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const dhakaDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dhaka',
  dateStyle: 'medium',
  timeStyle: 'short',
})

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/* Every value below comes from a form submission. Escape it before it is put
   into a donor's inbox so a request cannot inject markup into the email. */
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])

function formatNeededAt(value) {
  if (!value) return 'As soon as possible'
  return `${dhakaDate.format(new Date(value))} (Bangladesh time)`
}

function emailBody({ request, responseUrl }) {
  const when = request.situation === 'later' ? formatNeededAt(request.needed_at) : 'Immediately, today'
  return {
    subject: `${request.blood_group} ${request.need_type} needed in ${request.city} (${request.public_id})`,
    text: [
      'Hello,',
      '',
      `A patient near you needs ${request.blood_group} ${request.need_type}.`,
      '',
      `Needed: ${when}`,
      `Hospital or address: ${request.address_text}`,
      `Area: ${request.city}, ${request.division}`,
      '',
      'Requester details',
      `Name: ${request.requester_name}`,
      `Phone: ${request.requester_phone}`,
      request.requester_email ? `Email: ${request.requester_email}` : null,
      '',
      ...(responseUrl
        ? ['If you can help, open the private response link to accept or decline this request:', responseUrl]
        : ['If you are able to help, call the requester directly. Never accept money or gifts for a donation.']),
      '',
      `Reference: ${request.public_id}`,
      '',
      'Donor Koi',
    ]
      .filter((line) => line !== null)
      .join('\n'),
  }
}

function emailHtml({ request, responseUrl }) {
  const when = request.situation === 'later' ? formatNeededAt(request.needed_at) : 'Immediately, today'
  const phoneHref = request.requester_phone.replace(/[^\d+]/g, '')
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fafaf8;font-family:Arial,Helvetica,sans-serif;color:#141414;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e6e1;border-radius:16px;">
    <tr><td style="padding:28px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d92d20;font-weight:700;">Donor Koi request</p>
      <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;">${esc(request.blood_group)} ${esc(request.need_type)} needed in ${esc(request.city)}</h1>
      <p style="margin:14px 0 0;font-size:15px;line-height:1.6;">Hello, a patient near you needs ${esc(request.need_type)}. ${responseUrl ? 'Open the private response link to accept or decline this request.' : 'If you can help, call the requester directly.'}</p>
      <table role="presentation" style="margin:20px 0 0;width:100%;font-size:14px;line-height:1.6;">
        <tr><td style="padding:4px 0;color:#57534e;width:110px;">Needed</td><td style="padding:4px 0;font-weight:600;">${esc(when)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534e;">Location</td><td style="padding:4px 0;font-weight:600;">${esc(request.address_text)}, ${esc(request.city)}, ${esc(request.division)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534e;">Requester</td><td style="padding:4px 0;font-weight:600;">${esc(request.requester_name)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534e;">Phone</td><td style="padding:4px 0;font-weight:600;">${esc(request.requester_phone)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534e;">Reference</td><td style="padding:4px 0;font-family:monospace;">${esc(request.public_id)}</td></tr>
      </table>
      <p style="margin:22px 0 0;">
        ${
          responseUrl
            ? `<a href="${esc(responseUrl)}" style="display:inline-block;background:#d92d20;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Respond to this request</a>`
            : `<a href="tel:${esc(phoneHref)}" style="display:inline-block;background:#d92d20;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">Call ${esc(request.requester_name)}</a>`
        }
      </p>
      <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6e6a61;">Donation is voluntary and unpaid. Never accept money or gifts for a donation. If this request looks suspicious, write to trust@donorkoi.2bd.net.</p>
    </td></tr>
  </table>
</body></html>`
}

/* The request form asks for an optional email "for a receipt". Send that
   receipt for both immediate and scheduled requests so the promise is real. */
function receiptMessage({ request, matchedCount, emailedCount }) {
  const when = request.situation === 'later' ? formatNeededAt(request.needed_at) : 'Immediately, today'
  const subject = `Donor Koi request ${request.public_id} received`
  const text = [
    `Hello ${request.requester_name.split(' ')[0]},`,
    '',
    `We received your ${request.blood_group} ${request.need_type} request.`,
    '',
    `Reference: ${request.public_id}`,
    `Needed: ${when}`,
    `Location: ${request.address_text}, ${request.city}, ${request.division}`,
    `Eligible donors matched: ${matchedCount}`,
    '',
    request.situation === 'immediate'
      ? 'The donor list with call buttons is on the search page. Call the closest donor directly. If nobody answers, post the request on the emergency board.'
      : matchedCount > 0
        ? emailedCount > 0
          ? `We queued individual request emails for ${emailedCount} ${emailedCount === 1 ? 'donor' : 'donors'} within 10 km. They can accept or decline using a private link.`
          : 'No eligible donor with an email address was found within 10 km. Call the listed donors directly if the need is urgent.'
        : 'No eligible donor is in the network for this request right now. Post it on the emergency board so the wider community can respond.',
    '',
    'Keep this reference for follow-up. In a life-threatening emergency, call 999 first.',
    '',
    'Donor Koi',
  ].join('\n')

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fafaf8;font-family:Arial,Helvetica,sans-serif;color:#141414;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e6e1;border-radius:16px;">
    <tr><td style="padding:28px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#d92d20;font-weight:700;">Request received</p>
      <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;">Your ${esc(request.blood_group)} ${esc(request.need_type)} request is registered</h1>
      <p style="margin:14px 0 0;font-size:15px;line-height:1.6;">Thank you, ${esc(request.requester_name.split(' ')[0])}. We saved your request and matched it against eligible donors.</p>
      <table role="presentation" style="margin:20px 0 0;width:100%;font-size:14px;line-height:1.6;">
        <tr><td style="padding:4px 0;color:#57534e;width:130px;">Reference</td><td style="padding:4px 0;font-family:monospace;">${esc(request.public_id)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534e;">Needed</td><td style="padding:4px 0;font-weight:600;">${esc(when)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534e;">Location</td><td style="padding:4px 0;font-weight:600;">${esc(request.address_text)}, ${esc(request.city)}, ${esc(request.division)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534e;">Donors matched</td><td style="padding:4px 0;font-weight:600;">${matchedCount}</td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">${
        request.situation === 'immediate'
          ? 'The donor list with call buttons is on the search page. Call the closest donor directly. If nobody answers, post the request on the emergency board.'
          : matchedCount > 0
            ? emailedCount > 0
              ? `We queued individual request emails for ${emailedCount} ${emailedCount === 1 ? 'donor' : 'donors'} within 10 km. They can accept or decline using a private link.`
              : 'No eligible donor with an email address was found within 10 km. Call the listed donors directly if the need is urgent.'
            : 'No eligible donor is in the network for this request right now. Post it on the emergency board so the wider community can respond.'
      }</p>
      <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6e6a61;">Keep this reference for follow-up. In a life-threatening emergency, call 999 first. Never pay for blood.</p>
    </td></tr>
  </table>
</body></html>`

  return { subject, text, html }
}

router.post(
  '/search',
  rateLimit({ scope: 'search', max: 20, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const body = req.body || {}

    const bloodGroup = v.bloodGroup(body.bloodGroup)
    const needType = v.oneOf(body.needType, v.NEED_TYPES, 'need type')
    const situation = v.oneOf(body.situation, v.SITUATIONS, 'situation type')

    const requesterName = v.text(body.requesterName, 'Your name', { min: 2, max: 80 })
    const requesterPhone = v.phone(body.requesterPhone, 'Your phone number')
    const requesterEmail = v.email(body.requesterEmail, 'Your email', false)
    const addressText = v.multiline(body.addressText, 'Hospital or address', { min: 6, max: 300 })
    const division = v.division(body.division)
    const city = v.city(division, body.city)

    let neededAt = null
    if (situation === 'later') {
      neededAt = v.futureOrNow(body.neededAt, 'Needed at')
      if (!neededAt) throw new HttpError(400, 'Choose the date and time blood is needed.', { field: 'neededAt' })
    }

    const origin = await resolveCoordinates({
      lat: body.lat,
      lng: body.lng,
      addressText,
      city,
      division,
    })
    /* A 10 km search is only meaningful from a real fix or a geocoded address.
       The district centroid is too coarse for the radius, so ask for a better
       address or the device's location instead of silently searching wrong. */
    if (origin.lat === null || origin.lng === null || origin.source === 'fallback' || origin.source === 'none') {
      throw new HttpError(
        400,
        'We could not pinpoint that address. Share your current location or add a nearby landmark, then try again.',
        { field: 'lat' },
      )
    }

    const id = publicId('REQ')
    const manageToken = newSessionToken()
    const manageExpiryAt = new Date(
      Math.max(Date.now() + REQUEST_MANAGEMENT_DAYS * 24 * 60 * 60 * 1000, (neededAt ? Date.parse(neededAt) : Date.now()) + REQUEST_MANAGEMENT_DAYS * 24 * 60 * 60 * 1000),
    )
    const workflow = await withTransaction(async (client) => {
      const { rows: requestRows } = await client.query(
        `insert into blood_requests
           (public_id, requester_name, requester_phone, requester_email, address_text, division, city,
            lat, lng, blood_group, need_type, situation, needed_at, status,
            manage_token_hash, manage_token_expires_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'searched',$14,$15)
         returning *`,
        [
          id,
          requesterName,
          requesterPhone,
          requesterEmail || null,
          addressText,
          division,
          city,
          origin.lat,
          origin.lng,
          bloodGroup,
          needType,
          situation,
          neededAt,
          hashToken(manageToken),
          manageExpiryAt,
        ],
      )
      const request = requestRows[0]
      const { rows } = await client.query(
        `with candidates as (
           select d.id, d.name, d.email, d.phone, d.blood_group, d.donation_type, d.last_donated,
                  d.city, d.division, d.available, d.location_source,
                  6371 * 2 * asin(least(1, sqrt(
                    power(sin(radians(d.lat - $1) / 2), 2) +
                    cos(radians($1)) * cos(radians(d.lat)) * power(sin(radians(d.lng - $2) / 2), 2)
                  ))) as distance_km
             from donors d
            where d.blood_group = $3
              and d.donation_type = $4
              and d.lat is not null
              and d.lng is not null
              and d.available = true
              and d.varified = true
              and (d.locked_until is null or d.locked_until <= now())
              and (d.recovery_until is null or d.recovery_until <= now())
              and (
                d.last_donated is null
                or d.last_donated <= (now() at time zone 'Asia/Dhaka')::date - case when d.donation_type = 'plasma'
                                                                                   then interval '28 days'
                                                                                   else interval '90 days' end
              )
         )
         select * from candidates
          where distance_km <= $5 or city = $6
          order by (distance_km <= $5) desc, distance_km asc
          limit 60`,
        [origin.lat, origin.lng, bloodGroup, needType, RADIUS_KM, city],
      )
      const donors = rows.map((donor) => ({
        id: donor.id,
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.blood_group,
        donationType: donor.donation_type,
        city: donor.city,
        distanceKm: Math.round(Number(donor.distance_km) * 10) / 10,
        withinRadius: Number(donor.distance_km) <= RADIUS_KM,
        lastDonated: donor.last_donated || null,
        phone: situation === 'immediate' ? donor.phone : null,
        notifyStatus: null,
      }))

      let queued = 0
      let emailStatus = 'not_requested'
      if (situation === 'later') {
        const targets = donors.filter((donor) => donor.withinRadius && donor.email).slice(0, MAX_EMAILS)
        const deliveryByDonor = new Map()
        const actionExpiresAt = new Date(Date.parse(request.needed_at) + SCHEDULED_HOLD_MS)
        for (const donor of targets) {
          const actionToken = newSessionToken()
          const responseUrl = requestResponseUrl(actionToken)
          const payload = { request, responseUrl }
          const message = emailBody(payload)
          await client.query(
            `insert into request_notifications
               (request_id, donor_id, channel, status, action_token_hash, action_token_expires_at, action_status)
             values ($1, $2, 'email', 'logged', $3, $4, 'pending')`,
            [request.id, donor.id, hashToken(actionToken), actionExpiresAt],
          )
          await enqueueMail(client, {
            to: donor.email,
            subject: message.subject,
            text: message.text,
            html: emailHtml(payload),
            priority: 10,
          })
          deliveryByDonor.set(donor.id, 'logged')
        }
        queued = targets.length
        emailStatus = queued > 0 ? 'logged' : 'not_requested'
        for (const donor of donors) donor.notifyStatus = deliveryByDonor.get(donor.id) || null
      }

      await client.query(
        `update blood_requests set matched_count = $2, status = $3 where id = $1`,
        [request.id, donors.length, emailStatus],
      )
      return { request, donors, queued, emailStatus }
    })
    const { request, donors, queued, emailStatus } = workflow
    const emailed = 0

    let receiptStatus = 'not_requested'
    if (requesterEmail) {
      const message = receiptMessage({ request, matchedCount: donors.length, emailedCount: queued })
      const result = await sendMail({ to: requesterEmail, ...message })
      receiptStatus = result.status
    }

    res.json({
      request: {
        publicId: request.public_id,
        managementToken: manageToken,
        bloodGroup,
        needType,
        situation,
        neededAt: request.needed_at,
        city,
        division,
        createdAt: request.created_at,
      },
      origin: { lat: origin.lat, lng: origin.lng, source: origin.source },
      radiusKm: RADIUS_KM,
      donors,
      emails: {
        requested: situation === 'later',
        sent: emailed,
        queued,
        status: emailStatus,
        receipt: receiptStatus,
      },
    })
  }),
)

router.post(
  '/:publicId/manage',
  rateLimit({ scope: 'request-manage', max: 30, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    res.json(await getManagedRequest({ publicId: req.params.publicId, token: req.body?.token }))
  }),
)

router.post(
  '/:publicId/holds',
  rateLimit({ scope: 'request-hold', max: 20, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const donorId = req.body?.donorId
    if (typeof donorId !== 'string' || !UUID_RE.test(donorId)) {
      throw new HttpError(400, 'Choose a valid donor.')
    }
    const hold = await holdImmediateDonor({
      publicId: req.params.publicId,
      token: req.body?.token,
      donorId,
      role: req.body?.role,
    })
    res.json(hold)
  }),
)

router.delete(
  '/:publicId/holds/:donorId',
  rateLimit({ scope: 'request-hold', max: 20, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    if (!UUID_RE.test(req.params.donorId)) throw new HttpError(400, 'Choose a valid donor.')
    res.json(
      await releaseImmediateHold({
        publicId: req.params.publicId,
        token: req.body?.token,
        donorId: req.params.donorId,
      }),
    )
  }),
)

router.post(
  '/:publicId/confirm',
  rateLimit({ scope: 'request-manage', max: 10, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const donorId = req.body?.donorId
    if (typeof donorId !== 'string' || !UUID_RE.test(donorId)) {
      throw new HttpError(400, 'Choose a valid donor.')
    }
    res.json(
      await confirmManagedDonation({
        publicId: req.params.publicId,
        token: req.body?.token,
        donorId,
      }),
    )
  }),
)

router.post(
  '/scheduled-response',
  rateLimit({ scope: 'scheduled-response', max: 30, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    res.json(await respondToScheduledRequest({ token: req.body?.token, action: req.body?.action }))
  }),
)

router.get(
  '/:publicId',
  asyncRoute(async (req, res) => {
    const { rows } = await query(
      `select public_id, blood_group, need_type, situation, needed_at, city, division,
              status, matched_count, created_at
         from blood_requests where public_id = $1 limit 1`,
      [req.params.publicId],
    )
    if (!rows[0]) throw new HttpError(404, 'Request not found.')
    const r = rows[0]
    res.json({
      request: {
        publicId: r.public_id,
        bloodGroup: r.blood_group,
        needType: r.need_type,
        situation: r.situation,
        neededAt: r.needed_at,
        city: r.city,
        division: r.division,
        status: r.status,
        matchedCount: r.matched_count,
        createdAt: r.created_at,
      },
    })
  }),
)

export default router
