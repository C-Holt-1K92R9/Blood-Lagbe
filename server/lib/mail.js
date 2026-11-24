import '../env.js'
import nodemailer from 'nodemailer'
import { query } from '../db.js'

const GMAIL_USER = process.env.GMAIL_USER || process.env.USER
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || process.env.PASS || '').replace(/\s/g, '')
const FROM = process.env.GMAIL_FROM || process.env.MAIL_FROM || (GMAIL_USER ? `Donor Koi <${GMAIL_USER}>` : undefined)

export function mailMode() {
  return GMAIL_USER && GMAIL_APP_PASSWORD ? 'gmail' : 'outbox'
}

export async function sendMail({ to, bcc, subject, text, html }) {
  const bccRecipients = Array.isArray(bcc) ? bcc.filter(Boolean) : []
  const outboxTo = bccRecipients.length ? bccRecipients.join(', ') : to
  const recipientLabel = bccRecipients.length ? `${bccRecipients.length} BCC recipients` : to
  let status = 'logged'
  let provider = 'outbox'
  let providerId = null
  let error = null

  if (mailMode() === 'gmail') {
    provider = 'gmail'
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    })

    try {
      const info = await transporter.sendMail({
        from: FROM,
        to: to || (bccRecipients.length ? GMAIL_USER : undefined),
        ...(bccRecipients.length ? { bcc: bccRecipients } : {}),
        subject,
        text,
        html,
      })
      status = 'sent'
      providerId = info.messageId || null
    } catch (err) {
      status = 'failed'
      error = err?.message || 'Gmail delivery failed'
    } finally {
      transporter.close()
    }
  }

  await query(
    `insert into email_outbox (to_email, subject, body, provider, provider_id, status, error)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [outboxTo, subject, text, provider, providerId, status, error],
  ).catch((err) => console.error('[mail] could not record outbox row:', err.message))

  if (status === 'logged') {
    console.log(`[mail] (no Gmail credentials configured) queued for ${recipientLabel}: ${subject}`)
  }
  if (status === 'failed') {
    console.error(`[mail] delivery failed for ${recipientLabel}: ${error}`)
  }

  return { status, provider, providerId, error }
}
