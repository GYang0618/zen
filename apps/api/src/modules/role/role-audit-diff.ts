import { createAuditDiff } from '@zen/shared'

import { toApiDataScope, toApiRoleStatus } from './role.mapper'

import type { AuditDiff, AuditDiffChange } from '@zen/shared'
import type { RoleDataScope, RoleStatus, UpdateRoleDto } from './dto'
import type { RoleWithRelations } from './role.repository'

const DATA_SCOPE_LABELS: Record<RoleDataScope, string> = {
  all: '全部数据',
  org_and_child: '本组织及下级',
  org: '仅本组织',
  self: '仅本人数据',
  custom: '自定义组织白名单'
}

const STATUS_LABELS: Record<RoleStatus, string> = {
  active: '激活',
  disabled: '停用'
}

const ICON_COLOR_LABELS: Record<string, string> = {
  slate: '石板灰',
  sky: '天蓝',
  teal: '青绿',
  emerald: '翠绿',
  amber: '琥珀',
  orange: '橙色',
  rose: '玫红',
  indigo: '靛蓝'
}

function displayValue(value: string | null | undefined): string | null {
  if (value == null || value === '') return null
  return value
}

function formatExpiresAt(value: Date | string | null | undefined): string | null {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function pushChange(
  changes: AuditDiffChange[],
  field: string,
  label: string,
  from: string | null,
  to: string | null
) {
  if (from === to) return
  changes.push({ field, label, from, to })
}

export function buildRoleCreatedDiff(role: {
  id: string
  code: string
  name: string
  dataScope: RoleDataScope
  permissionCount: number
}): AuditDiff {
  const summary = role.name.endsWith('角色')
    ? `创建了${role.name}`
    : `创建了${role.name}角色`
  return createAuditDiff({
    summary,
    target: { id: role.id, code: role.code, name: role.name },
    meta: {
      dataScope: role.dataScope,
      permissionCount: role.permissionCount
    }
  })
}

export function buildRoleUpdatedDiff(
  existing: RoleWithRelations,
  data: UpdateRoleDto
): { action: 'system.role.updated' | 'system.role.frozen' | 'system.role.unfrozen'; diff: AuditDiff } {
  const changes: AuditDiffChange[] = []

  if (data.name !== undefined) {
    pushChange(changes, 'name', '角色名称', displayValue(existing.name), displayValue(data.name))
  }
  if (data.description !== undefined) {
    pushChange(
      changes,
      'description',
      '角色描述',
      displayValue(existing.description),
      displayValue(data.description)
    )
  }
  if (data.icon !== undefined) {
    pushChange(changes, 'icon', '角色图标', displayValue(existing.icon), displayValue(data.icon))
  }
  if (data.iconColor !== undefined) {
    pushChange(
      changes,
      'iconColor',
      '图标颜色',
      existing.iconColor ? (ICON_COLOR_LABELS[existing.iconColor] ?? existing.iconColor) : null,
      data.iconColor ? (ICON_COLOR_LABELS[data.iconColor] ?? data.iconColor) : null
    )
  }
  if (data.expiresAt !== undefined) {
    pushChange(
      changes,
      'expiresAt',
      '有效期',
      formatExpiresAt(existing.expiresAt) ?? '无限制',
      formatExpiresAt(data.expiresAt) ?? '无限制'
    )
  }
  if (data.sort !== undefined) {
    pushChange(
      changes,
      'sort',
      '排序',
      String(existing.sort ?? 0),
      String(data.sort)
    )
  }
  if (data.status !== undefined) {
    const fromStatus = toApiRoleStatus(existing.status)
    pushChange(
      changes,
      'status',
      '状态',
      STATUS_LABELS[fromStatus],
      STATUS_LABELS[data.status]
    )
  }
  if (data.dataScope !== undefined) {
    const fromScope = toApiDataScope(existing.dataScope)
    pushChange(
      changes,
      'dataScope',
      '数据范围',
      DATA_SCOPE_LABELS[fromScope],
      DATA_SCOPE_LABELS[data.dataScope]
    )
  }
  if (data.customOrgIds !== undefined) {
    pushChange(
      changes,
      'customOrgIds',
      '自定义组织',
      existing.customOrgIds.length > 0 ? `${existing.customOrgIds.length} 个组织` : '空',
      data.customOrgIds.length > 0 ? `${data.customOrgIds.length} 个组织` : '空'
    )
  }

  const action =
    data.status !== undefined
      ? data.status === 'active'
        ? 'system.role.unfrozen'
        : 'system.role.frozen'
      : 'system.role.updated'

  return {
    action,
    diff: createAuditDiff({
      target: { id: existing.id, code: existing.code, name: existing.name },
      changes,
      summary:
        action === 'system.role.unfrozen'
          ? '启用了角色'
          : action === 'system.role.frozen'
            ? '停用了角色'
            : undefined
    })
  }
}

export function buildRoleDataScopeDiff(
  existing: RoleWithRelations,
  nextScope: RoleDataScope,
  customOrgIds: string[]
): AuditDiff {
  const fromScope = toApiDataScope(existing.dataScope)
  const changes: AuditDiffChange[] = []
  pushChange(
    changes,
    'dataScope',
    '数据范围',
    DATA_SCOPE_LABELS[fromScope],
    DATA_SCOPE_LABELS[nextScope]
  )
  if (nextScope === 'custom' || fromScope === 'custom') {
    pushChange(
      changes,
      'customOrgIds',
      '自定义组织',
      existing.customOrgIds.length > 0 ? `${existing.customOrgIds.length} 个组织` : '空',
      customOrgIds.length > 0 ? `${customOrgIds.length} 个组织` : '空'
    )
  }

  return createAuditDiff({
    target: { id: existing.id, code: existing.code, name: existing.name },
    changes,
    meta: { from: fromScope, to: nextScope, customOrgIds }
  })
}

export function buildRoleMembersDiff(
  role: { id: string; code: string; name: string },
  members: Array<{ id: string; name: string }>,
  kind: 'added' | 'removed'
): AuditDiff {
  return createAuditDiff({
    target: { id: role.id, code: role.code, name: role.name },
    members: kind === 'added' ? { added: members } : { removed: members }
  })
}

export function buildRolePermissionsDiff(
  role: { id: string; code: string; name: string },
  added: Array<{ code: string; module: string; name: string }>,
  removed: Array<{ code: string; module: string; name: string }>
): AuditDiff {
  return createAuditDiff({
    target: { id: role.id, code: role.code, name: role.name },
    permissions: { added, removed }
  })
}

export function buildRoleClonedDiff(input: {
  created: { id: string; code: string; name: string; dataScope: RoleDataScope }
  source: { id: string; code: string; name: string }
  permissionCount: number
}): AuditDiff {
  return createAuditDiff({
    summary: `克隆了${input.source.name}角色为${input.created.name}`,
    target: {
      id: input.created.id,
      code: input.created.code,
      name: input.created.name
    },
    meta: {
      sourceRoleId: input.source.id,
      sourceRoleCode: input.source.code,
      sourceRoleName: input.source.name,
      permissionCount: input.permissionCount,
      dataScope: input.created.dataScope
    }
  })
}

export function buildRoleDeletedDiff(roles: Array<{ id: string; code: string; name: string }>): AuditDiff {
  return createAuditDiff({
    summary:
      roles.length === 1
        ? `删除了${roles[0]!.name}角色`
        : `删除了 ${roles.length} 个角色`,
    meta: {
      ids: roles.map((role) => role.id),
      codes: roles.map((role) => role.code),
      names: roles.map((role) => role.name)
    }
  })
}

export function toUserDisplayName(user: {
  username: string
  nickname: string | null
  profile?: { realName: string | null } | null
}): string {
  return user.profile?.realName ?? user.nickname ?? user.username
}
