import { HttpError } from './http.js'

const buckets = new Map()

/* Small in-process limiter. Enough to keep a single instance from being
   hammered; swap for a shared store if the API is ever scaled out. */
export function rateLimit({ windowMs = 60_000, max = 30, scope = 'default' } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const key = `${scope}:${ip}`
    const now = Date.now()
    const entry = buckets.get(key)

    if (!entry || entry.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
      return next(new HttpError(429, 'Too many attempts. Please wait a moment and try again.'))
    }
    return next()
  }
}

// Periodically drop expired buckets so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key)
  }
}, 5 * 60_000).unref?.()
