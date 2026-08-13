import { getPrimaryOrganization, getUserDisplayName } from '@zen/shared'

import type { User, UserOrganizationMembership } from '@zen/shared'

export { getPrimaryOrganization, getUserDisplayName }

export function getUserInitials(user: {
  realName?: string | null
  nickname?: string | null
  username: string
}): string {
  return getUserDisplayName(user).slice(0, 1).toUpperCase()
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}

export function getPrimaryMembership(user: User): UserOrganizationMembership | null {
  return getPrimaryOrganization(user.organizations)
}

export function getOrganizationLabel(membership: UserOrganizationMembership | null): string {
  if (!membership) return '未分配组织'
  return membership.postName
    ? `${membership.organizationName} · ${membership.postName}`
    : membership.organizationName
}

export function flattenOrganizationOptions(
  nodes: Array<{ id: string; name: string; children?: unknown[] }>,
  prefix = ''
): Array<{ id: string; name: string }> {
  const result: Array<{ id: string; name: string }> = []
  for (const node of nodes) {
    const name = prefix ? `${prefix} / ${node.name}` : node.name
    result.push({ id: node.id, name })
    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(
        ...flattenOrganizationOptions(
          node.children as Array<{ id: string; name: string; children?: unknown[] }>,
          name
        )
      )
    }
  }
  return result
}
