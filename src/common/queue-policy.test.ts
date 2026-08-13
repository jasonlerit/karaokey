import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getQueuePolicyRejection,
  MAX_UPCOMING_ITEMS_PER_GUEST,
  MAX_UPCOMING_ITEMS_PER_ROOM,
} from './queue-policy.ts'

test('accepts an eligible request below both queue limits', () => {
  assert.equal(
    getQueuePolicyRejection({
      guestUpcomingCount: MAX_UPCOMING_ITEMS_PER_GUEST - 1,
      roomUpcomingCount: MAX_UPCOMING_ITEMS_PER_ROOM - 1,
      hasActiveDuplicate: false,
    }),
    undefined,
  )
})

test('rejects an active duplicate for the same guest', () => {
  assert.equal(
    getQueuePolicyRejection({
      guestUpcomingCount: 0,
      roomUpcomingCount: 0,
      hasActiveDuplicate: true,
    }),
    'duplicate_video',
  )
})

test('enforces the per-guest upcoming limit', () => {
  assert.equal(
    getQueuePolicyRejection({
      guestUpcomingCount: MAX_UPCOMING_ITEMS_PER_GUEST,
      roomUpcomingCount: 4,
      hasActiveDuplicate: false,
    }),
    'guest_limit_reached',
  )
})

test('enforces the per-room upcoming limit', () => {
  assert.equal(
    getQueuePolicyRejection({
      guestUpcomingCount: 1,
      roomUpcomingCount: MAX_UPCOMING_ITEMS_PER_ROOM,
      hasActiveDuplicate: false,
    }),
    'room_limit_reached',
  )
})
