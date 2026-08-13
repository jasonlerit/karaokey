import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getEffectiveRoomStatus,
  getRoomExpiration,
  ROOM_ABSOLUTE_LIFETIME_MS,
  ROOM_INACTIVITY_LIFETIME_MS,
} from './room-lifecycle.ts'

test('new rooms receive inactivity and absolute expiration boundaries', () => {
  const createdAt = new Date('2026-08-13T12:00:00.000Z')
  const expiration = getRoomExpiration(createdAt)

  assert.equal(expiration.expiresAt.getTime(), createdAt.getTime() + ROOM_INACTIVITY_LIFETIME_MS)
  assert.equal(
    expiration.absoluteExpiresAt.getTime(),
    createdAt.getTime() + ROOM_ABSOLUTE_LIFETIME_MS,
  )
})

test('an active room expires at either expiration boundary', () => {
  const now = new Date('2026-08-13T18:00:00.000Z')

  assert.equal(
    getEffectiveRoomStatus('active', now, new Date('2026-08-14T00:00:00.000Z'), now),
    'expired',
  )
  assert.equal(
    getEffectiveRoomStatus('active', new Date('2026-08-14T00:00:00.000Z'), now, now),
    'expired',
  )
})

test('terminal room states never change during effective-status evaluation', () => {
  const past = new Date('2026-08-13T12:00:00.000Z')
  const now = new Date('2026-08-13T18:00:00.000Z')

  assert.equal(getEffectiveRoomStatus('ended', past, past, now), 'ended')
  assert.equal(getEffectiveRoomStatus('expired', past, past, now), 'expired')
})
