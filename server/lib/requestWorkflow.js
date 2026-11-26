import { query, withTransaction } from '../db.js'
import { hashToken, newSessionToken } from './auth.js'
import { enqueueMail } from './mail.js'
import { HttpError } from './http.js'

const IMMEDIATE_HOLD_MS = 2 * 60 * 60 * 1000
const SCHEDULED_HOLD_MS = 4 * 60 * 60 * 1000

function requestToken(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(value)) {
    throw new HttpError(401, 'A valid private request token is required.')
  }
  return value
}

export function requestResponseUrl(token) {
  const configuredUrl = process.env.PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (!configuredUrl && process.env.NODE_ENV === 'production') {
    throw new Error('PUBLIC_APP_URL is required to send scheduled request action links.')
  }
  const baseUrl = configuredUrl || 'http://localhost:5173'
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const url = new URL(base)
  url.hash = `/request-response/${token}`
  return url.toString()
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[char])

async function lockManagedRequest(client, publicId, token) {
  const { rows } = await client.query(
    `select *
       from blood_requests
      where public_id = $1
        and manage_token_hash = $2
        and manage_token_expires_at > now()
      for update`,
    [publicId, hashToken(requestToken(token))],
  )
  if (!rows[0]) throw new HttpError(404, 'This request could not be found or its private link has expired.')
  return rows[0]
}

async function eligibleDonor(client, request, donorId, { radiusOnly = false } = {}) {
  const { rows } = await client.query(
    `select d.id, d.name, d.email, d.phone, d.available
       from donors d
      where d.id = $1
        and d.blood_group = $2
        and d.donation_type = $3
        and d.varified = true
        and d.available = true
        and (d.locked_until is null or d.locked_until <= now())
        and (d.recovery_until is null or d.recovery_until <= now())
        and d.lat is not null and d.lng is not null
        and (
          d.last_donated is null
          or d.last_donated <= (now() at time zone 'Asia/Dhaka')::date
             - case when d.donation_type = 'plasma' then interval '28 days' else interval '90 days' end
        )
        and (
          6371 * 2 * asin(least(1, sqrt(
            power(sin(radians(d.lat - $4) / 2), 2) +
            cos(radians($4)) * cos(radians(d.lat)) * power(sin(radians(d.lng - $5) / 2), 2)
          ))) <= 10
          ${radiusOnly ? '' : 'or d.city = $6'}
        )
      for update`,
    radiusOnly
      ? [donorId, request.blood_group, request.need_type, request.lat, request.lng]
      : [donorId, request.blood_group, request.need_type, request.lat, request.lng, request.city],
  )
  return rows[0] || null
}

export async function holdImmediateDonor({ publicId, token, donorId, role }) {
  if (!['primary', 'backup'].includes(role)) throw new HttpError(400, 'Choose a primary or backup donor.')

  return withTransaction(async (client) => {
    const request = await lockManagedRequest(client, publicId, token)
    if (request.situation !== 'immediate' || ['fulfilled', 'expired', 'cancelled'].includes(request.status)) {
      throw new HttpError(409, 'This request is no longer accepting donor holds.')
    }

    const { rows: existingRows } = await client.query(
      `select h.id, h.role, h.status, h.hold_expires_at, d.id as donor_id, d.name, d.phone
         from request_donor_holds h
         join donors d on d.id = h.donor_id
        where h.request_id = $1 and h.donor_id = $2 and h.status = 'held'
          and h.hold_expires_at > now()
        limit 1`,
      [request.id, donorId],
    )
    if (existingRows[0]) return { hold: holdShape(existingRows[0]), existing: true }

    const { rows: roleRows } = await client.query(
      `select role from request_donor_holds
        where request_id = $1 and status = 'held' and hold_expires_at > now()`,
      [request.id],
    )
    if (roleRows.length >= 2) throw new HttpError(409, 'Two donors are already on hold for this request.')
    if (roleRows.some((row) => row.role === role)) {
      throw new HttpError(409, `A ${role} donor is already on hold for this request.`)
    }

    const donor = await eligibleDonor(client, request, donorId)
    if (!donor) throw new HttpError(409, 'This donor is no longer available. Refresh the search results and try another donor.')

    const expiresAt = new Date(Date.now() + IMMEDIATE_HOLD_MS)
    const { rows } = await client.query(
      `insert into request_donor_holds
         (request_id, donor_id, role, status, hold_expires_at)
       values ($1, $2, $3, 'held', $4)
       returning id, role, status, hold_expires_at`,
      [request.id, donor.id, role, expiresAt],
    )
    await client.query(
      `update donors
          set locked_until = $2, locked_by_request_id = $3, updated_at = now()
        where id = $1`,
      [donor.id, expiresAt, request.id],
    )
    await client.query(
      `update blood_requests set status = 'active' where id = $1`,
      [request.id],
    )
    return { hold: holdShape({ ...rows[0], donor_id: donor.id, name: donor.name, phone: donor.phone }), existing: false }
  })
}

