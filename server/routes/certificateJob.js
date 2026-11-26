import { Router } from 'express'
import { asyncRoute, HttpError } from '../lib/http.js'
import { generateDonationCertificates } from '../lib/certificateWorker.js'

const router = Router()

router.get(
  '/process-certificates',
  asyncRoute(async (req, res) => {
    const secret = process.env.CRON_SECRET
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      throw new HttpError(401, 'Unauthorized.')
    }

    res.json(await generateDonationCertificates())
  }),
)

export default router
