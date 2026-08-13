import { deriveRoleEffectiveStatus } from '@zen/shared'

import type { RecordStatus, RoleDataScope, RoleKind } from '@prisma/client'
import type {
  RoleDataScope as ApiRoleDataScope,
  RoleKind as ApiRoleKind,
  RoleIcon,
  RoleIconColor,
  RoleStatus
} from '@zen/shared'
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
  ORGANIZATION: 'org_and_child',
  ORGANIZATION_ONLY: 'org',
  SELF: 'self',
  CUSTOM: 'custom'
}

const DATA_SCOPE_FROM_API: Record<ApiRoleDataScope, RoleDataScope> = {
  all: 'ALL',
  org_and_child: 'ORGANIZATION',
  org: 'ORGANIZATION_ONLY',
  self: 'SELF',
  custom: 'CUSTOM'
}

const KIND_TO_API: Record<RoleKind, ApiRoleKind> = {
  SYSTEM: 'system',
  CUSTOM: 'custom'
}

const KIND_FROM_API: Record<ApiRoleKind, RoleKind> = {
  system: 'SYSTEM',
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

export function toApiRoleKind(kind: RoleKind): ApiRoleKind {
  return KIND_TO_API[kind]
}

export function fromApiRoleKind(kind: ApiRoleKind): RoleKind {
  return KIND_FROM_API[kind]
}

function extractPermissionCodes(role: RoleWithRelations): string[] {
  return role.permissions.map((item) => item.permission.code)
}

function toMemberPreview(role: RoleWithRelations) {
  const users = role.users ?? []
  return users.slice(0, 3).map((item) => ({
    id: item.user.id,
    nickname: item.user.nickname ?? null,
    avatar: item.user.profile?.avatar ?? null
  }))
}

export function toRoleResponse(role: RoleWithRelations): RoleResponse {
  const status = toApiRoleStatus(role.status)
  const kind = toApiRoleKind(role.kind)
  const permissions = extractPermissionCodes(role)
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    status,
    kind,
    effectiveStatus: deriveRoleEffectiveStatus({
      kind,
      status,
      expiresAt: role.expiresAt?.toISOString() ?? null
    }),
    dataScope: toApiDataScope(role.dataScope),
    customOrgIds: role.customOrgIds,
    icon: (role.icon as RoleIcon | null) ?? null,
    iconColor: (role.iconColor as RoleIconColor | null) ?? null,
    expiresAt: role.expiresAt?.toISOString() ?? null,
    sort: role.sort ?? 0,
    description: role.description,
    memberCount: role._count.users,
    permissionCount: permissions.length,
    memberPreview: toMemberPreview(role),
    permissions,
    isSystem: role.isSystem || role.kind === 'SYSTEM',
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString()
  }
}

export function toRoleListItemResponse(role: RoleWithRelations): RoleListItemResponse {
  return toRoleResponse(role)
}
