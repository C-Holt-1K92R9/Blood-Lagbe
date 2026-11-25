import { Router } from 'express'
import { query } from '../db.js'
import { emailFeedbackCsv, isAuthorizedFeedbackExport } from '../lib/feedbackExport.js'
import { asyncRoute, HttpError } from '../lib/http.js'
import { rateLimit } from '../lib/ratelimit.js'
import * as v from '../lib/validate.js'

const router = Router()
const FEEDBACK_TYPES = ['complaint', 'suggestion', 'other']

router.post(
  '/export',
  (req, res, next) => {
    if (!isAuthorizedFeedbackExport(req)) return next(new HttpError(401, 'Unauthorized.'))
    next()
  },
  rateLimit({ scope: 'feedback-export', max: 2, windowMs: 5 * 60_000 }),
  asyncRoute(async (req, res) => {
    const result = await emailFeedbackCsv()
    if (result.status !== 'sent') {
      const status = result.status === 'logged' ? 503 : 502
      throw new HttpError(status, 'The feedback export email could not be sent. Check the email configuration and try again.')
    }
    res.json({ sent: true, count: result.count, recipient: result.recipient })
  }),
)

router.post(
  '/',
  rateLimit({ scope: 'contact-feedback', max: 5, windowMs: 10 * 60_000 }),
  asyncRoute(async (req, res) => {
    const body = req.body || {}
    const name = v.text(body.name, 'Your name', { min: 2, max: 80 })
    const email = v.email(body.email, 'Your email')
    if (!FEEDBACK_TYPES.includes(body.feedbackType)) {
      throw new HttpError(400, 'Choose a feedback type.', { field: 'feedbackType' })
    }
    const feedbackType = body.feedbackType
    const message = v.multiline(body.message, 'Your feedback', { min: 10, max: 2000 })

    await query(
      `insert into contact_feedback (name, email, feedback_type, message)
       values ($1, $2, $3, $4)`,
      [name, email, feedbackType, message],
    )

    res.status(201).json({ message: 'Thank you for your feedback. We have received it.' })
  }),
)

export default router
