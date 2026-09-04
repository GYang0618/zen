import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { completePageQuery } from '@zen/shared'

import { compactPagedToolResult, compactUserListItem } from './compact-result'

describe('completePageQuery', () => {
  it('只传 pageSize 时补全 page=1', () => {
    assert.deepEqual(completePageQuery({ pageSize: 100, keyword: 'gmail.com' }), {
      page: 1,
      pageSize: 100,
      keyword: 'gmail.com'
    })
  })

  it('两项都缺时保持不分页', () => {
    assert.deepEqual(completePageQuery({ keyword: 'gmail.com' }), { keyword: 'gmail.com' })
  })
})

describe('compactPagedToolResult', () => {
  it('列表结果只保留标识字段', () => {
    const raw = JSON.stringify({
      success: true,
      data: {
        items: [
          {
            id: 'u1',
            username: 'zhaolei',
            email: 'zhaolei88@gmail.com',
            nickname: '赵磊',
            realName: '赵磊',
            status: 'active',
            avatar: 'https://example.com/a.png',
            roles: [
              {
                id: 'r1',
                code: 'user',
                name: '普通用户',
                status: 'active',
                description: '系统默认角色，拥有基础访问权限',
                permissionCount: 12
              }
            ]
          }
        ],
        pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 }
      }
    })

    assert.deepEqual(JSON.parse(compactPagedToolResult(raw, compactUserListItem)), {
      success: true,
      data: {
        items: [
          {
            id: 'u1',
            username: 'zhaolei',
            email: 'zhaolei88@gmail.com',
            nickname: '赵磊',
            realName: '赵磊',
            status: 'active',
            roles: [{ id: 'r1', code: 'user', name: '普通用户', status: 'active' }]
          }
        ],
        pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 }
      }
    })
  })

  it('失败结果原样返回', () => {
    const raw = JSON.stringify({ success: false, reason: 'VALIDATION_ERROR', message: 'x' })
    assert.equal(compactPagedToolResult(raw, compactUserListItem), raw)
  })
})
