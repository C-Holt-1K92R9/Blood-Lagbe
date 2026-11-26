import test from 'node:test'
import assert from 'node:assert/strict'
import { backoffSeconds, classifySmtpFailure } from './mailPolicy.js'

test('SMTP rate limits rotate credentials with a temporary cooldown', () => {
  assert.deepEqual(classifySmtpFailure({ responseCode: 452 }), {
    kind: 'credential',
    cooldownSeconds: 60 * 60,
  })
})

test('daily quota errors rotate credentials for a full-day cooldown', () => {
  assert.deepEqual(classifySmtpFailure({ message: 'Daily sending quota exceeded' }), {
    kind: 'credential',
    cooldownSeconds: 24 * 60 * 60,
  })
})

test('authentication failures rotate away from an unusable credential', () => {
  assert.deepEqual(classifySmtpFailure({ responseCode: 535 }), {
    kind: 'credential',
    cooldownSeconds: 12 * 60 * 60,
  })
})

test('permanent recipient errors are not retried', () => {
  assert.deepEqual(classifySmtpFailure({ responseCode: 550 }), { kind: 'permanent' })
})

test('transient transport errors use capped exponential backoff', () => {
  assert.deepEqual(classifySmtpFailure({ code: 'ETIMEDOUT' }), { kind: 'retry' })
  assert.equal(backoffSeconds(1), 60)
  assert.equal(backoffSeconds(4), 8 * 60)
  assert.equal(backoffSeconds(20), 6 * 60 * 60)
})
