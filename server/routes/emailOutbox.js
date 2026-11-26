import { Router } from 'express'
import { processEmailOutbox } from '../lib/mailWorker.js'
import { asyncRoute, HttpError } from '../lib/http.js'

const router = Router()

router.get(
  '/process-email-outbox',
  asyncRoute(async (req, res) => {
    const secret = process.env.CRON_SECRET
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      throw new HttpError(401, 'Unauthorized.')
    }

    try {
      const result = await processEmailOutbox()
      res.json(result)
    } catch (error) {
      if (error?.code === 'MAIL_CREDENTIALS_MISSING') {
        throw new HttpError(503, error.message)
      }
      throw error
    }
  }),
)

export default router
