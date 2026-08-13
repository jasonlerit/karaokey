import assert from 'node:assert/strict'
import test from 'node:test'

import { formatVideoDuration, parseYouTubeDuration } from './youtube-duration.ts'

test('parses YouTube ISO durations into seconds', () => {
  assert.equal(parseYouTubeDuration('PT4M7S'), 247)
  assert.equal(parseYouTubeDuration('PT1H2M3S'), 3_723)
  assert.equal(parseYouTubeDuration('P1DT2H'), 93_600)
})

test('formats durations for compact result cards', () => {
  assert.equal(formatVideoDuration(247), '4:07')
  assert.equal(formatVideoDuration(3_723), '1:02:03')
  assert.equal(formatVideoDuration(undefined), undefined)
})

test('rejects missing and malformed durations', () => {
  assert.equal(parseYouTubeDuration(undefined), undefined)
  assert.equal(parseYouTubeDuration('live'), undefined)
})
