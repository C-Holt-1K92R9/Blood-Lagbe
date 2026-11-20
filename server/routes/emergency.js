import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { query } from '../db.js'
import { asyncRoute, HttpError } from '../lib/http.js'
import { publicId } from '../lib/ids.js'
import { rateLimit } from '../lib/ratelimit.js'
import * as v from '../lib/validate.js'

const router = Router()

const shape = (r) => ({
  publicId: r.public_id,
  name: r.name,
  phone: r.phone,
  bloodGroup: r.blood_group,
  needType: r.need_type,
  division: r.division,
  city: r.city,
  addressText: r.address_text,
  neededAt: r.needed_at,
  note: r.note,
  status: r.status,
  createdAt: r.created_at,
})

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const bloodGroup = typeof req.query.group === 'string' && v.BLOOD_GROUPS.includes(req.query.group) ? req.query.group : null
    const needType = typeof req.query.need === 'string' && v.NEED_TYPES.includes(req.query.need) ? req.query.need : null

    const { rows } = await query(
      `select * from emergency_posts
        where status = 'open'
          and ($1::text is null or blood_group = $1)
          and ($2::text is null or need_type = $2)
        order by created_at desc
        limit 100`,
      [bloodGroup, needType],
    )
    res.json({ posts: rows.map(shape) })
  }),
)

router.post(
  '/',
  rateLimit({ scope: 'emergency', max: 6, windowMs: 10 * 60_000 }),
  asyncRoute(async (req, res) => {
    const body = req.body || {}

    const name = v.text(body.name, 'Your name', { min: 2, max: 80 })
    const phone = v.phone(body.phone, 'Your phone number')
    const bloodGroup = v.bloodGroup(body.bloodGroup)
    const needType = v.oneOf(body.needType, v.NEED_TYPES, 'need type')
    const division = v.division(body.division)
    const city = v.city(division, body.city)
    const addressText = v.multiline(body.addressText, 'Hospital or address', { min: 6, max: 300 })
    const note = v.multiline(body.note, 'Note', { min: 0, max: 300, required: false })
    const neededAt = v.futureOrNow(body.neededAt, 'Needed at')

    if (note && note.length < 3) throw new HttpError(400, 'Add a little more detail to your note.', { field: 'note' })

    // The public board shows the poster's phone, so phone alone cannot authorise
    // a close. Return this private token only to the browser that posted.
    const closeToken = randomBytes(24).toString('base64url')
    const { rows } = await query(
      `insert into emergency_posts
         (public_id, name, phone, blood_group, need_type, division, city, address_text, needed_at, note, close_token)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       returning *`,
      [
        publicId('EMR'),
        name,
        phone,
        bloodGroup,
        needType,
        division,
        city,
        addressText,
        neededAt,
        note || null,
        closeToken,
      ],
    )

    res.status(201).json({ post: shape(rows[0]), closeToken })
  }),
)

router.post(
  '/:publicId/fulfil',
  rateLimit({ scope: 'emergency-fulfil', max: 20, windowMs: 60_000 }),
  asyncRoute(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''
    if (!token) throw new HttpError(400, 'A close token is required.')

    const reference = String(req.params.publicId || '').trim().toUpperCase()
    const { rows } = await query(
      `update emergency_posts set status = 'fulfilled'
        where public_id = $1 and close_token = $2 and status = 'open'
        returning *`,
      [reference, token],
    )
    if (!rows[0]) {
      throw new HttpError(404, 'That post was not found, already closed, or this browser does not hold its close token.')
    }
    res.json({ post: shape(rows[0]) })
  }),
)

export default router
