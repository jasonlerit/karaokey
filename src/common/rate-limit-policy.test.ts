import assert from 'node:assert/strict'
import test from 'node:test'

import { getFixedWindowRateLimit, rateLimitPolicies } from './rate-limit-policy.ts'

test('allows requests through the configured fixed-window limit', () => {
  const result = getFixedWindowRateLimit({
    count: rateLimitPolicies.roomCreation.limit - 1,
    resetAt: 10_000,
    now: 1_000,
    policy: 'roomCreation',
  })
  assert.equal(result.allowed, true)
  assert.equal(result.count, rateLimitPolicies.roomCreation.limit)
})

test('rejects excess requests with a bounded retry delay', () => {
  const result = getFixedWindowRateLimit({
    count: rateLimitPolicies.youtubeSearch.limit,
    resetAt: 10_000,
    now: 4_500,
    policy: 'youtubeSearch',
  })
  assert.equal(result.allowed, false)
  assert.equal(result.retryAfter, 6)
})

test('starts a new counter after the window resets', () => {
  const result = getFixedWindowRateLimit({
    count: 100,
    resetAt: 1_000,
    now: 1_000,
    policy: 'queueMutation',
  })
  assert.equal(result.allowed, true)
  assert.equal(result.count, 1)
})
