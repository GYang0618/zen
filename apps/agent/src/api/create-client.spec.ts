import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'

import { createClient } from '../api-client/client'

import type * as CreateClient from './create-client'

let bindGeneratedClient: typeof CreateClient.bindGeneratedClient
let runWithAgentApiClient: typeof CreateClient.runWithAgentApiClient

before(async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.LANGSMITH_API_KEY = 'test-langsmith-key'
  ;({ bindGeneratedClient, runWithAgentApiClient } = await import('./create-client'))
})

describe('bindGeneratedClient', () => {
  it('将 SDK 单例的 get 代理到 ALS 中的 active client（不只是 request）', async () => {
    const singleton = createClient({ baseUrl: 'http://singleton.invalid' })
    const active = createClient({
      baseUrl: 'http://active.test',
      responseStyle: 'data',
      throwOnError: true
    })

    let hitUrl = ''
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input) => {
      hitUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }) as typeof fetch

    try {
      bindGeneratedClient(singleton)

      const body = await runWithAgentApiClient(active, () =>
        singleton.get({ url: '/api/user', query: { page: 1 } })
      )

      assert.match(hitUrl, /^http:\/\/active\.test\/api\/user/)
      assert.deepEqual(body, { items: [] })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