function holdShape(row) {
  return {
    id: row.id,
    donorId: row.donor_id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    status: row.status,
    holdExpiresAt: row.hold_expires_at,
  }
}

export async function releaseImmediateHold({ publicId, token, donorId }) {
  return withTransaction(async (client) => {
    const request = await lockManagedRequest(client, publicId, token)
    const { rows } = await client.query(
      `update request_donor_holds
          set status = 'released', released_at = now()
        where request_id = $1 and donor_id = $2 and status = 'held'
        returning id`,
      [request.id, donorId],
    )
    if (!rows[0]) throw new HttpError(404, 'No active hold was found for this donor.')
    await client.query(
      `update donors
          set locked_until = null, locked_by_request_id = null, updated_at = now()
        where id = $1 and locked_by_request_id = $2`,
      [donorId, request.id],
    )
    await client.query(
      `update blood_requests r
          set status = case when exists (
            select 1 from request_donor_holds h
             where h.request_id = r.id and h.status = 'held' and h.hold_expires_at > now()
          ) then 'active' else 'searched' end
        where r.id = $1 and r.status = 'active'`,
      [request.id],
    )
    return { released: true }
  })
}

export async function getManagedRequest({ publicId, token }) {
  const hashedToken = hashToken(requestToken(token))
  const { rows: requests } = await query(
    `select public_id, requester_name, requester_phone, address_text, division, city,
            blood_group, need_type, situation, needed_at, status, created_at
       from blood_requests
      where public_id = $1 and manage_token_hash = $2 and manage_token_expires_at > now()
      limit 1`,
    [publicId, hashedToken],
  )
  if (!requests[0]) throw new HttpError(404, 'This request could not be found or its private link has expired.')

  const { rows: holds } = await query(
    `select h.id, h.donor_id, d.name, d.phone, h.role, h.status, h.hold_expires_at
       from request_donor_holds h
       join donors d on d.id = h.donor_id
       join blood_requests r on r.id = h.request_id
      where r.public_id = $1 and r.manage_token_hash = $2
        and h.status = 'held' and h.hold_expires_at > now()
      order by case h.role when 'primary' then 0 else 1 end`,
    [publicId, hashedToken],
  )
  const request = requests[0]
  return {
    request: {
      publicId: request.public_id,
      requesterName: request.requester_name,
      requesterPhone: request.requester_phone,
      addressText: request.address_text,
      division: request.division,
      city: request.city,
      bloodGroup: request.blood_group,
      needType: request.need_type,
      situation: request.situation,
      neededAt: request.needed_at,
      status: request.status,
      createdAt: request.created_at,
    },
    holds: holds.map(holdShape),
  }
}

