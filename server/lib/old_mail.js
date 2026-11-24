import { query } from '../db.js'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const FROM = process.env.MAIL_FROM || 'Donor Koi <onboarding@resend.dev>'
const SENDER_EMAIL = FROM.match(/<([^>]+)>/)?.[1] || FROM

export function mailMode() {
  return process.env.RESEND_API_KEY ? 'resend' : 'outbox'
}

/* Always writes to email_outbox so the flow is auditable (and inspectable when
   no provider key is configured). When RESEND_API_KEY is present the message is
   also handed to Resend. */
export async function sendMail({ to, bcc, subject, text, html }) {
  const key = process.env.RESEND_API_KEY
  const bccRecipients = Array.isArray(bcc) ? bcc.filter(Boolean) : []
  const outboxTo = bccRecipients.length ? bccRecipients.join(', ') : to
  const recipientLabel = bccRecipients.length ? `${bccRecipients.length} BCC recipients` : to
  let status = 'logged'
  let provider = 'outbox'
  let providerId = null
  let error = null

  if (key) {
    provider = 'resend'
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM,
          to: [to || (bccRecipients.length ? SENDER_EMAIL : undefined)].filter(Boolean),
          ...(bccRecipients.length ? { bcc: bccRecipients } : {}),
          subject,
          text,
          html,
        }),
        signal: AbortSignal.timeout(10_000),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        status = 'sent'
        providerId = data.id || null
      } else {
        status = 'failed'
        error = data.message || `Resend responded ${res.status}`
      }
    } catch (err) {
      status = 'failed'
      error = err?.message || 'Email provider unreachable'
    }
  }

  await query(
    `insert into email_outbox (to_email, subject, body, provider, provider_id, status, error)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [outboxTo, subject, text, provider, providerId, status, error],
  ).catch((err) => console.error('[mail] could not record outbox row:', err.message))

  if (status === 'logged') {
    console.log(`[mail] (no provider configured) queued for ${recipientLabel}: ${subject}`)
  }
  if (status === 'failed') {
    console.error(`[mail] delivery failed for ${recipientLabel}: ${error}`)
  }

  return { status, provider, providerId, error }
}
