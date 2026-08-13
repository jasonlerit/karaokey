import assert from 'node:assert/strict'
import test from 'node:test'

import { getRoomRetentionCutoff, ROOM_DATA_RETENTION_MS } from './data-retention.ts'

test('retains terminal room data for no more than 24 hours', () => {
  const now = new Date('2026-08-14T12:00:00.000Z')
  assert.equal(ROOM_DATA_RETENTION_MS, 24 * 60 * 60 * 1_000)
  assert.equal(getRoomRetentionCutoff(now).toISOString(), '2026-08-13T12:00:00.000Z')
})
