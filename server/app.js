import './env.js'
import express from 'express'
import { attachDonor } from './lib/session.js'
import { notFound } from './lib/http.js'
import authRoutes from './routes/auth.js'
import searchRoutes from './routes/search.js'
import emergencyRoutes from './routes/emergency.js'
import contactRoutes from './routes/contact.js'
import emailOutboxRoutes from './routes/emailOutbox.js'
import recognitionRoutes from './routes/recognition.js'
import certificateJobRoutes from './routes/certificateJob.js'
import metaRoutes from './routes/meta.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(express.json({ limit: '200kb' }))
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})
app.use(attachDonor)

app.use('/api/requests', searchRoutes)
app.use('/api/emergency', emergencyRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api', emailOutboxRoutes)
app.use('/api', certificateJobRoutes)
app.use('/api', recognitionRoutes)
app.use('/api', metaRoutes)
app.use('/api', authRoutes)
app.use('/api', notFound)

export default app
