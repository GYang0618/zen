import { Inject, Injectable } from '@nestjs/common'
import { POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/prisma.service.js'

import type { JobProfileStatus, Prisma } from '@prisma/client'
import type { PostStatisticsResponse } from './responses/post.response.js'

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
  roles: {
    include: {
      role: {
        select: {
          id: true,
          code: true,
          name: true
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
    status?: JobProfileStatus | JobProfileStatus[]
    level?: string
  }): Prisma.JobProfileWhereInput {
    const where: Prisma.JobProfileWhereInput = {}
    if (Array.isArray(input.status)) {
      where.status = { in: input.status }
    } else if (input.status) {
      where.status = input.status
    }
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

  async updatePostRoles(postId: string, roleIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.postRole.deleteMany({ where: { postId } })
      if (roleIds.length > 0) {
        await tx.postRole.createMany({
          data: roleIds.map((roleId) => ({ postId, roleId }))
        })
      }
      return tx.post.findUnique({
        where: { id: postId },
        include: POST_WITH_PROFILE_INCLUDE
      })
    })
  }

  async getStatistics(organizationId?: string): Promise<PostStatisticsResponse> {
    const postWhere: Prisma.PostWhereInput = organizationId ? { organizationId } : {}
    const userOrgWhere: Prisma.UserOrganizationWhereInput = {
      postId: { not: null },
      leftAt: null,
      ...(organizationId ? { organizationId } : {})
    }

    const [
      profileTotal,
      profileStatusGroups,
      profileLevelGroups,
      profileFamilyGroups,
      positionTotal,
      positionStatusGroups,
      planHeadcountAggregate,
      actualHeadcount,
      postsWithUsers
    ] = await Promise.all([
      this.prisma.jobProfile.count(),
      this.prisma.jobProfile.groupBy({ by: ['status'], _count: true }),
      this.prisma.jobProfile.groupBy({ by: ['level'], _count: true }),
      this.prisma.jobProfile.groupBy({
        by: ['family'],
        where: { family: { not: null } },
        _count: true
      }),
      this.prisma.post.count({ where: postWhere }),
      this.prisma.post.groupBy({ by: ['status'], where: postWhere, _count: true }),
      this.prisma.post.aggregate({
        where: postWhere,
        _sum: { headcount: true }
      }),
      this.prisma.userOrganization.count({ where: userOrgWhere }),
      this.prisma.post.findMany({
        where: postWhere,
        select: {
          headcount: true,
          _count: {
            select: {
              users: { where: { leftAt: null } }
            }
          }
        }
      })
    ])

    let activeProfiles = 0
    let disabledProfiles = 0
    for (const g of profileStatusGroups) {
      if (g.status === 'ACTIVE') activeProfiles = g._count
      if (g.status === 'DISABLED') disabledProfiles = g._count
    }

    const byLevel: Record<string, number> = {}
    for (const g of profileLevelGroups) {
      byLevel[g.level] = g._count
    }

    const byFamily = profileFamilyGroups
      .filter((g): g is typeof g & { family: string } => typeof g.family === 'string')
      .map((g) => ({
        family: g.family,
        count: g._count
      }))

    let activePositions = 0
    let frozenPositions = 0
    for (const g of positionStatusGroups) {
      if (g.status === 'ACTIVE') activePositions = g._count
      if (g.status === 'FROZEN') frozenPositions = g._count
    }

    let understaffedCount = 0
    let fullCount = 0
    let overstaffedCount = 0
    let vacantCount = 0

    for (const p of postsWithUsers) {
      const actual = p._count.users
      if (actual === 0) {
        vacantCount++
      }
      if (actual < p.headcount) {
        understaffedCount++
      } else if (actual === p.headcount) {
        fullCount++
      } else {
        overstaffedCount++
      }
    }

    return {
      profiles: {
        total: profileTotal,
        active: activeProfiles,
        disabled: disabledProfiles,
        byLevel,
        byFamily
      },
      positions: {
        totalCount: positionTotal,
        activeCount: activePositions,
        frozenCount: frozenPositions,
        totalPlanHeadcount: planHeadcountAggregate._sum.headcount ?? 0,
        totalActualHeadcount: actualHeadcount,
        understaffedCount,
        fullCount,
        overstaffedCount,
        vacantCount
      }
    }
  }
}
