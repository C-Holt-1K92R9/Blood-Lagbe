import { Router } from 'express'
import { query } from '../db.js'
import { mailMode } from '../lib/mail.js'

const router = Router()

const healthCheck = async (req, res) => {
  try {
    await query('select 1')
    if (req.method === 'HEAD') return res.status(200).end()
    res.json({
      ok: true,
      database: 'up',
      mail: mailMode(),
      time: new Date().toISOString(),
    })
  } catch (err) {
    if (req.method === 'HEAD') return res.status(503).end()
    res.status(503).json({ ok: false, database: 'down', error: err.message })
  }
}

router.head('/health', healthCheck)
router.get('/health', healthCheck)

export default router
