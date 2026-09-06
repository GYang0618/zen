import assert from 'node:assert/strict'
import { test } from 'node:test'

import { toolExecutionContextSchema, toolManifestSchema } from '../dist/agent/index.js'

const manifest = {
  name: 'delete_user',
  version: '1.0.0',
  description: 'Delete user',
  inputSchema: { type: 'object', properties: { id: { type: 'string' } } },
  capabilities: ['users', 'delete'],
  permissionCode: 'system:user:delete',
  riskLevel: 'critical',
  sideEffect: 'destructive',
  requiresApproval: true,
  timeoutMs: 30000,
  retryPolicy: { maxRetries: 0, retryableReasons: [] },
  idempotencyPolicy: 'run-tool-call',
  ui: { label: 'Delete user' }
}

test('mutating manifests require permission, approval, and idempotency without automatic retries', () => {
  assert.equal(toolManifestSchema.safeParse(manifest).success, true)
  for (const change of [
    { permissionCode: undefined },
    { requiresApproval: false },
    { idempotencyPolicy: 'none' },
    { retryPolicy: { maxRetries: 1, retryableReasons: ['TIMEOUT'] } }
  ])
    assert.equal(toolManifestSchema.safeParse({ ...manifest, ...change }).success, false)
})

test('execution context rejects missing tenant, user, run, and tool-call identifiers', () => {
  const context = {
    tenantId: 't',
    userId: 'u',
    runId: 'r',
    threadId: 'th',
    toolName: 'delete_user',
    toolCallId: 'tc',
    accessToken: 'token'
  }
  assert.equal(toolExecutionContextSchema.safeParse(context).success, true)
  for (const key of ['tenantId', 'userId', 'runId', 'toolCallId']) {
    assert.equal(toolExecutionContextSchema.safeParse({ ...context, [key]: '' }).success, false)
  }
})

test('public package subpaths resolve through native ESM and keep internal paths private', async () => {
  for (const name of [
    'contracts',
    'domains',
    'agent',
    'security',
    'errors',
    'pagination',
    'primitives'
  ]) {
    assert.ok(await import(`@zen/shared/${name}`))
  }
  await assert.rejects(import('@zen/shared/src/agent/tools.js'), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
  })
})
