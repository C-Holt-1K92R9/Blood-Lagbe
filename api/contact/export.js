import '../../server/env.js'
import { emailFeedbackCsv, isAuthorizedFeedbackExport } from '../../server/lib/feedbackExport.js'

export default async function exportFeedback(req, res) {
  if (req.method !== 'POST' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'HEAD, POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  if (!isAuthorizedFeedbackExport(req)) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }

  try {
    const result = await emailFeedbackCsv()
    if (result.status !== 'sent') {
      const status = result.status === 'logged' ? 503 : 502
      return res.status(status).json({
        error: 'The feedback export email could not be sent. Check the email configuration and try again.',
      })
    }
    if (req.method === 'HEAD') return res.status(200).end()
    return res.status(200).json({ sent: true, count: result.count, recipient: result.recipient })
  } catch (error) {
    console.error('[feedback-export] failed to create or send CSV:', error)
    return res.status(500).json({ error: 'Failed to create or send the feedback export.' })
  }
}
