import { cityCentroid } from '../../shared/bd.js'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'BloodLagbe/1.0 (donor matching; hello@bloodlagbe.com.bd)'
const NOMINATIM_TIMEOUT_MS = 6000
const MIN_GAP_MS = 1100

// Nominatim asks for at most one request per second. A single serial queue keeps
// us inside that limit even when several donors register at the same time.
let queue = Promise.resolve()
let lastCall = 0

function schedule(task) {
  const run = queue.then(async () => {
    const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastCall))
    if (wait) await new Promise((r) => setTimeout(r, wait))
    lastCall = Date.now()
    return task()
  })
  queue = run.catch(() => {})
  return run
}

export function isCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  )
}

/* OpenStreetMap handles a clean "area, city, country" query far better than a
   house number it has never seen. Try the full written address first, then fall
   back to the city and division so an approximate pin still beats a centroid. */
function queryVariants({ addressText, city, division }) {
  const variants = [
    [addressText, city, division, 'Bangladesh'],
    [city, division, 'Bangladesh'],
    [division, 'Bangladesh'],
  ]
  const seen = new Set()
  return variants
    .map((parts) =>
      parts
        .filter(Boolean)
        .map((part) => String(part).trim())
        .filter(Boolean)
        .join(', '),
    )
    .filter((query) => {
      const key = query.toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

async function geocodeQuery(q) {
  try {
    return await schedule(async () => {
      const url = new URL(NOMINATIM)
      url.searchParams.set('q', q)
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('limit', '1')
      url.searchParams.set('countrycodes', 'bd')
      url.searchParams.set('addressdetails', '0')

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS)
      let res
      try {
        res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }

      if (!res.ok) return null
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) return null
      const lat = Number(data[0].lat)
      const lng = Number(data[0].lon)
      return isCoordinate(lat, lng) ? { lat, lng } : null
    })
  } catch {
    return null
  }
}

export async function geocodeAddress({ addressText, city, division }) {
  for (const query of queryVariants({ addressText, city, division })) {
    const hit = await geocodeQuery(query)
    if (hit) return hit
  }
  return null
}

/* Prefer a real GPS fix, then OpenStreetMap, then the district centroid.
   Returns the coordinates plus where they came from so the profile can say
   honestly how precise the pin is. */
export async function resolveCoordinates({ lat, lng, addressText, city, division }) {
  const hasLat = lat !== undefined && lat !== null && lat !== ''
  const hasLng = lng !== undefined && lng !== null && lng !== ''
  if (hasLat && hasLng && isCoordinate(Number(lat), Number(lng))) {
    return { lat: Number(lat), lng: Number(lng), source: 'gps' }
  }

  const geocoded = await geocodeAddress({ addressText, city, division })
  if (geocoded) return { ...geocoded, source: 'geocode' }

  const fallback = cityCentroid(division, city)
  if (fallback) return { ...fallback, source: 'fallback' }

  return { lat: null, lng: null, source: 'none' }
}

export function haversineKm(a, b) {
  if (!isCoordinate(a?.lat, a?.lng) || !isCoordinate(b?.lat, b?.lng)) return null
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}
