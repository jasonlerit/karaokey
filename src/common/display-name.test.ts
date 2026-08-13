import assert from 'node:assert/strict'
import test from 'node:test'

import { displayNameSchema, normalizeDisplayName } from './display-name.ts'

test('normalizes names to NFC and collapses whitespace', () => {
  assert.equal(normalizeDisplayName('  Jose\u0301   Cruz  '), 'José Cruz')
})

test('allows emoji and exactly 24 visible characters', () => {
  assert.equal(displayNameSchema.safeParse('🎤'.repeat(24)).success, true)
})

test('rejects names longer than 24 visible characters', () => {
  const result = displayNameSchema.safeParse('a'.repeat(25))

  assert.equal(result.success, false)
  if (!result.success)
    assert.equal(result.error.issues[0]?.message, 'Use 24 visible characters or fewer.')
})

test('rejects empty and hidden formatting input', () => {
  assert.equal(displayNameSchema.safeParse('   ').success, false)
  assert.equal(displayNameSchema.safeParse('Guest\u200bName').success, false)
})