async function confirmDonationInTransaction(client, request, donorId) {
  const { rows: existingEvents } = await client.query(
    `select id, donated_at from donation_events
      where request_id = $1 and donor_id = $2 and status = 'confirmed'
      limit 1`,
    [request.id, donorId],
  )
  if (existingEvents[0]) {
    return { confirmed: true, donatedAt: existingEvents[0].donated_at, alreadyConfirmed: true }
  }
  if (['fulfilled', 'expired', 'cancelled'].includes(request.status)) {
    throw new HttpError(409, 'This request is no longer active.')
  }
  if (request.situation === 'later' && request.needed_at && new Date(request.needed_at).getTime() > Date.now()) {
    throw new HttpError(409, 'Donation confirmation is available at the requested time.')
  }

  const { rows: holdRows } = await client.query(
    `select id, role from request_donor_holds
      where request_id = $1 and donor_id = $2 and status = 'held' and hold_expires_at > now()
      for update`,
    [request.id, donorId],
  )
  if (!holdRows[0]) throw new HttpError(409, 'This donor does not have an active hold for the request.')
  const { rows: donorRows } = await client.query(
    `select id, available from donors where id = $1 for update`,
    [donorId],
  )
  if (!donorRows[0]) throw new HttpError(404, 'Donor not found.')
  const recoveryDays = request.need_type === 'plasma' ? 28 : 90
  const { rows: eventRows } = await client.query(
    `insert into donation_events (request_id, donor_id, donated_at, confirmed_at)
     values ($1, $2, now(), now())
     returning id, donated_at`,
    [request.id, donorId],
  )
  await client.query(
    `update donors
        set last_donated = (now() at time zone 'Asia/Dhaka')::date,
            available = false,
            restore_available_after_recovery = available,
            recovery_until = now() + ($2::integer * interval '1 day'),
            locked_until = null,
            locked_by_request_id = null,
            updated_at = now()
      where id = $1`,
    [donorId, recoveryDays],
  )
  await client.query(
    `update request_donor_holds
        set status = 'completed', released_at = now()
      where id = $1`,
    [holdRows[0].id],
  )

  const { rows: backups } = await client.query(
    `select h.donor_id, d.email, d.name
       from request_donor_holds h
       join donors d on d.id = h.donor_id
      where h.request_id = $1 and h.status = 'held' and h.donor_id <> $2
      for update of h`,
    [request.id, donorId],
  )
  const backupIds = backups.map((row) => row.donor_id)
  if (backupIds.length) {
    await client.query(
      `update request_donor_holds
          set status = 'released', released_at = now()
        where request_id = $1 and donor_id = any($2::uuid[]) and status = 'held'`,
      [request.id, backupIds],
    )
    await client.query(
      `update donors
          set locked_until = null, locked_by_request_id = null, updated_at = now()
        where id = any($1::uuid[]) and locked_by_request_id = $2`,
      [backupIds, request.id],
    )
  }
  await client.query(
    `update request_notifications
        set action_status = case when donor_id = $2 then 'completed' else 'fulfilled' end
      where request_id = $1 and action_status in ('accepted','pending')`,
    [request.id, donorId],
  )
  await client.query(
    `update blood_requests set status = 'fulfilled' where id = $1`,
    [request.id],
  )

  if (request.situation === 'later') {
    for (const backup of backups) {
      await enqueueMail(client, {
        to: backup.email,
        subject: `Request ${request.public_id} has been fulfilled`,
        text: `Thank you, ${backup.name}, for being willing to help. The ${request.blood_group} ${request.need_type} request in ${request.city} has been fulfilled, so your temporary hold has been released.`,
        priority: 50,
      })
    }
  }

  return {
    confirmed: true,
    donorId,
    role: holdRows[0].role,
    donatedAt: eventRows[0].donated_at,
    recoveryUntil: new Date(Date.now() + recoveryDays * 24 * 60 * 60 * 1000),
    releasedBackupCount: backups.length,
  }
}

export async function confirmManagedDonation({ publicId, token, donorId }) {
  return withTransaction(async (client) => {
    const request = await lockManagedRequest(client, publicId, token)
    return confirmDonationInTransaction(client, request, donorId)
  })
}

