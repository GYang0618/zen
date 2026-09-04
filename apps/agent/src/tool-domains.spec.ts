import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  collectConversationHints,
  resolveToolDomains,
  selectToolNamesForDomains
} from './tool-domains'

describe('resolveToolDomains', () => {
  it('删除谷歌邮箱用户命中用户域', () => {
    const domains = resolveToolDomains('帮我删除所有谷歌邮箱的用户', [])
    assert.deepEqual([...domains], ['user'])
  })

  it('最近调用过的工具会带上对应域', () => {
    const domains = resolveToolDomains('继续', ['query_users_list'])
    assert.ok(domains.has('user'))
  })
})

describe('selectToolNamesForDomains', () => {
  it('用户域包含查询和删除', () => {
    const selected = selectToolNamesForDomains(
      ['query_users_list', 'delete_users', 'query_roles_list', 'create_role'],
      new Set(['user'])
    )
    assert.deepEqual(selected, ['query_users_list', 'delete_users'])
  })

  it('未命中任何域时不裁剪', () => {
    assert.equal(selectToolNamesForDomains(['query_users_list'], new Set()), undefined)
  })

  it('从最近人类消息提取用户域', () => {
    const hints = collectConversationHints([
      { type: 'human', content: '帮我删除所有谷歌邮箱的用户' },
      { type: 'ai', tool_calls: [{ name: 'query_users_list' }] }
    ])
    assert.match(hints.text, /谷歌邮箱/)
    assert.deepEqual(hints.recentToolNames, ['query_users_list'])
  })
})
