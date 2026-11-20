import path from 'node:path'
import express from 'express'
import { projectRoot } from './env.js'
import { attachDonor } from './lib/session.js'
import { errorHandler, notFound } from './lib/http.js'
import authRoutes from './routes/auth.js'
import searchRoutes from './routes/search.js'
import emergencyRoutes from './routes/emergency.js'
import metaRoutes from './routes/meta.js'

const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || (isProd ? 4173 : 5173))

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
app.use('/api', metaRoutes)
app.use('/api', authRoutes)
app.use('/api', notFound)

if (isProd) {
  const dist = path.join(projectRoot, 'dist')
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }))
  app.use(
    express.static(dist, {
      index: false,
      maxAge: '1h',
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache')
      },
    }),
  )
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    return res.sendFile(path.join(dist, 'index.html'))
  })
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({
    root: projectRoot,
    server: { middlewareMode: true },
    appType: 'spa',
  })
  app.use(vite.middlewares)
}

app.use(errorHandler)

const server = app.listen(port, () => {
  console.log(`Blood Lagbe running at http://localhost:${port} (${isProd ? 'production' : 'development'})`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  })
}
