import { timingSafeEqual } from 'node:crypto'
import { query } from '../db.js'
import { sendMail } from './mail.js'

const RECIPIENT = 'kaoushikjoy@gmail.com'
const COLUMNS = ['id', 'name', 'email', 'feedback_type', 'message', 'created_at']

export function isAuthorizedFeedbackExport(req) {
  const secret = process.env.FEEDBACK_EXPORT_SECRET
  const authorization = req.headers.authorization
  if (!secret || typeof authorization !== 'string') return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const provided = Buffer.from(authorization)
  return expected.length === provided.length && timingSafeEqual(expected, provided)
}

function csvCell(value) {
  const text = String(value ?? '')
  const safe = /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export async function emailFeedbackCsv() {
  const { rows } = await query(
    `select id, name, email, feedback_type, message, created_at
       from contact_feedback
      order by created_at asc, id asc`,
  )
  const lines = [
    COLUMNS.map(csvCell).join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.name,
        row.email,
        row.feedback_type,
        row.message,
        row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      ]
        .map(csvCell)
        .join(','),
    ),
  ]
  const csv = `\uFEFF${lines.join('\r\n')}`
  const filename = `donor-koi-feedback-${new Date().toISOString().slice(0, 10)}.csv`
  const delivery = await sendMail({
    to: RECIPIENT,
    subject: `Donor Koi feedback export (${rows.length} submissions)`,
    text: `Attached is the CSV export of ${rows.length} contact feedback submissions.`,
    attachments: [{ filename, content: csv, contentType: 'text/csv; charset=utf-8' }],
  })

  return { count: rows.length, recipient: RECIPIENT, status: delivery.status }
}
