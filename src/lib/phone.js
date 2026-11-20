/* Strip formatting and the +880 / 880 / leading 0 prefixes so a number pasted
   from a contact card passes the same check the server applies. */
export function bdMobileNational(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^880/, '')
    .replace(/^0/, '')
}

export function isBdMobile(value) {
  return /^1[3-9]\d{8}$/.test(bdMobileNational(value))
}