export async function respondToScheduledRequest({ token, action }) {
  const rawToken = requestToken(token)
  if (!['view', 'accept', 'reject', 'confirm', 'cannot_donate'].includes(action)) {
    throw new HttpError(400, 'Choose a valid response.')
  }

  return withTransaction(async (client) => {
    const hashedToken = hashToken(rawToken)
    const { rows: references } = await client.query(
      `select id, request_id, donor_id
         from request_notifications
        where action_token_hash = $1
          and action_token_expires_at > now()
        limit 1`,
      [hashedToken],
    )
    if (!references[0]) throw new HttpError(410, 'This response link has expired or has already been replaced.')

    const { rows: requestRows } = await client.query(
      `select * from blood_requests where id = $1 for update`,
      [references[0].request_id],
    )
    const request = requestRows[0]
    if (!request || request.situation !== 'later') throw new HttpError(404, 'Scheduled request not found.')
    const { rows: notificationRows } = await client.query(
      `select * from request_notifications where id = $1 for update`,
      [references[0].id],
    )
    const notification = notificationRows[0]
    if (!notification) throw new HttpError(410, 'This response link is no longer active.')

    if (action === 'view') {
      const { rows: holds } = await client.query(
        `select role, hold_expires_at
           from request_donor_holds
          where request_id = $1 and donor_id = $2 and status = 'held'
          limit 1`,
        [request.id, notification.donor_id],
      )
      return {
        status: notification.action_status === 'accepted' && !holds[0] && request.status !== 'fulfilled'
          ? 'closed'
          : notification.action_status || 'pending',
        role: holds[0]?.role,
        holdExpiresAt: holds[0]?.hold_expires_at,
        request: {
          publicId: request.public_id,
          bloodGroup: request.blood_group,
          needType: request.need_type,
          city: request.city,
          neededAt: request.needed_at,
          requesterName: request.requester_name,
          requesterPhone: request.requester_phone,
        },
      }
    }

    if (action === 'reject') {
      if (notification.action_status === 'pending') {
        await client.query(
          `update request_notifications set action_status = 'rejected' where id = $1`,
          [notification.id],
        )
      }
      return { status: notification.action_status === 'accepted' ? 'accepted' : 'rejected' }
    }

    if (action === 'accept') {
      if (notification.action_status === 'accepted') {
        const { rows: holds } = await client.query(
          `select role, hold_expires_at from request_donor_holds
            where request_id = $1 and donor_id = $2 and status = 'held'
            limit 1`,
          [request.id, notification.donor_id],
        )
        return holds[0]
          ? { status: 'accepted', role: holds[0].role, holdExpiresAt: holds[0].hold_expires_at }
          : { status: 'fulfilled' }
      }
      if (notification.action_status !== 'pending') return { status: notification.action_status || 'closed' }
      if (
        ['fulfilled', 'expired', 'cancelled'].includes(request.status) ||
        !request.needed_at ||
        new Date(request.needed_at).getTime() + SCHEDULED_HOLD_MS <= Date.now()
      ) {
        await client.query(`update request_notifications set action_status = 'closed' where id = $1`, [notification.id])
        return { status: 'closed' }
      }

      const { rows: activeHolds } = await client.query(
        `select role from request_donor_holds
          where request_id = $1 and status = 'held' and hold_expires_at > now()`,
        [request.id],
      )
      if (activeHolds.length >= 2) {
        await client.query(`update request_notifications set action_status = 'slots_filled' where id = $1`, [notification.id])
        return { status: 'slots_filled' }
      }
      const role = activeHolds.some((hold) => hold.role === 'primary') ? 'backup' : 'primary'
      const donor = await eligibleDonor(client, request, notification.donor_id, { radiusOnly: true })
      if (!donor) {
        await client.query(`update request_notifications set action_status = 'unavailable' where id = $1`, [notification.id])
        return { status: 'unavailable' }
      }
      const holdExpiresAt = new Date(new Date(request.needed_at).getTime() + SCHEDULED_HOLD_MS)
      await client.query(
        `insert into request_donor_holds
           (request_id, donor_id, role, status, accepted_at, hold_expires_at)
         values ($1, $2, $3, 'held', now(), $4)`,
        [request.id, donor.id, role, holdExpiresAt],
      )
      await client.query(
        `update donors
            set locked_until = $2, locked_by_request_id = $3, updated_at = now()
          where id = $1`,
        [donor.id, holdExpiresAt, request.id],
      )
      await client.query(
        `update request_notifications
            set action_status = 'accepted', accepted_at = now()
          where id = $1`,
        [notification.id],
      )
      await client.query(
        `update blood_requests set status = 'active' where id = $1 and status not in ('fulfilled','expired')`,
        [request.id],
      )
      return { status: 'accepted', role, holdExpiresAt }
    }

    if (notification.action_status !== 'accepted') {
      return { status: notification.action_status || 'closed' }
    }
    if (action === 'cannot_donate') {
      const { rows: released } = await client.query(
        `update request_donor_holds
            set status = 'released', released_at = now()
          where request_id = $1 and donor_id = $2 and status = 'held'
          returning donor_id`,
        [request.id, notification.donor_id],
      )
      if (released[0]) {
        await client.query(
          `update donors
              set locked_until = null, locked_by_request_id = null, updated_at = now()
            where id = $1 and locked_by_request_id = $2`,
          [notification.donor_id, request.id],
        )
      }
      await client.query(
        `update blood_requests r
            set status = case when exists (
              select 1 from request_donor_holds h
               where h.request_id = r.id and h.status = 'held' and h.hold_expires_at > now()
            ) then 'active' else 'searched' end
          where r.id = $1 and r.status = 'active'`,
        [request.id],
      )
      await client.query(`update request_notifications set action_status = 'rejected' where id = $1`, [notification.id])
      return { status: 'released' }
    }

    return confirmDonationInTransaction(client, request, notification.donor_id)
  })
}

