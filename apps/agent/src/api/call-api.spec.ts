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
          code: 0,
          message: 'ok',
          data: {
            id: 'artifact-1',
            name: 'query_users_list-result.json',
            size: 33_100,
            summary: '完整结果'
          }
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    }) as typeof fetch

    const result = await executeApiCall(
      {
        configurable: { accessToken: 'token' },
        context: { agentRunId: 'run-1' },
        toolCallId: 'tool-call-1',
        toolCall: { name: 'query_users_list' }
      } as never,
      async () => ({ rows: ['x'.repeat(33_000)] })
    )

    assert.match(String(artifactRequest), /\/api\/copilot\/runtime\/runs\/run-1\/artifacts$/)
    assert.deepEqual(JSON.parse(result), {
      success: true,
      data: {
        artifactId: 'artifact-1',
        name: 'query_users_list-result.json',
        size: 33_100,
        summary: '完整结果',
        message: '结果较大，已保存为 Artifact。'
      }
    })
  })
})
