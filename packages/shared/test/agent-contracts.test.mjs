import assert from 'node:assert/strict'
import { test } from 'node:test'

import { agentRuntimeContextSchema } from '../dist/agent/contracts.js'

const identity = {
  tenantId: 'tenant-1',
  userId: 'user-1',
  threadId: 'thread-1',
  runId: 'run-1',
  accessToken: 'test-token'
}

test('omitted memory policy applies nested defaults and disables long-term recall', () => {
  const context = agentRuntimeContextSchema.parse(identity)
  assert.deepEqual(context.memory, { includeLongTerm: false, maxChars: 6_000 })
  assert.deepEqual(context.permissions, [])
  assert.deepEqual(context.activePluginIds, [])
})

test('partial memory policy retains explicit consent and applies the budget default', () => {
  const context = agentRuntimeContextSchema.parse({
    ...identity,
    memory: { includeLongTerm: true }
  })
  assert.deepEqual(context.memory, { includeLongTerm: true, maxChars: 6_000 })
})

test('explicit memory budget is retained without enabling long-term recall', () => {
  const context = agentRuntimeContextSchema.parse({ ...identity, memory: { maxChars: 500 } })
  assert.deepEqual(context.memory, { includeLongTerm: false, maxChars: 500 })
})

test('rejects memory budgets outside the supported range', () => {
  for (const maxChars of [0, -1, 20_001, 1.5]) {
    const result = agentRuntimeContextSchema.safeParse({ ...identity, memory: { maxChars } })
    assert.equal(result.success, false)
  }
})
