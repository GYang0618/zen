import { formatFromNow, getPrimaryOrganization, getUserDisplayName } from '@zen/shared'

import type { User, UserOrganizationMembership } from '@zen/shared'
import type { UserPresence } from './data/data'

export { formatFromNow, getPrimaryOrganization, getUserDisplayName }

const ONLINE_WITHIN_MS = 5 * 60 * 1000
const AWAY_WITHIN_MS = 30 * 60 * 1000

export function getUserPresence(
  lastActiveAt: string | null | undefined,
  now = Date.now()
): UserPresence {
  if (!lastActiveAt) return 'offline'
  const timestamp = new Date(lastActiveAt).getTime()
  if (Number.isNaN(timestamp)) return 'offline'
  const elapsed = now - timestamp
  if (elapsed <= ONLINE_WITHIN_MS) return 'online'
  if (elapsed <= AWAY_WITHIN_MS) return 'away'
  return 'offline'
}

export function getUserInitials(user: {
  realName?: string | null
  nickname?: string | null
  username: string
}): string {
  return getUserDisplayName(user).slice(0, 1).toUpperCase()
}

export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return '该用户未绑定手机号'
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(+86) ${digits}`
  }
  if (digits.length === 13 && digits.startsWith('86')) {
    return `(+86) ${digits.slice(2)}`
  }
  return value
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

export type MembershipDraft = {
  organizationId: string
  postId: string
  postName?: string
}

export function diffIdLists(current: string[], next: string[]) {
  const currentSet = new Set(current)
  const nextSet = new Set(next)
  return {
    addedIds: next.filter((id) => !currentSet.has(id)),
    removedIds: current.filter((id) => !nextSet.has(id))
  }
}

export function seedMembershipDrafts(organizations: UserOrganizationMembership[]): {
  memberships: MembershipDraft[]
  primaryOrgId: string
} {
  return {
    memberships: organizations.map((item) => ({
      organizationId: item.organizationId,
      postId: item.postId ?? '',
      postName: item.postName ?? undefined
    })),
    primaryOrgId:
      organizations.find((item) => item.isPrimary)?.organizationId ??
      organizations[0]?.organizationId ??
      ''
  }
}

export function getMembershipChanges(
  initial: MembershipDraft[],
  initialPrimary: string,
  next: MembershipDraft[],
  nextPrimary: string
) {
  const { addedIds, removedIds } = diffIdLists(
    initial.map((item) => item.organizationId),
    next.map((item) => item.organizationId)
  )
  const initialPosts = new Map(initial.map((item) => [item.organizationId, item.postId]))
  const postChangedIds = next
    .filter((item) => initialPosts.has(item.organizationId))
    .filter((item) => initialPosts.get(item.organizationId) !== item.postId)
    .map((item) => item.organizationId)

  return {
    addedIds,
    removedIds,
    postChangedIds,
    primaryChanged: initialPrimary !== nextPrimary,
    isDirty:
      addedIds.length > 0 ||
      removedIds.length > 0 ||
      postChangedIds.length > 0 ||
      initialPrimary !== nextPrimary
  }
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
