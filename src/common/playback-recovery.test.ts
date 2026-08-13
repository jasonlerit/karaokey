import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getPlayerRecoveryAction,
  MAX_PLAYER_RECOVERY_RETRIES,
  PLAYER_API_TIMEOUT_MS,
  PLAYER_START_TIMEOUT_MS,
} from './playback-recovery.ts'

test('retries one player startup failure before failing the item', () => {
  assert.equal(getPlayerRecoveryAction(0), 'retry')
  assert.equal(getPlayerRecoveryAction(1), 'fail')
  assert.equal(MAX_PLAYER_RECOVERY_RETRIES, 1)
})

test('uses bounded player API and video startup deadlines', () => {
  assert.equal(PLAYER_API_TIMEOUT_MS, 15_000)
  assert.equal(PLAYER_START_TIMEOUT_MS, 15_000)
})
