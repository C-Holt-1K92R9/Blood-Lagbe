const APPROVED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.com.au',
  'yahoo.ca',
  'yahoo.co.in',
  'yahoo.com.bd',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.co.jp',
  'yahoo.com.sg',
  'yahoo.com.br',
  'yahoo.com.ar',
  'yahoo.com.mx',
  'yahoo.com.tw',
  'yahoo.com.hk',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'outlook.co.uk',
  'outlook.com.au',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.de',
  'live.com',
  'live.co.uk',
  'msn.com',
])

export function isApprovedEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false
  const domain = email.split('@').pop()
  return APPROVED_EMAIL_DOMAINS.has(domain)
}