export async function queueDueScheduledFollowups() {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `select n.id, n.request_id, n.donor_id, n.action_token_expires_at,
              r.public_id, r.blood_group, r.need_type, r.city, r.needed_at,
              d.name, d.email
         from request_notifications n
         join blood_requests r on r.id = n.request_id
         join request_donor_holds h on h.request_id = r.id and h.donor_id = n.donor_id
         join donors d on d.id = n.donor_id
        where n.action_status = 'accepted'
          and n.followup_queued_at is null
          and h.status = 'held'
          and h.hold_expires_at > now()
          and r.situation = 'later'
          and r.needed_at <= now()
          and r.status not in ('fulfilled','expired','cancelled')
        order by r.needed_at, n.id
        limit 20
        for update of n skip locked`,
    )
    for (const row of rows) {
      const token = newSessionToken()
      const responseUrl = requestResponseUrl(token)
      const neededAt = new Date(row.needed_at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })
      const message = {
        to: row.email,
        priority: 100,
        subject: `Did you donate for request ${row.public_id}?`,
        text: [
          `Hello ${row.name},`,
          '',
          `The scheduled ${row.blood_group} ${row.need_type} request in ${row.city} has reached its requested time (${neededAt} Bangladesh time).`,
          'Please use this private link to confirm that you donated or release your hold if you could not help:',
          responseUrl,
          '',
          'Thank you for supporting your community.',
          'Donor Koi',
        ].join('\n'),
        html: `<p>Hello ${escapeHtml(row.name)},</p><p>The scheduled ${escapeHtml(row.blood_group)} ${escapeHtml(row.need_type)} request in ${escapeHtml(row.city)} has reached its requested time (${escapeHtml(neededAt)} Bangladesh time).</p><p><a href="${escapeHtml(responseUrl)}">Confirm donation or release your hold</a></p><p>Thank you for supporting your community.<br>Donor Koi</p>`,
      }
      await enqueueMail(client, message)
      await client.query(
        `update request_notifications
            set followup_queued_at = now(),
                action_token_hash = $2
          where id = $1`,
        [row.id, hashToken(token)],
      )
    }
    return rows.length
  })
}
