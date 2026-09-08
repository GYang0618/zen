import assert from 'node:assert/strict'
import { afterEach, before, describe, it } from 'node:test'

import type * as CallApi from './call-api'

let executeApiCall: typeof CallApi.executeApiCall
const originalFetch = globalThis.fetch

before(async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.LANGSMITH_API_KEY = 'test-langsmith-key'
  ;({ executeApiCall } = await import('./call-api'))
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('executeApiCall Artifact handling', () => {
  it('将大型 Tool 结果保存为 Artifact 并只返回摘要', async () => {
    let artifactRequest: RequestInfo | URL | undefined
    globalThis.fetch = (async (input) => {
      artifactRequest = input
      return new Response(
        JSON.stringify({
          code: 200,
          message: 'ok',
          data: {
            id: 'artifact-1',
            name: 'query_users_list-result.json',
            size: 33_100,
            summary: '完整结果'
          },
          traceId: 'artifact-trace',
          timestamp: '2026-09-08T06:00:00.000Z'
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    }) as typeof fetch

    const result = await executeApiCall(
      {
        configurable: {
          accessToken: 'token',
          tenantId: 'tenant-1',
          userId: 'user-1',
          threadId: 'thread-1',
          agentRunId: 'run-1'
        },
        toolCallId: 'tool-call-1',
        toolCall: { name: 'query_users_list' }
      } as never,
      async (context) => {
        assert.equal(context.tenantId, 'tenant-1')
        assert.equal(context.userId, 'user-1')
        assert.equal(context.runId, 'run-1')
        assert.equal(context.toolCallId, 'tool-call-1')
        return { rows: ['x'.repeat(33_000)] }
      }
    )

    assert.match(String(artifactRequest), /\/api\/copilot\/runtime\/runs\/run-1\/artifacts$/)
    const parsed = JSON.parse(result) as {
      code: number
      message: string
      data: {
        artifactId: string
        name: string
        size: number
        summary: string
        message: string
      }
      traceId: string
      timestamp: string
    }
    assert.equal(parsed.code, 200)
    assert.equal(parsed.message, 'Success')
    assert.deepEqual(parsed.data, {
      artifactId: 'artifact-1',
      name: 'query_users_list-result.json',
      size: 33_100,
      summary: '完整结果',
      message: '结果较大，已保存为 Artifact。'
    })
    assert.equal(typeof parsed.traceId, 'string')
    assert.equal(typeof parsed.timestamp, 'string')
  })
})

describe('executeApiCall fail-closed writes', () => {
  it('写操作缺少 run/tenant/user 标识时拒绝执行', async () => {
    const result = await executeApiCall(
      {
        configurable: { accessToken: 'token' },
        toolCallId: 'tool-call-1',
        toolCall: { name: 'delete_users' }
      } as never,
      async () => {
        throw new Error('should not run')
      }
    )
    const parsed = JSON.parse(result) as {
      code: number
      reason: string
      message: string
    }
    assert.equal(parsed.code, 400)
    assert.equal(parsed.reason, 'MISSING_EXECUTION_CONTEXT')
    assert.match(parsed.message, /写操作缺少 run\/tool\/tenant\/user 标识/)
  })
})
