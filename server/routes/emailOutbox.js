import { Router } from 'express'
import { processEmailOutbox as runEmailOutbox } from '../lib/mailWorker.js'
import { asyncRoute, HttpError } from '../lib/http.js'

const router = Router()

const processEmailOutbox = asyncRoute(async (req, res) => {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    throw new HttpError(401, 'Unauthorized.')
  }

  try {
    const result = await runEmailOutbox()
    if (req.method === 'HEAD') return res.status(200).end()
    res.json(result)
  } catch (error) {
    if (error?.code === 'MAIL_CREDENTIALS_MISSING') {
      throw new HttpError(503, error.message)
    }
    throw error
  }
})

router.head('/process-email-outbox', processEmailOutbox)
router.get('/process-email-outbox', processEmailOutbox)

export default router
