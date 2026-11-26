import nodemailer from 'nodemailer'
import { query, withTransaction } from '../db.js'
import { getMailCredentials } from './mail.js'
import { backoffSeconds, classifySmtpFailure } from './mailPolicy.js'
import { queueDueScheduledFollowups } from './requestWorkflow.js'
import { generateDonationCertificates } from './certificateWorker.js'

const DEFAULT_BATCH_SIZE = 5
const MAX_BATCH_SIZE = 10
const MAX_ATTEMPTS = 8
const WORKER_BUDGET_MS = 7_500
const CREDENTIAL_GAP_SECONDS = 30

function messageError(error) {
  return String(error?.message || error || 'Email delivery failed').slice(0, 2000)
}

function configuredDailyLimit() {
  const value = Number(process.env.GMAIL_DAILY_LIMIT || 450)
  if (!Number.isInteger(value) || value < 1 || value > 500) {
    throw new Error('GMAIL_DAILY_LIMIT must be an integer between 1 and 500.')
  }
  return value
}

async function ensureCredentialRows(credentials) {
  const dailyLimit = configuredDailyLimit()
  for (const credential of credentials) {
    await query(
      `insert into email_credential_state (credential_key, priority, daily_limit)
       values ($1, $2, $3)
       on conflict (credential_key) do update
         set priority = excluded.priority,
             daily_limit = excluded.daily_limit,
             updated_at = now()`,
      [credential.key, credential.priority, dailyLimit],
    )
  }
}

async function claimNextEmail() {
  return withTransaction(async (client) => {
    await client.query(
      `update email_outbox
          set status = 'PENDING',
              processing_started_at = null,
              scheduled_at = now(),
              retry_count = retry_count + 1,
              error_log = right(concat_ws(E'\\n', nullif(error_log, ''), 'Recovered stale worker claim.'), 5000)
        where status = 'PROCESSING'
          and processing_started_at < now() - interval '2 minutes'`,
    )
    const { rows } = await client.query(
      `with next_email as (
         select id
           from email_outbox
          where status = 'PENDING'
            and scheduled_at <= now()
          order by priority desc, scheduled_at, created_at
          limit 1
           for update skip locked
       )
       update email_outbox e
          set status = 'PROCESSING',
              processing_started_at = now()
         from next_email n
        where e.id = n.id
       returning e.*`,
    )
    return rows[0] || null
  })
}

async function reserveCredential(excludedKeys) {
  return withTransaction(async (client) => {
    await client.query(
      `update email_credential_state
          set sent_count = 0, window_started_at = now()
        where window_started_at <= now() - interval '24 hours'`,
    )
    const { rows } = await client.query(
      `select credential_key, priority
         from email_credential_state
        where not (credential_key = any($1::text[]))
          and sent_count < daily_limit
          and next_send_at <= now()
          and (cooldown_until is null or cooldown_until <= now())
          and (lease_until is null or lease_until <= now())
        order by priority, credential_key
          limit 1
          for update skip locked`,
      [excludedKeys],
    )
    if (!rows[0]) return null

    await client.query(
      `update email_credential_state
          set lease_until = now() + interval '2 minutes', updated_at = now()
        where credential_key = $1`,
      [rows[0].credential_key],
    )
    return rows[0]
  })
}

async function releaseCredential(credentialKey, { cooldownSeconds = 0, error = null } = {}) {
  await query(
    `update email_credential_state
        set cooldown_until = case
              when $2::integer > 0 then now() + ($2::integer * interval '1 second')
              else cooldown_until
            end,
            next_send_at = case
              when $2::integer = 0 then now() + ($3::integer * interval '1 second')
              else next_send_at
            end,
            lease_until = null,
            last_error = $4,
            updated_at = now()
      where credential_key = $1`,
    [credentialKey, cooldownSeconds, CREDENTIAL_GAP_SECONDS, error],
  )
}

async function markCredentialSent(credentialKey) {
  await query(
    `update email_credential_state
        set sent_count = case
              when window_started_at is null
                or window_started_at <= now() - interval '24 hours' then 1
              else sent_count + 1
            end,
            window_started_at = case
              when window_started_at is null
                or window_started_at <= now() - interval '24 hours' then now()
              else window_started_at
            end,
            next_send_at = now() + ($2::integer * interval '1 second'),
            cooldown_until = null,
            lease_until = null,
            last_error = null,
            updated_at = now()
      where credential_key = $1`,
    [credentialKey, CREDENTIAL_GAP_SECONDS],
  )
}

async function nextCredentialTime() {
  const { rows } = await query(
    `select min(greatest(
              now(),
              coalesce(next_send_at, now()),
              coalesce(cooldown_until, now()),
              coalesce(lease_until, now()),
              case when sent_count >= daily_limit
                   then coalesce(window_started_at, now()) + interval '24 hours'
                   else now() end
            )) as available_at
       from email_credential_state`,
  )
  return rows[0]?.available_at || null
}

