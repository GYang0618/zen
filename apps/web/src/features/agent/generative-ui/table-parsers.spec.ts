import { describe, expect, it } from 'vitest'

import { parseJobProfilesPageResult, parseUsersPageResult } from './parse-table-result'

describe('parseUsersPageResult', () => {
  it('正确解析包含 nullable 字段及 pagination 对象的精简用户列表', () => {
    const rawPayload = JSON.stringify({
      success: true,
      data: {
        items: [
          {
            id: 'u1',
            username: 'alice',
            email: 'alice@qq.com',
            nickname: null,
            realName: null,
            avatar: null,
            phoneNumber: null,
            status: 'suspended',
            lastActiveAt: null,
            roles: [
              {
                id: 'r1',
                code: 'user',
                name: '普通用户',
                status: 'active'
              }
            ]
          },
          {
            id: 'u2',
            username: 'admin',
            email: 'admin@qq.com',
            nickname: '管理员',
            realName: '张三',
            status: 'active',
            lastActiveAt: '2026-09-07T14:32:09.063Z',
            roles: [
              {
                id: 'r2',
                code: 'super_admin',
                name: '超级管理员',
                status: 'active'
              }
            ]
          }
        ],
        pagination: {
          page: 1,
          pageSize: 2,
          total: 2,
          totalPages: 1
        }
      }
    })

    const result = parseUsersPageResult(rawPayload)
    expect(result).toBeDefined()
    expect(result?.items).toHaveLength(2)
    expect(result?.items[0]).toMatchObject({
      id: 'u1',
      username: 'alice',
      email: 'alice@qq.com',
      nickname: null,
      realName: null
    })
  })

  it('无效数据或空值返回 undefined', () => {
    expect(parseUsersPageResult('')).toBeUndefined()
    expect(parseUsersPageResult('invalid json')).toBeUndefined()
    expect(
      parseUsersPageResult(JSON.stringify({ success: false, error: 'failed' }))
    ).toBeUndefined()
  })

  it('容错支持已解析的对象输入', () => {
    const obj = {
      items: [{ id: 'u1', username: 'test', email: 'test@example.com', status: 'active' }]
    }
    const result = parseUsersPageResult(obj)
    expect(result).toBeDefined()
    expect(result?.items).toHaveLength(1)
  })
})

describe('parseJobProfilesPageResult', () => {
  it('正确解析包含 pagination 对象的岗位列表', () => {
    const rawPayload = JSON.stringify({
      success: true,
      data: {
        items: [
          {
            id: 'p1',
            code: 'POS-0001',
            name: '前端工程师',
            level: 'P6',
            status: 'active'
          }
        ],
        pagination: {
          page: 1,
          pageSize: 1,
          total: 1,
          totalPages: 1
        }
      }
    })

    const result = parseJobProfilesPageResult(rawPayload)
    expect(result).toBeDefined()
    expect(result?.items).toHaveLength(1)
    expect(result?.items[0]).toMatchObject({
      id: 'p1',
      code: 'POS-0001',
      name: '前端工程师'
    })
  })

  it('无效数据返回 undefined', () => {
    expect(parseJobProfilesPageResult('')).toBeUndefined()
    expect(parseJobProfilesPageResult('{ broken')).toBeUndefined()
  })
})
