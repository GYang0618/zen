import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isLangGraphServerRuntime, memoryNamespace } from './persistence'

describe('LangGraph persistence helpers', () => {
  it('namespace 至少包含 tenant/user/scope，线程记忆额外包含 thread', () => {
    assert.deepEqual(memoryNamespace({ tenantId: 't1', userId: 'u1', scope: 'prefs' }), [
      'tenant',
      't1',
      'user',
      'u1',
      'scope',
      'prefs'
    ])
    assert.deepEqual(
      memoryNamespace({ tenantId: 't1', userId: 'u1', scope: 'prefs', threadId: 'th1' }),
      ['tenant', 't1', 'user', 'u1', 'scope', 'prefs', 'thread', 'th1']
    )
  })

  it('识别 LangGraph server runtime，避免双重 checkpointer', () => {
    const previous = process.env.LANGGRAPH_API
    process.env.LANGGRAPH_API = '1'
    try {
      assert.equal(isLangGraphServerRuntime(), true)
    } finally {
      if (previous === undefined) delete process.env.LANGGRAPH_API
      else process.env.LANGGRAPH_API = previous
    }
  })
})
