import { createAuditDiff } from '@zen/shared'
import { describe, expect, it } from 'vitest'

import {
  flattenPermissionPreview,
  formatMembersLine,
  formatRoleAuditDescription,
  formatRoleAuditLog,
  ROLE_AUDIT_MEMBER_PREVIEW_LIMIT,
  ROLE_AUDIT_PERMISSION_PREVIEW_LIMIT
} from './role-audit'

import type { AuditLogItem } from '@/features/system/audit/api'

function createAuditLog(overrides: Partial<AuditLogItem> = {}): AuditLogItem {
  return {
    id: 'audit-1',
    tenantId: 'default',
    actorId: 'user-1',
    actorName: '张三',
    action: 'system.role.updated',
    resource: 'role',
    resourceId: 'role-1',
    ip: null,
    userAgent: null,
    traceId: null,
    diff: null,
    createdAt: '2026-08-15T13:30:00.000Z',
    ...overrides
  }
}

describe('formatRoleAuditLog', () => {
  it('格式化创建角色', () => {
    const result = formatRoleAuditLog(
      createAuditLog({
        action: 'system.role.created',
        diff: createAuditDiff({
          target: { id: 'role-1', name: '系统管理员', code: 'admin' }
        })
      })
    )

    expect(result.actor).toBe('张三')
    expect(result.title).toBe('创建了角色')
    expect(result.description).toBe('创建了系统管理员角色')
  })

  it('格式化字段变更', () => {
    const result = formatRoleAuditDescription(
      'system.role.updated',
      createAuditDiff({
        changes: [
          { field: 'name', label: '角色名称', from: '11', to: '33' },
          { field: 'icon', label: '角色图标', from: 'shield', to: 'users' },
          { field: 'description', label: '角色描述', from: '旧描述', to: '新描述' }
        ]
      })
    )

    expect(result.description).toBe(
      '角色名称由「11」更新为「33」、角色图标由「shield」更新为「users」、角色描述由「旧描述」更新为「新描述」'
    )
  })

  it('格式化成员添加', () => {
    const result = formatRoleAuditDescription(
      'system.role.members_added',
      createAuditDiff({
        members: {
          added: [
            { id: '1', name: '张三' },
            { id: '2', name: '李四' },
            { id: '3', name: '王五' },
            { id: '4', name: '赵六' }
          ]
        }
      })
    )

    expect(result.description).toBe('添加了张三、李四、王五、赵六 共 4 人')
    expect(result.memberSection).toEqual({
      kind: 'added',
      names: ['张三', '李四', '王五', '赵六']
    })
  })

  it('成员超过预览上限时截断展示', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    expect(formatMembersLine(names, '添加了')).toBe(`添加了a、b、c、d、e 等 ${names.length} 人`)
    expect(
      formatMembersLine(names, '添加了', {
        previewLimit: ROLE_AUDIT_MEMBER_PREVIEW_LIMIT,
        expanded: true
      })
    ).toBe('添加了a、b、c、d、e、f、g、h、i、j 共 10 人')
  })

  it('格式化权限变更并支持截断预览', () => {
    const permissions = Array.from({ length: 8 }, (_, index) => ({
      code: `role:perm_${index}`,
      module: index < 4 ? '角色管理' : '用户管理',
      name: `权限${index + 1}`
    }))

    const formatted = formatRoleAuditDescription(
      'system.role.permissions_assigned',
      createAuditDiff({
        permissions: {
          added: permissions.slice(0, 6),
          removed: permissions.slice(6)
        }
      })
    )

    expect(formatted.description).toContain('新增')
    expect(formatted.description).toContain('角色管理（')
    expect(formatted.permissionSections).toHaveLength(2)

    const preview = flattenPermissionPreview(
      formatted.permissionSections ?? [],
      ROLE_AUDIT_PERMISSION_PREVIEW_LIMIT
    )
    expect(preview.truncated).toBe(true)
    expect(preview.hiddenCount).toBe(3)
    expect(preview.preview.reduce((sum, section) => sum + section.permissions.length, 0)).toBe(5)
  })

  it('系统操作不显示用户标识', () => {
    const result = formatRoleAuditLog(
      createAuditLog({
        actorId: null,
        actorName: null,
        action: 'system.role.created',
        diff: createAuditDiff({
          target: { id: 'role-1', name: '测试角色', code: 'test' }
        })
      })
    )

    expect(result.actor).toBe('系统')
    expect(result.title).toBe('创建了角色')
    expect(result.description).toBe('创建了测试角色')
  })

  it('成员移除使用对应标题文案', () => {
    const result = formatRoleAuditLog(
      createAuditLog({
        action: 'system.role.member_removed',
        diff: createAuditDiff({
          members: { removed: [{ id: '1', name: '李四' }] }
        })
      })
    )

    expect(result.actor).toBe('张三')
    expect(result.title).toBe('移除了成员')
    expect(result.description).toBe('移除了李四 共 1 人')
  })
})
