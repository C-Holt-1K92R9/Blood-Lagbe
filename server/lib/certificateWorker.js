import { randomBytes } from 'node:crypto'
import { withTransaction } from '../db.js'
import { enqueueMail } from './mail.js'
import { createCertificateSvg, donationDateLabel } from './certificateArtwork.js'

const DEFAULT_BATCH_SIZE = 25
const MAX_BATCH_SIZE = 100

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[char])

function certificateNumber(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '')
  return `DK-${day}-${randomBytes(5).toString('hex').toUpperCase()}`
}

export async function generateDonationCertificates({ batchSize = DEFAULT_BATCH_SIZE } = {}) {
  const limit = Math.max(1, Math.min(MAX_BATCH_SIZE, Number(batchSize) || DEFAULT_BATCH_SIZE))

  return withTransaction(async (client) => {
    const { rows: events } = await client.query(
      `select e.id as event_id, e.donor_id, e.donated_at, d.name, d.email
         from donation_events e
         join donors d on d.id = e.donor_id
        where e.status = 'confirmed'
          and not exists (
            select 1 from certificates c where c.donation_event_id = e.id
          )
        order by e.created_at, e.id
        limit $1
        for update of e skip locked`,
      [limit],
    )

    let queued = 0
    for (const event of events) {
      const number = certificateNumber(new Date(event.donated_at))
      const fileName = `Donor-Koi-${number}.svg`
      const artwork = Buffer.from(
        createCertificateSvg({
          donorName: event.name,
          donatedAt: event.donated_at,
          certificateNumber: number,
        }),
        'utf8',
      )
      const { rows: certificates } = await client.query(
        `insert into certificates
           (donation_event_id, donor_id, certificate_number, status, content_type,
            file_name, artifact_data, issued_at)
         values ($1, $2, $3, 'ready', 'image/svg+xml', $4, $5, now())
         on conflict (donation_event_id) do nothing
         returning id`,
        [event.event_id, event.donor_id, number, fileName, artwork],
      )
      if (!certificates[0]) continue

      const dateLabel = donationDateLabel(event.donated_at)
      await enqueueMail(client, {
        to: event.email,
        subject: 'Thank you for donating with Donor Koi',
        text: [
          `Hello ${event.name},`,
          '',
          `Thank you for your voluntary donation on ${dateLabel}. Your honorary donor certificate is attached.`,
          `Certificate number: ${number}`,
          '',
          'Only licensed medical professionals can determine donation eligibility.',
          'Donor Koi',
        ].join('\n'),
        html: `<p>Hello ${escapeHtml(event.name)},</p><p>Thank you for your voluntary donation on ${escapeHtml(dateLabel)}. Your honorary donor certificate is attached.</p><p>Certificate number: <strong>${escapeHtml(number)}</strong></p><p>Only licensed medical professionals can determine donation eligibility.</p><p>Donor Koi</p>`,
        attachments: [{ filename: fileName, contentType: 'image/svg+xml', content: artwork }],
        priority: 10,
      })
      queued += 1
    }

    return { queued, checked: events.length }
  })
}
