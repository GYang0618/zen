import type { RecordStatus, RoleDataScope } from '@prisma/client'
import type { RoleDataScope as ApiRoleDataScope, RoleStatus } from '@zen/shared'
import type { RoleListItemResponse, RoleResponse } from './responses/role.response'
import type { RoleWithRelations } from './role.repository'

const ROLE_STATUS_TO_API: Record<RecordStatus, RoleStatus> = {
  ACTIVE: 'active',
  DISABLED: 'disabled'
}

const ROLE_STATUS_FROM_API: Record<RoleStatus, RecordStatus> = {
  active: 'ACTIVE',
  disabled: 'DISABLED'
}

const DATA_SCOPE_TO_API: Record<RoleDataScope, ApiRoleDataScope> = {
  ALL: 'all',
  ORGANIZATION: 'department',
  SELF: 'self',
  CUSTOM: 'custom'
}

const DATA_SCOPE_FROM_API: Record<ApiRoleDataScope, RoleDataScope> = {
  all: 'ALL',
  department: 'ORGANIZATION',
  self: 'SELF',
  custom: 'CUSTOM'
}

export function toApiRoleStatus(status: RecordStatus): RoleStatus {
  return ROLE_STATUS_TO_API[status]
}

export function fromApiRoleStatus(status: RoleStatus): RecordStatus {
  return ROLE_STATUS_FROM_API[status]
}

export function toApiDataScope(dataScope: RoleDataScope): ApiRoleDataScope {
  return DATA_SCOPE_TO_API[dataScope]
}

export function fromApiDataScope(dataScope: ApiRoleDataScope): RoleDataScope {
  return DATA_SCOPE_FROM_API[dataScope]
}

function extractPermissionCodes(role: RoleWithRelations): string[] {
  return role.permissions.map((item) => item.permission.code)
}

export function toRoleResponse(role: RoleWithRelations): RoleResponse {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    status: toApiRoleStatus(role.status),
    dataScope: toApiDataScope(role.dataScope),
    customOrgIds: role.customOrgIds ?? [],
    sort: role.sort ?? 0,
    description: role.description ?? null,
    memberCount: role._count.users,
    permissions: extractPermissionCodes(role),
    isSystem: role.isSystem,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString()
  }
}

export function toRoleListItemResponse(role: RoleWithRelations): RoleListItemResponse {
  return toRoleResponse(role)
}
