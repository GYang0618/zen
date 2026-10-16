import assert from 'node:assert/strict'
import { afterEach, before, describe, it } from 'node:test'

import { client } from '../api-client/client.gen'

import type * as RequestContext from './request-context'

let runWithRequestContext: typeof RequestContext.runWithRequestContext
const originalFetch = globalThis.fetch

before(async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.LANGSMITH_API_KEY = 'test-langsmith-key'
  await import('./client')
  ;({ runWithRequestContext } = await import('./request-context'))
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('agent api interceptors', () => {
  it('请求拦截器注入 Agent 头，响应拦截器解包 Nest 信封', async () => {
    let hitUrl = ''
    let hitHeaders: Headers | undefined
    globalThis.fetch = (async (input) => {
      const request = input instanceof Request ? input : new Request(input)
      hitUrl = request.url
      hitHeaders = request.headers
      return new Response(
        JSON.stringify({
          code: 200,
          message: 'Success',
          data: { items: [] },
          traceId: 'trace-1',
          timestamp: '2026-09-08T06:00:00.000Z'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }) as typeof fetch

    const body = await runWithRequestContext(
      {
        accessToken: 'token',
        runId: 'run-1',
        toolName: 'query_users_list',
        idempotencyKey: 'run-1:tool-call-1'
      },
      () => client.get({ url: '/api/user' })
    )

    assert.match(hitUrl, /\/api\/user$/)
    assert.equal(hitHeaders?.get('authorization'), 'Bearer token')
    assert.equal(hitHeaders?.get('x-agent-run-id'), 'run-1')
    assert.equal(hitHeaders?.get('x-agent-tool-name'), 'query_users_list')
    assert.equal(hitHeaders?.get('x-agent-idempotency-key'), 'run-1:tool-call-1')
    assert.deepEqual(body, { items: [] })
  })
})
