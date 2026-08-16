import type { OrganizationType, UserStatusCode } from '@prisma/client'
import type { OrganizationType as ApiType, OrganizationMember } from '@zen/shared'
import type { OrganizationWithRelations } from './organization.repository'
import type { OrganizationResponse } from './responses/organization.response'

const TYPE_TO_API: Record<OrganizationType, ApiType> = {
  GROUP: 'group',
  COMPANY: 'company',
  BRANCH: 'branch',
  CENTER: 'center',
  DEPARTMENT: 'department',
  TEAM: 'team'
}

const TYPE_FROM_API: Record<ApiType, OrganizationType> = {
  group: 'GROUP',
  company: 'COMPANY',
  branch: 'BRANCH',
  center: 'CENTER',
  department: 'DEPARTMENT',
  team: 'TEAM'
}

const USER_STATUS_TO_API: Record<UserStatusCode, OrganizationMember['accountStatus']> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
}

export function toApiOrganizationType(type: OrganizationType): ApiType {
  return TYPE_TO_API[type]
}

export function fromApiOrganizationType(type: ApiType): OrganizationType {
  return TYPE_FROM_API[type]
}

export function toOrganizationResponse(org: OrganizationWithRelations): OrganizationResponse {
  const leader = org.leader
  return {
    id: org.id,
    code: org.code,
    name: org.name,
    type: toApiOrganizationType(org.type),
    parentId: org.parentId,
    description: org.description ?? null,
    effectiveDate: org.effectiveDate.toISOString().slice(0, 10),
    leader: leader
      ? {
          id: leader.id,
          name: leader.profile?.realName ?? leader.nickname ?? leader.username,
          title: leader.profile?.jobTitle ?? null,
          avatar: leader.profile?.avatar ?? null,
          email: leader.email,
          phone: leader.phoneNumber
        }
      : null,
    memberCount: org._count.users,
    positionCount: org._count.posts,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString()
  }
}

export function toOrganizationMemberResponse(row: {
  user: {
    id: string
    username: string
    nickname: string | null
    email: string
    phoneNumber: string | null
    status: UserStatusCode
    profile: { avatar: string | null } | null
  }
  post: {
    level: string | null
    jobProfile: { name: string; level: string }
  } | null
  organization: { name: string }
}): OrganizationMember {
  return {
    id: row.user.id,
    avatar: row.user.profile?.avatar ?? null,
    username: row.user.username,
    nickname: row.user.nickname,
    post: row.post?.jobProfile.name ?? null,
    organization: row.organization.name,
    accountStatus: USER_STATUS_TO_API[row.user.status],
    email: row.user.email,
    phoneNumber: row.user.phoneNumber,
    level: row.post?.level ?? row.post?.jobProfile.level ?? null
  }
}
