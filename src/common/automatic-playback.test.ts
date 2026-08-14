import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldAutomaticallyStartPlayback } from './automatic-playback.ts'

test('starts the first queued item in an active idle room', () => {
  assert.equal(
    shouldAutomaticallyStartPlayback({
      roomStatus: 'active',
      firstQueuedItemId: 'queue-1',
    }),
    true,
  )
})

test('does not repeat an automatic start for the same queued item', () => {
  assert.equal(
    shouldAutomaticallyStartPlayback({
      roomStatus: 'active',
      firstQueuedItemId: 'queue-1',
      lastAttemptedItemId: 'queue-1',
    }),
    false,
  )
})

test('does not automatically start when playback is current or the room is inactive', () => {
  assert.equal(
    shouldAutomaticallyStartPlayback({
      roomStatus: 'active',
      currentItemId: 'queue-1',
      firstQueuedItemId: 'queue-2',
    }),
    false,
  )
  assert.equal(
    shouldAutomaticallyStartPlayback({
      roomStatus: 'ended',
      firstQueuedItemId: 'queue-1',
    }),
    false,
  )
})
