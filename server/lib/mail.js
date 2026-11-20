import { query } from '../db.js'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const FROM = process.env.MAIL_FROM || 'Blood Lagbe <onboarding@resend.dev>'

export function mailMode() {
  return process.env.RESEND_API_KEY ? 'resend' : 'outbox'
}

/* Always writes to email_outbox so the flow is auditable (and inspectable when
   no provider key is configured). When RESEND_API_KEY is present the message is
   also handed to Resend. */
export async function sendMail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY
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
        body: JSON.stringify({ from: FROM, to: [to], subject, text, html }),
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
    [to, subject, text, provider, providerId, status, error],
  ).catch((err) => console.error('[mail] could not record outbox row:', err.message))

  if (status === 'logged') {
    console.log(`[mail] (no provider configured) queued for ${to}: ${subject}`)
  }
  if (status === 'failed') {
    console.error(`[mail] delivery failed for ${to}: ${error}`)
  }

  return { status, provider, providerId, error }
}
