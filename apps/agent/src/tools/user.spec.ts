import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getUsersTool } from './user'

describe('getUsersTool', () => {
  it('工具元数据配置正确', () => {
    assert.equal(getUsersTool.name, 'query_users_list')
    assert.ok(getUsersTool.description.includes('查询用户列表'))
  })
})
