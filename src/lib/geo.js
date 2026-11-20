export function getPosition({ timeout = 12000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('This browser cannot share a location. Type your area instead.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location permission was blocked. Allow it in your browser settings, or type your area.'))
        } else if (error.code === error.TIMEOUT) {
          reject(new Error('Getting your location took too long. Try again or type your area.'))
        } else {
          reject(new Error('We could not read your location. Try again or type your area.'))
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60_000 },
    )
  })
}

export function formatCoords(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return 'Not set'
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

/* Value for a datetime-local input's `min`, expressed in Bangladesh time.
   The browser would otherwise use the device timezone, which may differ. */
export function dhakaDateTimeInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type)?.value || ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/* Today's calendar date in Bangladesh, matching the server's eligibility math. */
export function dhakaDateIso(date = new Date()) {
  return dhakaDateTimeInputValue(date).slice(0, 10)
}

export const LOCATION_SOURCE_LABEL = {
  gps: 'Precise location shared from a device',
  geocode: 'Approximated from the written address',
  fallback: 'Approximated from the city centre',
  none: 'No location saved',
}
