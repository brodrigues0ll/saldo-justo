import crypto from 'crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateSegment(length) {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes)
    .map(b => ALPHABET[b % ALPHABET.length])
    .join('')
}

export function generateCode() {
  return `SJ-${generateSegment(4)}-${generateSegment(4)}`
}