async function updateOutboxFailure(email, error, { permanent = false, defer = false } = {}) {
  const detail = messageError(error)
  const nextRetryCount = email.retry_count + (defer ? 0 : 1)
  const shouldFail = permanent || (!defer && nextRetryCount >= MAX_ATTEMPTS)
  let scheduledAt

  if (!shouldFail && defer) {
    const availableAt = await nextCredentialTime()
    const minimumDelay = Date.now() + 60_000
    scheduledAt = availableAt && new Date(availableAt).getTime() > minimumDelay
      ? availableAt
      : new Date(minimumDelay)
  } else if (!shouldFail) {
    scheduledAt = new Date(Date.now() + backoffSeconds(nextRetryCount) * 1000)
  }

  await query(
    `update email_outbox
        set status = $2,
            retry_count = retry_count + case when $3::boolean then 0 else 1 end,
            scheduled_at = coalesce($4, scheduled_at),
            error = $5,
            error_log = right(concat_ws(E'\\n', nullif(error_log, ''), $5), 5000),
            processing_started_at = null
      where id = $1`,
    [email.id, shouldFail ? 'FAILED' : 'PENDING', defer, scheduledAt || null, detail],
  )
  return shouldFail ? 'failed' : 'deferred'
}

function decodeAttachments(value) {
  if (!Array.isArray(value)) return []
  return value.map((attachment) => ({
    filename: attachment.filename,
    contentType: attachment.contentType,
    content: Buffer.from(attachment.contentBase64, 'base64'),
  }))
}

async function sendWithCredential(email, credential) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: credential.email, pass: credential.password },
    connectionTimeout: 4_000,
    greetingTimeout: 4_000,
    socketTimeout: 4_000,
  })

  try {
    const from = process.env.GMAIL_FROM || process.env.MAIL_FROM || `Donor Koi <${credential.email}>`
    return await transporter.sendMail({
      from,
      to: email.recipient_email || email.to_email,
      subject: email.subject,
      text: email.body,
      html: email.body_html || undefined,
      attachments: decodeAttachments(email.attachments_json),
    })
  } finally {
    transporter.close()
  }
}

async function deliverEmail(email, credentials) {
  const excludedKeys = []
  let lastError = null
  let allFailuresRotatable = true
  let attempted = 0

  while (excludedKeys.length < credentials.length) {
    const reserved = await reserveCredential(excludedKeys)
    if (!reserved) break
    const credential = credentials.find((item) => item.key === reserved.credential_key)
    if (!credential) {
      await releaseCredential(reserved.credential_key, { error: 'Credential is not configured in the current environment.' })
      throw new Error('Email credential state contains a credential that is not configured.')
    }

    excludedKeys.push(credential.key)
    attempted += 1
    let info
    try {
      info = await sendWithCredential(email, credential)
    } catch (error) {
      lastError = error
      const classification = classifySmtpFailure(error)
      await releaseCredential(credential.key, {
        cooldownSeconds: classification.kind === 'credential' ? classification.cooldownSeconds : 0,
        error: messageError(error),
      })

      if (classification.kind === 'credential') continue
      allFailuresRotatable = false
      if (classification.kind === 'permanent') {
        return updateOutboxFailure(email, error, { permanent: true })
      }
      break
    }

    await markCredentialSent(credential.key)
    await query(
      `update email_outbox
          set status = 'SENT', provider = 'gmail', provider_id = $2,
              error = null, sent_at = now(), processing_started_at = null
        where id = $1`,
      [email.id, info.messageId || null],
    )
    return 'sent'
  }

  if (!lastError || (attempted > 0 && allFailuresRotatable)) {
    return updateOutboxFailure(email, lastError || 'No email credential is currently available.', { defer: true })
  }
  return updateOutboxFailure(email, lastError)
}

export async function processEmailOutbox({ batchSize = DEFAULT_BATCH_SIZE } = {}) {
  const followupsQueued = await queueDueScheduledFollowups()
  const certificates = await generateDonationCertificates()
  const credentials = getMailCredentials()
  if (credentials.length === 0) {
    const error = new Error('No Gmail credentials are configured; queued emails remain pending.')
    error.code = 'MAIL_CREDENTIALS_MISSING'
    throw error
  }

  const limit = Math.max(1, Math.min(MAX_BATCH_SIZE, Number(batchSize) || DEFAULT_BATCH_SIZE))
  await ensureCredentialRows(credentials)

  const result = { processed: 0, sent: 0, deferred: 0, failed: 0 }
  const startedAt = Date.now()
  while (result.processed < limit && Date.now() - startedAt < WORKER_BUDGET_MS) {
    const email = await claimNextEmail()
    if (!email) break
    result.processed += 1

    const status = await deliverEmail(email, credentials)
    result[status] += 1
  }

  const { rows } = await query(
    `select count(*)::int as pending
       from email_outbox
      where status = 'PENDING'`,
  )
  return { ...result, pending: rows[0].pending, followupsQueued, certificatesQueued: certificates.queued }
}
