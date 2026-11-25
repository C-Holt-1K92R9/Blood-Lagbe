import { Router } from 'express'
import { query } from '../db.js'
import { asyncRoute } from '../lib/http.js'
import { rateLimit } from '../lib/ratelimit.js'
import * as v from '../lib/validate.js'

const router = Router()

router.post(
  '/',
  rateLimit({ scope: 'contact-feedback', max: 5, windowMs: 10 * 60_000 }),
  asyncRoute(async (req, res) => {
    const body = req.body || {}
    const name = v.text(body.name, 'Your name', { min: 2, max: 80 })
    const email = v.email(body.email, 'Your email')
    const message = v.multiline(body.message, 'Your feedback', { min: 10, max: 2000 })

    await query(
      `insert into contact_feedback (name, email, message)
       values ($1, $2, $3)`,
      [name, email, message],
    )

    res.status(201).json({ message: 'Thank you for your feedback. We have received it.' })
  }),
)

export default router
