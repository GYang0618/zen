import type { OrganizationType, RecordStatus } from '@prisma/client'
import type { OrganizationStatus as ApiStatus, OrganizationType as ApiType } from '@zen/shared'
import type { OrganizationWithRelations } from './organization.repository'
import type { OrganizationResponse } from './responses/organization.response'

const TYPE_TO_API: Record<OrganizationType, ApiType> = {
  COMPANY: 'company',
  BRANCH: 'branch',
  DEPARTMENT: 'department',
  TEAM: 'team'
}

const TYPE_FROM_API: Record<ApiType, OrganizationType> = {
  company: 'COMPANY',
  branch: 'BRANCH',
  department: 'DEPARTMENT',
  team: 'TEAM'
}

const STATUS_TO_API: Record<RecordStatus, ApiStatus> = {
  ACTIVE: 'active',
  DISABLED: 'disabled'
}

const STATUS_FROM_API: Record<ApiStatus, RecordStatus> = {
  active: 'ACTIVE',
  disabled: 'DISABLED'
}

export function toApiOrganizationType(type: OrganizationType): ApiType {
  return TYPE_TO_API[type]
}

export function fromApiOrganizationType(type: ApiType): OrganizationType {
  return TYPE_FROM_API[type]
}

export function toApiOrganizationStatus(status: RecordStatus): ApiStatus {
  return STATUS_TO_API[status]
}

export function fromApiOrganizationStatus(status: ApiStatus): RecordStatus {
  return STATUS_FROM_API[status]
}

export function toOrganizationResponse(org: OrganizationWithRelations): OrganizationResponse {
  return {
    id: org.id,
    code: org.code,
    name: org.name,
    type: toApiOrganizationType(org.type),
    parentId: org.parentId,
    leaderId: org.leaderId,
    leaderName: org.leader?.nickname ?? org.leader?.username ?? null,
    description: org.description ?? null,
    status: toApiOrganizationStatus(org.status),
    sort: org.sort ?? 0,
    path: org.path,
    level: org.level,
    memberCount: org._count.users,
    childrenCount: org._count.children,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString()
  }
}
