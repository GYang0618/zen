#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8')

const requiredEnums = [
  'AgentRunStatus',
  'AgentEndReason',
  'AgentApprovalStatus',
  'AgentRiskLevel',
  'AgentSideEffect',
  'AgentToolExecutionStatus',
  'AgentMemorySensitivity',
  'AgentIdempotencyStatus'
]
const requiredModels = [
  'AgentThread',
  'AgentRun',
  'AgentCheckpoint',
  'AgentEvent',
  'AgentApproval',
  'AgentToolExecution',
  'AgentMemory',
  'AgentArtifact',
  'AgentIdempotencyRecord'
]
const checkpointFields = ['parentId', 'namespace', 'stateHash']

const missing = [
  ...requiredEnums.filter((name) => !schema.includes(`enum ${name}`)),
  ...requiredModels.filter((name) => !schema.includes(`model ${name}`)),
  ...checkpointFields.filter((name) => !schema.includes(name))
]

if (!schema.includes('agentThreads') || !schema.includes('fields: [tenantId]')) {
  missing.push('AgentThread tenant/user foreign keys')
}

if (missing.length) {
  console.error(`Agent runtime schema validation failed:\n- ${missing.join('\n- ')}`)
  process.exit(1)
}

console.log('Agent runtime schema validation passed.')
