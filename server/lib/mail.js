import '../env.js'
import { withTransaction } from '../db.js'

const MAX_BACKUP_CREDENTIALS = 5

function readCredential(emailName, passwordName, priority) {
  const email = process.env[emailName]?.trim()
  const password = (process.env[passwordName] || '').replace(/\s/g, '')
  if (!email && !password) return null
  if (!email || !password) {
    throw new Error(`Both ${emailName} and ${passwordName} must be configured together.`)
  }
  return {
    key: email.toLowerCase(),
    email,
    password,
    priority,
  }
}

export function getMailCredentials() {
  const credentials = []
  const primary = readCredential('GMAIL_USER', 'GMAIL_APP_PASSWORD', 0)
  if (primary) credentials.push(primary)

  for (let index = 1; index <= MAX_BACKUP_CREDENTIALS; index += 1) {
    const backup = readCredential(`GMAIL_BACKUP_${index}_USER`, `GMAIL_BACKUP_${index}_APP_PASSWORD`, index)
    if (backup) credentials.push(backup)
  }

  const unique = new Set()
  for (const credential of credentials) {
    if (unique.has(credential.key)) {
      throw new Error(`The Gmail credential ${credential.email} is configured more than once.`)
    }
    unique.add(credential.key)
  }

  return credentials
}

export function mailMode() {
  const primary = process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim()
  const backup = Array.from({ length: MAX_BACKUP_CREDENTIALS }, (_, index) => index + 1).some(
    (index) => process.env[`GMAIL_BACKUP_${index}_USER`]?.trim() && process.env[`GMAIL_BACKUP_${index}_APP_PASSWORD`]?.trim(),
  )
  return primary || backup ? 'gmail' : 'outbox'
}

function serializeAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return []

  return attachments.map((attachment) => {
    if (!attachment || typeof attachment.filename !== 'string' || attachment.content === undefined) {
      throw new TypeError('Queued email attachments must include a filename and content.')
    }

    return {
      filename: attachment.filename,
      contentType: attachment.contentType || 'application/octet-stream',
      contentBase64: Buffer.isBuffer(attachment.content)
        ? attachment.content.toString('base64')
        : Buffer.from(String(attachment.content)).toString('base64'),
    }
  })
}

export async function sendMail({ to, bcc, subject, text, html, attachments, priority = 0, scheduledAt }) {
  const queuedAttachments = serializeAttachments(attachments)
  const scheduledFor = scheduledAt ? new Date(scheduledAt) : new Date()
  if (Number.isNaN(scheduledFor.getTime())) throw new TypeError('The scheduled email time is invalid.')

  const queued = await withTransaction((client) =>
    enqueueMail(client, { to, bcc, subject, text, html, attachments: queuedAttachments, priority, scheduledAt: scheduledFor }),
  )

  return {
    status: 'logged',
    provider: 'outbox',
    queued,
    error: null,
  }
}

export async function enqueueMail(client, { to, bcc, subject, text, html, attachments, priority = 0, scheduledAt }) {
  const recipients = [...new Set([...(Array.isArray(bcc) ? bcc : []), to].filter(Boolean).map(String))]
  if (recipients.length === 0) throw new TypeError('At least one email recipient is required.')

  const queuedAttachments = Array.isArray(attachments) && attachments.every((item) => item?.contentBase64)
    ? attachments
    : serializeAttachments(attachments)
  const scheduledFor = scheduledAt ? new Date(scheduledAt) : new Date()
  if (Number.isNaN(scheduledFor.getTime())) throw new TypeError('The scheduled email time is invalid.')

  for (const recipient of recipients) {
    await client.query(
      `insert into email_outbox
         (to_email, recipient_email, subject, body, body_html, attachments_json,
          provider, status, priority, scheduled_at)
       values ($1, $1, $2, $3, $4, $5::jsonb, 'gmail', 'PENDING', $6, $7)`,
      [recipient, subject, text || '', html || null, JSON.stringify(queuedAttachments), priority, scheduledFor],
    )
  }

  return recipients.length
}
