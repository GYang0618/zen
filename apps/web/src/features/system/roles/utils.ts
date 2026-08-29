import type { Role, RoleStatus } from '@zen/shared'

export function isProtectedRole(role: Pick<Role, 'isSystem' | 'kind'>): boolean {
  return role.isSystem || role.kind === 'system'
}

export function canChangeRoleStatus(role: Pick<Role, 'isSystem' | 'kind'>): boolean {
  return !isProtectedRole(role)
}

export function canDeleteRole(role: Pick<Role, 'isSystem' | 'kind' | 'memberCount'>): boolean {
  return !isProtectedRole(role) && role.memberCount === 0
}

export function getDeletableRoles<T extends Pick<Role, 'isSystem' | 'kind' | 'memberCount'>>(
  roles: T[]
): T[] {
  return roles.filter(canDeleteRole)
}

export function getRolesForStatusChange<T extends Pick<Role, 'isSystem' | 'kind' | 'status'>>(
  roles: T[],
  status: RoleStatus
): T[] {
  return roles.filter((role) => canChangeRoleStatus(role) && role.status !== status)
}
