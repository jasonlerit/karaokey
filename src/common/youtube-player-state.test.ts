import assert from 'node:assert/strict'
import test from 'node:test'

import { getYouTubePlayerAction } from './youtube-player-state.ts'

test('maps authoritative YouTube player states', () => {
  assert.equal(getYouTubePlayerAction(0), 'completed')
  assert.equal(getYouTubePlayerAction(1), 'playing')
  assert.equal(getYouTubePlayerAction(2), 'paused')
})

test('ignores unstarted, buffering, and cued states', () => {
  for (const state of [-1, 3, 5]) assert.equal(getYouTubePlayerAction(state), undefined)
})
