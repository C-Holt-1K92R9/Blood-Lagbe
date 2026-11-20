import { randomBytes } from 'node:crypto'

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function publicId(prefix) {
  const bytes = randomBytes(5)
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${out}`
}
