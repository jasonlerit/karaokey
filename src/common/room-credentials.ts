import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const ROOM_CODE_LENGTH = 6
const CREDENTIAL_BYTES = 32
const SCRYPT_KEY_LENGTH = 64

export const generateRoomCode = () => {
  const bytes = randomBytes(ROOM_CODE_LENGTH)

  return Array.from(bytes, (byte) => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]).join('')
}

export const generateSecret = () => randomBytes(CREDENTIAL_BYTES).toString('base64url')

export const hashJoinToken = (token: string) =>
  createHash('sha256').update(token, 'utf8').digest('hex')

export const hashHostCredential = async (credential: string) => {
  const salt = randomBytes(16)
  const derivedKey = (await scrypt(credential, salt, SCRYPT_KEY_LENGTH)) as Buffer

  return `scrypt:${salt.toString('base64url')}:${derivedKey.toString('base64url')}`
}

export const verifyHostCredential = async (credential: string, encodedHash: string) => {
  const [algorithm, saltValue, expectedValue] = encodedHash.split(':')

  if (algorithm !== 'scrypt' || !saltValue || !expectedValue) {
    return false
  }

  try {
    const salt = Buffer.from(saltValue, 'base64url')
    const expected = Buffer.from(expectedValue, 'base64url')
    const actual = (await scrypt(credential, salt, expected.length)) as Buffer

    return expected.length > 0 && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}
