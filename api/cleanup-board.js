import '../server/env.js'
import { query } from '../server/db.js'

export default async function cleanupBoard(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }

  try {
    const { rowCount } = await query(
      `delete from emergency_posts
        where created_at < now() - interval '30 days'`,
    )
    return res.status(200).json({ deleted: rowCount })
  } catch (error) {
    console.error('[cleanup] failed to delete old emergency board posts:', error)
    return res.status(500).json({ error: 'Failed to delete old emergency board posts.' })
  }
}
