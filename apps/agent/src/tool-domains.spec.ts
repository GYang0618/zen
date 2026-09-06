import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  collectConversationHints,
  resolveToolCapabilities,
  selectToolNamesForCapabilities
} from './tool-domains'

describe('resolveToolCapabilities', () => {
  it('删除谷歌邮箱用户命中 user 能力标签', () => {
    const capabilities = resolveToolCapabilities('帮我删除所有谷歌邮箱的用户', [])
    assert.deepEqual([...capabilities], ['user'])
  })

  it('最近调用过的工具会带上对应能力标签', () => {
    const capabilities = resolveToolCapabilities('继续', ['query_users_list'])
    assert.ok(capabilities.has('user'))
  })
})

describe('selectToolNamesForCapabilities', () => {
  it('用户域包含查询和删除', () => {
    const selected = selectToolNamesForCapabilities(
      ['query_users_list', 'delete_users', 'query_roles_list', 'create_role'],
      new Set(['user'])
    )
    assert.deepEqual(selected, ['query_users_list', 'delete_users'])
  })

  it('未命中任何能力时不裁剪', () => {
    assert.equal(selectToolNamesForCapabilities(['query_users_list'], new Set()), undefined)
  })

  it('从最近人类消息提取用户能力', () => {
    const hints = collectConversationHints([
      { type: 'human', content: '帮我删除所有谷歌邮箱的用户' },
      { type: 'ai', tool_calls: [{ name: 'query_users_list' }] }
    ])
    assert.match(hints.text, /谷歌邮箱/)
    assert.deepEqual(hints.recentToolNames, ['query_users_list'])
  })
})
