import assert from 'node:assert/strict'
import test from 'node:test'

import { acceptRoomSyncMessage, getReconnectDelay, type RoomSnapshot } from './room-sync-state.ts'

const snapshot = (version: number): RoomSnapshot => ({
  roomId: 'room-1',
  version,
  status: 'active',
  playback: { state: 'idle', positionSeconds: 0 },
  presence: { guestCount: 0 },
  queue: [],
})

test('rejects stale and duplicate room messages', () => {
  const current = snapshot(3)

  assert.equal(
    acceptRoomSyncMessage(current, {
      eventId: 'room-1:2',
      type: 'snapshot',
      snapshot: snapshot(2),
    }),
    current,
  )
  assert.equal(
    acceptRoomSyncMessage(current, {
      eventId: 'room-1:3',
      type: 'snapshot',
      snapshot: snapshot(3),
    }),
    current,
  )
  assert.equal(
    acceptRoomSyncMessage(current, { eventId: 'room-1:4', type: 'snapshot', snapshot: snapshot(4) })
      ?.version,
    4,
  )
})

test('bounds reconnect backoff at fifteen seconds', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 8].map(getReconnectDelay),
    [1_000, 2_000, 4_000, 8_000, 15_000, 15_000],
  )
})
