import assert from 'node:assert/strict'
import test from 'node:test'

import { getAdvancePlaybackRejection, getStartPlaybackRejection } from './playback-policy.ts'

test('starts only an idle active room with a queued item', () => {
  assert.equal(
    getStartPlaybackRejection({
      roomStatus: 'active',
      playbackState: 'idle',
      currentItemId: null,
      hasQueuedItem: true,
    }),
    undefined,
  )
  assert.equal(
    getStartPlaybackRejection({
      roomStatus: 'active',
      playbackState: 'idle',
      currentItemId: null,
      hasQueuedItem: false,
    }),
    'queue_empty',
  )
  assert.equal(
    getStartPlaybackRejection({
      roomStatus: 'active',
      playbackState: 'playing',
      currentItemId: 'item-a',
      hasQueuedItem: true,
    }),
    'already_started',
  )
})

test('requires the expected current item to advance', () => {
  assert.equal(
    getAdvancePlaybackRejection({
      roomStatus: 'active',
      currentItemId: 'item-a',
      expectedCurrentItemId: 'item-a',
      currentItemStatus: 'current',
    }),
    undefined,
  )
  assert.equal(
    getAdvancePlaybackRejection({
      roomStatus: 'active',
      currentItemId: 'item-b',
      expectedCurrentItemId: 'item-a',
      currentItemStatus: 'current',
    }),
    'stale_current_item',
  )
})

test('rejects terminal and inconsistent current items', () => {
  for (const currentItemStatus of [
    undefined,
    'queued',
    'removed',
    'skipped',
    'failed',
    'completed',
  ] as const) {
    assert.equal(
      getAdvancePlaybackRejection({
        roomStatus: 'active',
        currentItemId: 'item-a',
        expectedCurrentItemId: 'item-a',
        currentItemStatus,
      }),
      'invalid_transition',
    )
  }
})

test('rejects transitions for terminal rooms', () => {
  for (const roomStatus of ['ended', 'expired'] as const) {
    assert.equal(
      getStartPlaybackRejection({
        roomStatus,
        playbackState: 'idle',
        currentItemId: null,
        hasQueuedItem: true,
      }),
      roomStatus === 'ended' ? 'room_ended' : 'room_expired',
    )
  }
})
