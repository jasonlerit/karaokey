import assert from 'node:assert/strict'
import test from 'node:test'

import { operationalEventSchema, serializeOperationalEvent } from './operational-event-policy.ts'

test('serializes only the bounded fields for an operational event', () => {
  assert.deepEqual(
    serializeOperationalEvent(
      { event: 'youtube_api_request', operation: 'search', outcome: 'quota_exceeded' },
      new Date('2026-08-14T00:00:00.000Z'),
    ),
    {
      timestamp: '2026-08-14T00:00:00.000Z',
      event: 'youtube_api_request',
      operation: 'search',
      outcome: 'quota_exceeded',
    },
  )
})

test('rejects identifiers and other unexpected event fields', () => {
  assert.equal(
    operationalEventSchema.safeParse({ event: 'room_created', roomId: 'secret' }).success,
    false,
  )
})
