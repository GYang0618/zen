import { Inject, Injectable } from '@nestjs/common'
import { POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/prisma.service.js'

import type { JobProfileStatus, Prisma } from '@prisma/client'

export const JOB_PROFILE_LIST_INCLUDE = {
  _count: { select: { posts: true } },
  posts: {
    select: {
      headcount: true,
      users: {
        where: { leftAt: null },
        orderBy: [{ updatedAt: 'desc' }, { userId: 'asc' }],
        take: Math.max(POSITION_MEMBER_PREVIEW_LIMIT * 5, 10),
        select: {
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              profile: { select: { realName: true, avatar: true } }
            }
          }
        }
      },
      _count: { select: { users: { where: { leftAt: null } } } }
    }
  }
} satisfies Prisma.JobProfileInclude

export const JOB_PROFILE_DETAIL_INCLUDE = {
  posts: {
    include: {
      organization: { select: { id: true, name: true, code: true } },
      users: {
        where: { leftAt: null },
        orderBy: [{ updatedAt: 'desc' }, { userId: 'asc' }],
        take: Math.max(POSITION_MEMBER_PREVIEW_LIMIT * 5, 10),
        select: {
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              profile: { select: { realName: true, avatar: true } }
            }
          }
        }
      },
      _count: { select: { users: { where: { leftAt: null } } } }
    },
    orderBy: [{ organization: { name: 'asc' } }, { id: 'asc' }]
  }
} satisfies Prisma.JobProfileInclude

export const POST_WITH_PROFILE_INCLUDE = {
  jobProfile: true,
  users: {
    where: { leftAt: null },
    orderBy: [{ updatedAt: 'desc' }, { userId: 'asc' }],
    take: POSITION_MEMBER_PREVIEW_LIMIT,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          profile: { select: { realName: true, avatar: true } }
        }
      }
    }
  },
  _count: { select: { users: { where: { leftAt: null } } } }
} satisfies Prisma.PostInclude

@Injectable()
export class PostRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  countProfiles(where: Prisma.JobProfileWhereInput) {
    return this.prisma.jobProfile.count({ where })
  }

  findProfiles(where: Prisma.JobProfileWhereInput, pagination: { skip: number; take: number }) {
    return this.prisma.jobProfile.findMany({
      where,
      include: JOB_PROFILE_LIST_INCLUDE,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      ...pagination
    })
  }

  findProfileById(id: string) {
    return this.prisma.jobProfile.findUnique({
      where: { id },
      include: JOB_PROFILE_DETAIL_INCLUDE
    })
  }

  findProfileByCode(code: string) {
    return this.prisma.jobProfile.findUnique({ where: { code } })
  }

  findActiveProfileById(id: string) {
    return this.prisma.jobProfile.findFirst({
      where: { id, status: 'ACTIVE' }
    })
  }

  createProfile(data: Prisma.JobProfileCreateInput) {
    return this.prisma.jobProfile.create({
      data,
      include: JOB_PROFILE_LIST_INCLUDE
    })
  }

  updateProfile(id: string, data: Prisma.JobProfileUpdateInput) {
    return this.prisma.jobProfile.update({
      where: { id },
      data,
      include: JOB_PROFILE_LIST_INCLUDE
    })
  }

  findProfileWithCounts(id: string) {
    return this.prisma.jobProfile.findUnique({
      where: { id },
      include: JOB_PROFILE_LIST_INCLUDE
    })
  }

  deleteProfile(id: string) {
    return this.prisma.jobProfile.delete({ where: { id } })
  }

  listOrganizationPositions(organizationId: string) {
    return this.prisma.post.findMany({
      where: { organizationId },
      include: POST_WITH_PROFILE_INCLUDE,
      orderBy: [{ jobProfile: { name: 'asc' } }, { id: 'asc' }]
    })
  }

  findOrganizationPosition(organizationId: string, positionId: string) {
    return this.prisma.post.findFirst({
      where: { id: positionId, organizationId },
      include: POST_WITH_PROFILE_INCLUDE
    })
  }

  findOrganizationPositionByProfile(organizationId: string, jobProfileId: string) {
    return this.prisma.post.findUnique({
      where: {
        organizationId_jobProfileId: { organizationId, jobProfileId }
      }
    })
  }

  createOrganizationPosition(data: Prisma.PostCreateInput) {
    return this.prisma.post.create({
      data,
      include: POST_WITH_PROFILE_INCLUDE
    })
  }

  updateOrganizationPosition(id: string, data: Prisma.PostUpdateInput) {
    return this.prisma.post.update({
      where: { id },
      data,
      include: POST_WITH_PROFILE_INCLUDE
    })
  }

  countActiveAssignments(positionId: string) {
    return this.prisma.userOrganization.count({
      where: { postId: positionId, leftAt: null }
    })
  }

  deleteOrganizationPosition(id: string) {
    return this.prisma.post.delete({ where: { id } })
  }

  buildProfileWhere(input: {
    keyword?: string
    status?: JobProfileStatus
    level?: string
  }): Prisma.JobProfileWhereInput {
    const where: Prisma.JobProfileWhereInput = {}
    if (input.status) where.status = input.status
    if (input.level) where.level = input.level
    if (input.keyword?.trim()) {
      const keyword = input.keyword.trim()
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { family: { contains: keyword, mode: 'insensitive' } }
      ]
    }
    return where
  }
}
