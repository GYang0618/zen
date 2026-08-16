import { POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'

import type { JobProfileStatus, OrganizationPositionStatus, Prisma } from '@prisma/client'
import type {
  JobProfileStatus as ApiJobProfileStatus,
  OrganizationPositionStatus as ApiOrganizationPositionStatus,
  JobProfile,
  JobProfileDetail,
  JobProfileIcon,
  JobProfileIconColor,
  JobProfileOrganizationLink,
  Position
} from '@zen/shared'

const PROFILE_STATUS_TO_API: Record<JobProfileStatus, ApiJobProfileStatus> = {
  ACTIVE: 'active',
  DISABLED: 'disabled'
}

const PROFILE_STATUS_FROM_API: Record<ApiJobProfileStatus, JobProfileStatus> = {
  active: 'ACTIVE',
  disabled: 'DISABLED'
}

const POSITION_STATUS_TO_API: Record<OrganizationPositionStatus, ApiOrganizationPositionStatus> = {
  ACTIVE: 'active',
  FROZEN: 'frozen'
}

const POSITION_STATUS_FROM_API: Record<ApiOrganizationPositionStatus, OrganizationPositionStatus> =
  {
    active: 'ACTIVE',
    frozen: 'FROZEN'
  }

export function toApiJobProfileStatus(status: JobProfileStatus): ApiJobProfileStatus {
  return PROFILE_STATUS_TO_API[status]
}

export function fromApiJobProfileStatus(status: ApiJobProfileStatus): JobProfileStatus {
  return PROFILE_STATUS_FROM_API[status]
}

export function toApiOrganizationPositionStatus(
  status: OrganizationPositionStatus
): ApiOrganizationPositionStatus {
  return POSITION_STATUS_TO_API[status]
}

export function fromApiOrganizationPositionStatus(
  status: ApiOrganizationPositionStatus
): OrganizationPositionStatus {
  return POSITION_STATUS_FROM_API[status]
}

export type JobProfileWithCounts = Prisma.JobProfileGetPayload<{
  include: {
    _count: { select: { posts: true } }
    posts: {
      select: {
        headcount: true
        users: {
          select: {
            updatedAt: true
            user: {
              select: {
                id: true
                username: true
                nickname: true
                profile: { select: { realName: true; avatar: true } }
              }
            }
          }
        }
        _count: { select: { users: { where: { leftAt: null } } } }
      }
    }
  }
}>

export type JobProfileWithOrganizations = Prisma.JobProfileGetPayload<{
  include: {
    posts: {
      include: {
        organization: { select: { id: true; name: true; code: true } }
        users: {
          select: {
            updatedAt: true
            user: {
              select: {
                id: true
                username: true
                nickname: true
                profile: { select: { realName: true; avatar: true } }
              }
            }
          }
        }
        _count: { select: { users: { where: { leftAt: null } } } }
      }
    }
  }
}>

export type PostWithProfile = Prisma.PostGetPayload<{
  include: {
    jobProfile: true
    users: {
      include: {
        user: {
          select: {
            id: true
            username: true
            nickname: true
            profile: { select: { realName: true; avatar: true } }
          }
        }
      }
    }
    _count: { select: { users: { where: { leftAt: null } } } }
  }
}>

type AssignmentPreviewSource = {
  updatedAt: Date
  user: {
    id: string
    username: string
    nickname: string | null
    profile: { realName: string | null; avatar: string | null } | null
  }
}

function toMemberPreview(assignments: AssignmentPreviewSource[]): JobProfile['memberPreview'] {
  const sorted = [...assignments].sort((a, b) => {
    const timeDiff = b.updatedAt.getTime() - a.updatedAt.getTime()
    if (timeDiff !== 0) return timeDiff
    return a.user.id.localeCompare(b.user.id)
  })

  const seen = new Set<string>()
  const preview: JobProfile['memberPreview'] = []

  for (const assignment of sorted) {
    if (seen.has(assignment.user.id)) continue
    seen.add(assignment.user.id)
    preview.push({
      id: assignment.user.id,
      name:
        assignment.user.profile?.realName ?? assignment.user.nickname ?? assignment.user.username,
      avatar: assignment.user.profile?.avatar ?? null
    })
    if (preview.length >= POSITION_MEMBER_PREVIEW_LIMIT) break
  }

  return preview
}

export function toJobProfileResponse(row: JobProfileWithCounts): JobProfile {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    level: row.level,
    family: row.family,
    icon: (row.icon as JobProfileIcon | null) ?? null,
    iconColor: (row.iconColor as JobProfileIconColor | null) ?? null,
    status: toApiJobProfileStatus(row.status),
    organizationCount: row._count.posts,
    totalHeadcount: row.posts.reduce((sum, item) => sum + item.headcount, 0),
    activeCount: row.posts.reduce((sum, item) => sum + item._count.users, 0),
    memberPreview: toMemberPreview(row.posts.flatMap((post) => post.users)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export function toJobProfileDetailResponse(row: JobProfileWithOrganizations): JobProfileDetail {
  const organizations: JobProfileOrganizationLink[] = row.posts.map((post) => ({
    id: post.id,
    organizationId: post.organization.id,
    organizationName: post.organization.name,
    organizationCode: post.organization.code,
    headcount: post.headcount,
    activeCount: post._count.users,
    status: toApiOrganizationPositionStatus(post.status),
    level: post.level ?? row.level
  }))

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    level: row.level,
    family: row.family,
    icon: (row.icon as JobProfileIcon | null) ?? null,
    iconColor: (row.iconColor as JobProfileIconColor | null) ?? null,
    status: toApiJobProfileStatus(row.status),
    organizationCount: organizations.length,
    totalHeadcount: organizations.reduce((sum, item) => sum + item.headcount, 0),
    activeCount: organizations.reduce((sum, item) => sum + item.activeCount, 0),
    memberPreview: toMemberPreview(row.posts.flatMap((post) => post.users)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    organizations
  }
}

export function toOrganizationPositionResponse(row: PostWithProfile): Position {
  return {
    id: row.id,
    jobProfileId: row.jobProfileId,
    code: row.jobProfile.code,
    name: row.jobProfile.name,
    description: row.description ?? row.jobProfile.description,
    level: row.level ?? row.jobProfile.level,
    icon: (row.jobProfile.icon as JobProfileIcon | null) ?? null,
    iconColor: (row.jobProfile.iconColor as JobProfileIconColor | null) ?? null,
    headcount: row.headcount,
    activeCount: row._count.users,
    memberPreview: row.users.map(({ user }) => ({
      id: user.id,
      name: user.profile?.realName ?? user.nickname ?? user.username,
      avatar: user.profile?.avatar ?? null
    })),
    status: toApiOrganizationPositionStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}
