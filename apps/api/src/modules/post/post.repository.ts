import { Inject, Injectable } from '@nestjs/common'
import { POSITION_MEMBER_PREVIEW_LIMIT } from '@zen/shared'

import { withShare } from '../../common/stats/series.js'
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

/** 批量解除关联时，请求中的编制并非全部属于当前组织。事务内抛出以回滚。 */
export class OrganizationPositionsMissingError extends Error {
  constructor() {
    super('部分岗位编制不存在')
    this.name = 'OrganizationPositionsMissingError'
  }
}

/** 批量解除关联时，部分编制仍有在岗人员。事务内抛出以回滚。 */
export class OrganizationPositionsOccupiedError extends Error {
  readonly names: string[]

  constructor(names: string[]) {
    super('仍有在岗人员，无法解除岗位关联')
    this.name = 'OrganizationPositionsOccupiedError'
    this.names = names
  }
}

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

  async batchUnlinkOrganizationPositions(organizationId: string, positionIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      const positions = await tx.post.findMany({
        where: { organizationId, id: { in: positionIds } },
        select: {
          id: true,
          jobProfile: { select: { name: true } },
          _count: { select: { users: { where: { leftAt: null } } } }
        }
      })
      if (positions.length !== positionIds.length) {
        throw new OrganizationPositionsMissingError()
      }

      const occupied = positions.filter((item) => item._count.users > 0)
      if (occupied.length > 0) {
        throw new OrganizationPositionsOccupiedError(occupied.map((item) => item.jobProfile.name))
      }

      await tx.post.deleteMany({
        where: { organizationId, id: { in: positionIds } }
      })
    })
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
          id: true,
          headcount: true,
          jobProfile: { select: { name: true } },
          organization: { select: { name: true } },
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
    const fillCounts = { 空缺: 0, 缺编: 0, 满编: 0, 超编: 0 }
    const staffingPoints: StaffingPoint[] = []

    for (const post of postsWithUsers) {
      const actual = post._count.users
      const plan = post.headcount
      if (actual === 0) vacantCount += 1
      if (actual < plan) understaffedCount += 1
      else if (actual === plan) fullCount += 1
      else overstaffedCount += 1

      const category = classifyStaffing(plan, actual)
      fillCounts[category] += 1
      staffingPoints.push({
        label: `${post.jobProfile.name} · ${post.organization.name}`,
        plan,
        actual,
        category
      })
    }

    const totalPlan = planHeadcountAggregate._sum.headcount ?? 0
    const overallFillRate = totalPlan > 0 ? Number((actualHeadcount / totalPlan).toFixed(4)) : 0

    const topUnderstaffedPositions = postsWithUsers
      .filter((p) => p._count.users < p.headcount)
      .map((p) => ({
        id: p.id,
        postName: p.jobProfile.name,
        orgName: p.organization.name,
        planHeadcount: p.headcount,
        actualHeadcount: p._count.users,
        vacantHeadcount: p.headcount - p._count.users
      }))
      .sort((a, b) => b.vacantHeadcount - a.vacantHeadcount)
      .slice(0, 5)

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
        totalPlanHeadcount: totalPlan,
        totalActualHeadcount: actualHeadcount,
        overallFillRate,
        understaffedCount,
        fullCount,
        overstaffedCount,
        vacantCount,
        topUnderstaffedPositions
      },
      series: {
        levelDistribution: withShare(
          Object.entries(byLevel).map(([label, value]) => ({ label, value }))
        ),
        familyDistribution: withShare(
          byFamily.map((item) => ({ label: item.family, value: item.count }))
        ),
        fillMix: withShare([
          { label: '空缺', value: fillCounts.空缺 },
          { label: '缺编', value: fillCounts.缺编 },
          { label: '满编', value: fillCounts.满编 },
          { label: '超编', value: fillCounts.超编 }
        ]),
        staffingComparison: [...staffingPoints]
          .sort(
            (left, right) => Math.abs(right.plan - right.actual) - Math.abs(left.plan - left.actual)
          )
          .slice(0, STAFFING_COMPARISON_LIMIT)
          .map(({ label, plan, actual }) => ({ label, plan, actual })),
        staffingScatter: [...staffingPoints]
          .sort((left, right) => right.plan - left.plan || right.actual - left.actual)
          .slice(0, STAFFING_SCATTER_LIMIT)
          .map(({ label, plan, actual, category }) => ({
            label,
            x: plan,
            y: actual,
            category
          }))
      }
    }
  }
}

const STAFFING_COMPARISON_LIMIT = 8
const STAFFING_SCATTER_LIMIT = 40

type StaffingCategory = '空缺' | '缺编' | '满编' | '超编'

interface StaffingPoint {
  label: string
  plan: number
  actual: number
  category: StaffingCategory
}

function classifyStaffing(plan: number, actual: number): StaffingCategory {
  if (actual === 0 && plan > 0) return '空缺'
  if (actual < plan) return '缺编'
  if (actual > plan) return '超编'
  return '满编'
}
