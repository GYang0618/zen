import { formatFromNow, parseAuditDiff } from '@zen/shared'

import type { AuditDiff, AuditDiffPermission } from '@zen/shared'
import type { AuditLogItem } from '@/features/system/audit/api'

export const ROLE_AUDIT_PERMISSION_PREVIEW_LIMIT = 5
export const ROLE_AUDIT_MEMBER_PREVIEW_LIMIT = 5

export type PermissionSection = {
  kind: 'added' | 'removed'
  label: string
  permissions: AuditDiffPermission[]
}

export type MemberSection = {
  kind: 'added' | 'removed'
  names: string[]
}

type FormattedRoleAudit = {
  actor: string
  title: string
  timestamp: string
  description: string
  permissionSections?: PermissionSection[]
  memberSection?: MemberSection
}

const ROLE_ACTION_TITLES: Record<string, string> = {
  'system.role.created': '创建了角色',
  'system.role.updated': '更新了信息',
  'system.role.unfrozen': '启用了角色',
  'system.role.frozen': '停用了角色',
  'system.role.data_scope_updated': '调整了数据范围',
  'system.role.cloned': '克隆了角色',
  'system.role.members_added': '添加了成员',
  'system.role.member_removed': '移除了成员',
  'system.role.permissions_assigned': '更新了权限',
  'system.role.deleted': '删除了角色'
}

export function getRoleAuditTitle(action: string): string {
  return ROLE_ACTION_TITLES[action] ?? '操作了角色'
}

function displayText(value: string | null | undefined): string {
  if (value == null || value === '') return '空'
  return value
}

function formatAuditTime(value: string): string {
  const formatted = formatFromNow(value)
  return formatted === '—' ? '时间未知' : formatted
}

export function groupPermissionLabels(items: AuditDiffPermission[]): string[] {
  const groups = new Map<string, string[]>()
  for (const item of items) {
    const moduleName = item.module || '其他'
    const current = groups.get(moduleName) ?? []
    current.push(item.name)
    groups.set(moduleName, current)
  }
  return Array.from(groups.entries()).map(
    ([moduleName, names]) => `${moduleName}：${names.join('、')}`
  )
}

export function formatMembersLine(
  names: string[],
  verb: '添加了' | '移除了',
  options?: { previewLimit?: number; expanded?: boolean }
): string {
  if (names.length === 0) return `${verb} 0 人`
  const limit = options?.previewLimit ?? ROLE_AUDIT_MEMBER_PREVIEW_LIMIT
  const expanded = options?.expanded ?? names.length <= limit
  if (expanded || names.length <= limit) {
    return `${verb}${names.join('、')} 共 ${names.length} 人`
  }
  const preview = names.slice(0, limit)
  return `${verb}${preview.join('、')} 等 ${names.length} 人`
}

function formatChanges(diff: AuditDiff): string {
  if (!diff.changes || diff.changes.length === 0) {
    return '无字段变更'
  }
  return diff.changes
    .map(
      (change) =>
        `${change.label}由「${displayText(change.from)}」更新为「${displayText(change.to)}」`
    )
    .join('、')
}

export function formatPermissionSectionsText(sections: PermissionSection[]): string {
  if (sections.length === 0) return '无权限变更'
  return sections
    .map((section) => {
      const title = section.kind === 'added' ? '新增' : '移除'
      const lines = groupPermissionLabels(section.permissions).map((label) => {
        const [moduleName, names] = label.split('：')
        return `${moduleName}（${names ?? ''}）`
      })
      return [title, ...lines].join('\n')
    })
    .join('\n')
}

function buildPermissionSections(diff: AuditDiff): PermissionSection[] {
  const sections: PermissionSection[] = []
  if (diff.permissions?.added && diff.permissions.added.length > 0) {
    sections.push({
      kind: 'added',
      label: '新增 ',
      permissions: diff.permissions.added
    })
  }
  if (diff.permissions?.removed && diff.permissions.removed.length > 0) {
    sections.push({
      kind: 'removed',
      label: '移除 ',
      permissions: diff.permissions.removed
    })
  }
  return sections
}

export function formatRoleAuditDescription(
  action: string,
  diff: AuditDiff | null
): {
  description: string
  permissionSections?: PermissionSection[]
  memberSection?: MemberSection
} {
  if (!diff) {
    return { description: '执行了角色相关操作' }
  }

  if (action === 'system.role.created') {
    const name = diff.target?.name
    if (!name) return { description: diff.summary ?? '创建了角色' }
    return {
      description: name.endsWith('角色') ? `创建了${name}` : `创建了${name}角色`
    }
  }

  if (action === 'system.role.cloned') {
    return { description: diff.summary ?? '克隆了角色' }
  }

  if (action === 'system.role.deleted') {
    return { description: diff.summary ?? '删除了角色' }
  }

  if (action === 'system.role.unfrozen') {
    return { description: diff.summary ?? '启用了角色' }
  }

  if (action === 'system.role.frozen') {
    return { description: diff.summary ?? '停用了角色' }
  }

  if (action === 'system.role.updated' || action === 'system.role.data_scope_updated') {
    return { description: formatChanges(diff) }
  }

  if (action === 'system.role.members_added') {
    const names = (diff.members?.added ?? []).map((item) => item.name)
    const memberSection: MemberSection = { kind: 'added', names }
    return {
      description: formatMembersLine(names, '添加了'),
      memberSection
    }
  }

  if (action === 'system.role.member_removed') {
    const names = (diff.members?.removed ?? []).map((item) => item.name)
    const memberSection: MemberSection = { kind: 'removed', names }
    return {
      description: formatMembersLine(names, '移除了'),
      memberSection
    }
  }

  if (action === 'system.role.permissions_assigned') {
    const permissionSections = buildPermissionSections(diff)
    return {
      description: formatPermissionSectionsText(permissionSections),
      permissionSections
    }
  }

  return { description: diff.summary ?? '执行了角色相关操作' }
}

export function formatRoleAuditLog(log: AuditLogItem): FormattedRoleAudit {
  const diff = parseAuditDiff(log.diff)
  const formatted = formatRoleAuditDescription(log.action, diff)

  return {
    actor: log.actorId ? (log.actorName ?? '未知用户') : '系统',
    title: getRoleAuditTitle(log.action),
    timestamp: formatAuditTime(log.createdAt),
    description: formatted.description,
    permissionSections: formatted.permissionSections,
    memberSection: formatted.memberSection
  }
}

/** 按单条权限截断，保留模块分组展示顺序 */
export function flattenPermissionPreview(
  sections: PermissionSection[],
  limit = ROLE_AUDIT_PERMISSION_PREVIEW_LIMIT
): { preview: PermissionSection[]; truncated: boolean; hiddenCount: number } {
  let remaining = limit
  const preview: PermissionSection[] = []
  let totalItems = 0

  for (const section of sections) {
    totalItems += section.permissions.length
    if (remaining <= 0) continue
    const sliced = section.permissions.slice(0, remaining)
    remaining -= sliced.length
    if (sliced.length > 0) {
      preview.push({ ...section, permissions: sliced })
    }
  }

  const shown = preview.reduce((sum, section) => sum + section.permissions.length, 0)
  return {
    preview,
    truncated: shown < totalItems,
    hiddenCount: Math.max(0, totalItems - shown)
  }
}
