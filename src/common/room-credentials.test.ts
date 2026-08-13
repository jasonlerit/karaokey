import assert from 'node:assert/strict'
import test from 'node:test'

import {
  generateRoomCode,
  generateSecret,
  hashHostCredential,
  hashJoinToken,
  verifyHostCredential,
} from './room-credentials.ts'

test('room codes are short, human-readable, and random', () => {
  const codes = new Set(Array.from({ length: 100 }, generateRoomCode))

  assert.equal(codes.size, 100)
  for (const code of codes) assert.match(code, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/)
})

test('secrets contain 256 bits encoded for URLs', () => {
  assert.match(generateSecret(), /^[A-Za-z0-9_-]{43}$/)
})

test('join tokens use a deterministic one-way digest', () => {
  const token = generateSecret()

  assert.equal(hashJoinToken(token), hashJoinToken(token))
  assert.notEqual(hashJoinToken(token), hashJoinToken(generateSecret()))
  assert.match(hashJoinToken(token), /^[a-f0-9]{64}$/)
})

test('host credential hashes are salted and verifiable', async () => {
  const credential = generateSecret()
  const firstHash = await hashHostCredential(credential)
  const secondHash = await hashHostCredential(credential)

  assert.notEqual(firstHash, secondHash)
  assert.equal(await verifyHostCredential(credential, firstHash), true)
  assert.equal(await verifyHostCredential(generateSecret(), firstHash), false)
  assert.equal(await verifyHostCredential(credential, 'invalid'), false)
})
