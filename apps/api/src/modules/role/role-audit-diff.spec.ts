import { buildRoleUpdatedDiff, toUserDisplayName } from './role-audit-diff'

import type { RoleWithRelations } from './role.repository'

function createRole(overrides: Partial<RoleWithRelations> = {}): RoleWithRelations {
  return {
    id: 'role-1',
    code: 'test_role',
    name: '测试角色',
    description: '旧描述',
    icon: 'shield',
    iconColor: 'slate',
    status: 'ACTIVE',
    kind: 'CUSTOM',
    isSystem: false,
    dataScope: 'SELF',
    customOrgIds: [],
    expiresAt: null,
    sort: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    permissions: [],
    users: [],
    _count: { users: 0 },
    ...overrides
  } as RoleWithRelations
}

describe('role-audit-diff', () => {
  it('仅记录真正变化的字段', () => {
    const { action, diff } = buildRoleUpdatedDiff(createRole(), {
      name: '新名称',
      description: '新描述',
      icon: 'users'
    })

    expect(action).toBe('system.role.updated')
    expect(diff.changes).toEqual([
      { field: 'name', label: '角色名称', from: '测试角色', to: '新名称' },
      { field: 'description', label: '角色描述', from: '旧描述', to: '新描述' },
      { field: 'icon', label: '角色图标', from: 'shield', to: 'users' }
    ])
  })

  it('状态停用映射为 frozen', () => {
    const { action, diff } = buildRoleUpdatedDiff(createRole(), { status: 'disabled' })
    expect(action).toBe('system.role.frozen')
    expect(diff.summary).toBe('停用了角色')
    expect(diff.changes?.[0]).toMatchObject({
      field: 'status',
      from: '激活',
      to: '停用'
    })
  })

  it('用户展示名优先真实姓名', () => {
    expect(
      toUserDisplayName({
        username: 'u1',
        nickname: '昵称',
        profile: { realName: '真实名' }
      })
    ).toBe('真实名')
  })
})
