import { Router } from 'express'
import { query } from '../db.js'
import { mailMode } from '../lib/mail.js'

const router = Router()

router.get('/health', async (req, res) => {
  try {
    await query('select 1')
    res.json({
      ok: true,
      database: 'up',
      mail: mailMode(),
      time: new Date().toISOString(),
    })
  } catch (err) {
    res.status(503).json({ ok: false, database: 'down', error: err.message })
  }
})

export default router
