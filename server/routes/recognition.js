import { Router } from 'express'
import { query } from '../db.js'
import { asyncRoute, HttpError } from '../lib/http.js'
import { requireDonor } from '../lib/session.js'
import { rateLimit } from '../lib/ratelimit.js'
import { createCertificatePdf } from '../lib/certificateArtwork.js'

const router = Router()
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

router.get(
  '/honorary-donors',
  rateLimit({ scope: 'honorary-donors', max: 60, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const { rows } = await query(
      `select d.name, count(e.id)::int as donation_count
         from donors d
         left join donation_events e
           on e.donor_id = d.id and e.status = 'confirmed'
        where d.varified = true and d.show_on_honor_wall = true
        group by d.id, d.name, d.available
       having d.available = true or count(e.id) > 0
        order by donation_count desc, d.name asc
        limit 100`,
    )
    res.json({
      donors: rows.map((row) => ({
        name: row.name,
        donationCount: row.donation_count,
      })),
    })
  }),
)

router.get(
  '/me/achievements',
  requireDonor,
  asyncRoute(async (req, res) => {
    const { rows: totals } = await query(
      `select count(*)::int as confirmed_donations
         from donation_events
        where donor_id = $1 and status = 'confirmed'`,
      [req.donor.id],
    )
    const { rows: events } = await query(
      `select e.donated_at, c.id as certificate_id, c.certificate_number,
              c.status as certificate_status, c.issued_at
         from donation_events e
         left join certificates c on c.donation_event_id = e.id
        where e.donor_id = $1 and e.status = 'confirmed'
        order by e.donated_at desc`,
      [req.donor.id],
    )
    res.json({
      confirmedDonations: totals[0]?.confirmed_donations || 0,
      certificates: events.map((event) => ({
        donatedAt: event.donated_at,
        certificateNumber: event.certificate_number || null,
        status: event.certificate_status || 'pending',
        issuedAt: event.issued_at || null,
        downloadUrl: event.certificate_id && event.certificate_status === 'ready'
          ? `/api/me/certificates/${event.certificate_id}/download`
          : null,
      })),
      showOnHonorWall: Boolean(req.donor.show_on_honor_wall),
    })
  }),
)

router.get(
  '/me/certificates/:certificateId/download',
  requireDonor,
  asyncRoute(async (req, res) => {
    if (!UUID_RE.test(req.params.certificateId)) throw new HttpError(404, 'Certificate not found.')
    const { rows } = await query(
      `select file_name, content_type, artifact_data
         from certificates
        where id = $1 and donor_id = $2 and status = 'ready'
        limit 1`,
      [req.params.certificateId, req.donor.id],
    )
    if (!rows[0] || !rows[0].artifact_data) throw new HttpError(404, 'Certificate not found.')

    let fileName = String(rows[0].file_name || 'donor-koi-certificate.pdf').replace(/[^A-Za-z0-9_.-]/g, '-')
    let contentType = rows[0].content_type || 'application/pdf'
    let artifact = rows[0].artifact_data
    const isSvg = contentType === 'image/svg+xml' || fileName.toLowerCase().endsWith('.svg')
    if (isSvg) {
      const svg = Buffer.isBuffer(artifact) ? artifact.toString('utf8') : String(artifact)
      artifact = await createCertificatePdf(svg)
      fileName = `${fileName.replace(/\.[^.]+$/, '')}.pdf`
      contentType = 'application/pdf'
    }
    res
      .setHeader('Content-Type', contentType)
      .setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      .setHeader('Cache-Control', 'private, no-store')
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(artifact)
  }),
)

export default router
