import { describe, expect, it } from 'vitest'

import { extractReadableTargets, resolveApprovalOperation } from './approval-title'

describe('resolveApprovalOperation', () => {
  it('把工具名映射为业务操作', () => {
    expect(resolveApprovalOperation(['delete_roles'])).toBe('删除角色')
    expect(resolveApprovalOperation(['delete_roles', 'delete_users'])).toBe('删除角色、删除用户')
    expect(resolveApprovalOperation([])).toBe('执行该操作')
  })
})

describe('extractReadableTargets', () => {
  it('提取名称和编码，忽略内部 ID', () => {
    expect(
      extractReadableTargets({
        ids: ['cmt9wiyiu005xfohte7m4qkhu'],
        name: '法务顾问',
        code: 'legal_advisor'
      })
    ).toEqual(['法务顾问', 'legal_advisor'])
  })

  it('仅有内部 ID 时不展示目标', () => {
    expect(extractReadableTargets({ ids: ['cmt9wiyiu005xfohte7m4qkhu'] })).toEqual([])
  })
})
