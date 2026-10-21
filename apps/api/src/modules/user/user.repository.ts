import { Inject, Injectable } from '@nestjs/common'

import {
  activityLevels,
  eachLocalDate,
  localDateKey,
  ratio,
  withShare
} from '../../common/stats/series.js'
import { PrismaService } from '../../infra/prisma/prisma.service.js'

import type { Prisma, UserStatusCode } from '@prisma/client'
import type { UserStatisticsResponse } from './responses/user.response.js'

export const USER_INCLUDE = {
  profile: true,
  security: true,
  preference: true,
  audit: true,
  organizations: {
    where: { leftAt: null },
    include: {
      organization: true,
      post: { include: { jobProfile: true } }
    }
  },
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } }
        }
      }
    }
  },
  sessions: {
    where: { revokedAt: null },
    select: { expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' as const }
  }
} satisfies Prisma.UserInclude

/** 列表查询：仅主职组织 + 主角色，角色不拉权限明细 */
export const USER_LIST_INCLUDE = {
  profile: true,
  audit: true,
  organizations: {
    where: { leftAt: null },
    include: {
      organization: true,
      post: { include: { jobProfile: true } }
    },
    orderBy: [{ isPrimary: 'desc' as const }, { joinedAt: 'asc' as const }],
    take: 1
  },
  roles: {
    include: {
      role: true
    },
    orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'asc' as const }],
    take: 1
  }
} satisfies Prisma.UserInclude

const USER_BASIC_INFO_SELECT = {
  id: true,
  nickname: true,
  email: true,
  phoneNumber: true,
  updatedAt: true,
  profile: {
    select: {
      realName: true,
      avatar: true,
      gender: true,
      remark: true
    }
  }
} satisfies Prisma.UserSelect

const USER_ROLES_SELECT = {
  id: true,
  roles: USER_INCLUDE.roles
} satisfies Prisma.UserSelect

const USER_ORGANIZATIONS_SELECT = {
  id: true,
  organizations: USER_INCLUDE.organizations
} satisfies Prisma.UserSelect

export type UserWithDomain = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>
export type UserListWithDomain = Prisma.UserGetPayload<{ include: typeof USER_LIST_INCLUDE }>
export type UserBasicInfo = Prisma.UserGetPayload<{ select: typeof USER_BASIC_INFO_SELECT }>
export type UserRoles = Prisma.UserGetPayload<{ select: typeof USER_ROLES_SELECT }>
export type UserOrganizations = Prisma.UserGetPayload<{
  select: typeof USER_ORGANIZATIONS_SELECT
}>

const USER_TREND_DAYS = 14
const USER_CALENDAR_DAYS = 84

function buildCreationSeries(now: Date, createdAtList: Date[]) {
  const calendarStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (USER_CALENDAR_DAYS - 1)
  )
  const dates = eachLocalDate(calendarStart, USER_CALENDAR_DAYS)
  const counts = new Map(dates.map((date) => [date, 0]))
  for (const createdAt of createdAtList) {
    const key = localDateKey(createdAt)
    if (!counts.has(key)) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const values = dates.map((date) => counts.get(date) ?? 0)
  const levels = activityLevels(values)
  const creationCalendar = dates.map((date, index) => ({
    date,
    count: values[index] ?? 0,
    level: levels[index] ?? 0,
    tooltip: `${date}：新增 ${values[index] ?? 0} 人`
  }))
  const trend = creationCalendar.slice(-USER_TREND_DAYS).map(({ date, count }) => ({ date, count }))
  const half = USER_TREND_DAYS / 2
  const weeklyNewUsers = trend.slice(half).map((point, index) => ({
    label: point.date.slice(5),
    previous: trend[index]?.count ?? 0,
    current: point.count
  }))

  return { trend, creationCalendar, weeklyNewUsers }
}

@Injectable()
export class UserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findUnique(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where })
  }

  findActiveWithDomainById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: USER_INCLUDE })
  }

  findActiveBasicInfoById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_BASIC_INFO_SELECT
    })
  }

  findActiveRolesById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_ROLES_SELECT
    })
  }

  findActiveOrganizationsById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_ORGANIZATIONS_SELECT
    })
  }

  findUniqueWithDomain(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where, include: USER_INCLUDE })
  }

  findManyWithDomainByIds(ids: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: USER_INCLUDE
    })
  }

  findManyWithDomainByIdsAny(ids: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      include: USER_INCLUDE
    })
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data })
  }

  update(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where, data })
  }

  delete(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.delete({ where })
  }

  deleteManyByIds(ids: string[]) {
    return this.prisma.user.deleteMany({
      where: { id: { in: ids } }
    })
  }

  softDeleteByIds(ids: string[]) {
    return this.prisma.user.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() }
    })
  }

  restoreByIds(ids: string[]) {
    return this.prisma.user.updateMany({
      where: { id: { in: ids }, NOT: { deletedAt: null } },
      data: { deletedAt: null }
    })
  }

  updateStatusByIds(ids: string[], status: UserStatusCode) {
    return this.prisma.user.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status }
    })
  }

  count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where })
  }

  findManyWithDomain(
    where: Prisma.UserWhereInput,
    skip: number | undefined,
    take: number | undefined,
    orderBy: Prisma.UserOrderByWithRelationInput
  ) {
    return this.prisma.user.findMany({
      where,
      include: USER_INCLUDE,
      skip,
      take,
      orderBy
    })
  }

  findManyForList(
    where: Prisma.UserWhereInput,
    skip: number | undefined,
    take: number | undefined,
    orderBy: Prisma.UserOrderByWithRelationInput
  ) {
    return this.prisma.user.findMany({
      where,
      include: USER_LIST_INCLUDE,
      skip,
      take,
      orderBy
    })
  }

  /** 确保用户的所有关联领域表数据存在（幂等 upsert） */
  ensureDomainData(userId: string) {
    const upsertArgs = { where: { userId }, create: { userId }, update: {} }
    return this.prisma.$transaction([
      this.prisma.userProfile.upsert(upsertArgs),
      this.prisma.userSecurity.upsert(upsertArgs),
      this.prisma.userPreference.upsert(upsertArgs),
      this.prisma.userAudit.upsert(upsertArgs)
    ])
  }

  touchLoginAudit(userId: string, lastLoginIp?: string) {
    const now = new Date()
    return this.prisma.userAudit.update({
      where: { userId },
      data: { lastLoginAt: now, lastActiveAt: now, lastLoginIp }
    })
  }

  updateSecurity(userId: string, data: Prisma.UserSecurityUpdateInput) {
    return this.prisma.userSecurity.update({
      where: { userId },
      data
    })
  }

  findRoleByCode(code: string) {
    return this.prisma.role.findUnique({ where: { code } })
  }

  upsertUserRole(userId: string, roleId: string, isPrimary = false) {
    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId, isPrimary },
      update: { isPrimary }
    })
  }

  findRolesByIds(ids: string[]) {
    return this.prisma.role.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' }
    })
  }

  replaceUserRoles(userId: string, roles: Array<{ roleId: string; isPrimary: boolean }>) {
    return this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      ...(roles.length > 0
        ? [
            this.prisma.userRole.createMany({
              data: roles.map((item) => ({
                userId,
                roleId: item.roleId,
                isPrimary: item.isPrimary
              }))
            })
          ]
        : [])
    ])
  }

  async setPrimaryUserRole(userId: string, primaryRoleId: string) {
    await this.prisma.$transaction([
      this.prisma.userRole.updateMany({
        where: { userId },
        data: { isPrimary: false }
      }),
      this.prisma.userRole.update({
        where: { userId_roleId: { userId, roleId: primaryRoleId } },
        data: { isPrimary: true }
      })
    ])
  }

  findOrganizationsByIds(ids: string[]) {
    return this.prisma.organization.findMany({
      where: { id: { in: ids } },
      select: { id: true }
    })
  }

  findPostsByIds(ids: string[]) {
    return this.prisma.post.findMany({
      where: { id: { in: ids } },
      select: { id: true, organizationId: true }
    })
  }

  async replaceUserOrganizations(
    userId: string,
    organizations: Array<{ organizationId: string; isPrimary: boolean; postId: string | null }>
  ) {
    const now = new Date()
    await this.prisma.$transaction(async (tx) => {
      await tx.userOrganization.updateMany({
        where: { userId, leftAt: null },
        data: { leftAt: now }
      })

      for (const item of organizations) {
        await tx.userOrganization.upsert({
          where: {
            userId_organizationId: {
              userId,
              organizationId: item.organizationId
            }
          },
          create: {
            userId,
            organizationId: item.organizationId,
            isPrimary: item.isPrimary,
            postId: item.postId,
            joinedAt: now,
            leftAt: null
          },
          update: {
            isPrimary: item.isPrimary,
            postId: item.postId,
            joinedAt: now,
            leftAt: null
          }
        })
      }
    })
  }

  countActiveSuperAdminsExcluding(userId: string) {
    return this.prisma.userRole.count({
      where: {
        role: { code: 'super_admin' },
        user: { deletedAt: null, id: { not: userId } }
      }
    })
  }

  async getStatistics(where?: Prisma.UserWhereInput): Promise<UserStatisticsResponse> {
    const activeWhere: Prisma.UserWhereInput = { ...where, deletedAt: null }
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const calendarStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (USER_CALENDAR_DAYS - 1)
    )

    const [
      total,
      deletedCount,
      statusGroups,
      genderGroups,
      lockedCount,
      mfaEnabledCount,
      mustChangePasswordCount,
      assignedCount,
      unassignedCount,
      noRoleCount,
      newUsersLast7Days,
      previous7DaysCount,
      newUsersLast30Days,
      activeUsersLast7Days,
      activeUsersLast30Days,
      neverLoggedInCount,
      activatedAndAssigned,
      activatedAssignedLoggedIn,
      activatedAssignedActive30,
      calendarUsers,
      topOrgs
    ] = await Promise.all([
      this.prisma.user.count({ where: activeWhere }),
      this.prisma.user.count({ where: { deletedAt: { not: null } } }),
      this.prisma.user.groupBy({
        by: ['status'],
        where: activeWhere,
        _count: true
      }),
      this.prisma.userProfile.groupBy({
        by: ['gender'],
        where: { user: activeWhere },
        _count: true
      }),
      this.prisma.user.count({ where: { ...activeWhere, isLocked: true } }),
      this.prisma.userSecurity.count({
        where: { mfaEnabled: true, user: activeWhere }
      }),
      this.prisma.userSecurity.count({
        where: { mustChangePassword: true, user: activeWhere }
      }),
      this.prisma.user.count({
        where: { ...activeWhere, organizations: { some: { leftAt: null } } }
      }),
      this.prisma.user.count({
        where: { ...activeWhere, organizations: { none: { leftAt: null } } }
      }),
      this.prisma.user.count({
        where: { ...activeWhere, roles: { none: {} } }
      }),
      this.prisma.user.count({
        where: { ...activeWhere, createdAt: { gte: sevenDaysAgo } }
      }),
      this.prisma.user.count({
        where: { ...activeWhere, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
      }),
      this.prisma.user.count({
        where: { ...activeWhere, createdAt: { gte: thirtyDaysAgo } }
      }),
      this.prisma.user.count({
        where: { AND: [activeWhere, userLoggedInSince(sevenDaysAgo)] }
      }),
      this.prisma.user.count({
        where: { AND: [activeWhere, userLoggedInSince(thirtyDaysAgo)] }
      }),
      this.prisma.user.count({
        where: { AND: [activeWhere, userNeverLoggedIn()] }
      }),
      this.prisma.user.count({
        where: {
          ...activeWhere,
          status: 'ACTIVE',
          organizations: { some: { leftAt: null } }
        }
      }),
      this.prisma.user.count({
        where: {
          AND: [
            activeWhere,
            {
              status: 'ACTIVE',
              organizations: { some: { leftAt: null } },
              ...userHasLoggedIn()
            }
          ]
        }
      }),
      this.prisma.user.count({
        where: {
          AND: [
            activeWhere,
            {
              status: 'ACTIVE',
              organizations: { some: { leftAt: null } },
              ...userLoggedInSince(thirtyDaysAgo)
            }
          ]
        }
      }),
      this.prisma.user.findMany({
        where: { ...activeWhere, createdAt: { gte: calendarStart } },
        select: { createdAt: true }
      }),
      this.prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              users: { where: { leftAt: null } }
            }
          }
        },
        orderBy: {
          users: { _count: 'desc' }
        },
        take: 5
      })
    ])

    const byStatus = {
      active: 0,
      inactive: 0,
      pending: 0,
      suspended: 0
    }
    for (const g of statusGroups) {
      const key = g.status.toLowerCase() as keyof typeof byStatus
      if (key in byStatus) {
        byStatus[key] = g._count
      }
    }

    const byGender = {
      male: 0,
      female: 0,
      unknown: 0
    }
    for (const g of genderGroups) {
      const key = g.gender.toLowerCase() as keyof typeof byGender
      if (key in byGender) {
        byGender[key] = g._count
      }
    }

    const growthRate =
      previous7DaysCount > 0
        ? Number(((newUsersLast7Days - previous7DaysCount) / previous7DaysCount).toFixed(4))
        : newUsersLast7Days > 0
          ? 1
          : 0

    const { trend, creationCalendar, weeklyNewUsers } = buildCreationSeries(
      now,
      calendarUsers.map((user) => user.createdAt)
    )

    const topOrganizations = topOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      userCount: org._count.users
    }))

    return {
      total,
      deletedCount,
      byStatus,
      byGender,
      security: {
        lockedCount,
        mfaEnabledCount,
        mustChangePasswordCount
      },
      assignment: {
        assignedCount,
        unassignedCount,
        noRoleCount
      },
      activity: {
        activeUsersLast7Days,
        activeUsersLast30Days,
        neverLoggedInCount
      },
      recentTrends: {
        newUsersLast7Days,
        previous7DaysCount,
        growthRate,
        newUsersLast30Days
      },
      trend,
      topOrganizations,
      series: {
        rates: {
          activationRate: ratio(byStatus.active, total),
          mfaCoverageRate: ratio(mfaEnabledCount, total),
          organizationAssignmentRate: ratio(assignedCount, total),
          roleAssignmentRate: ratio(total - noRoleCount, total),
          activeRate7d: ratio(activeUsersLast7Days, total),
          activeRate30d: ratio(activeUsersLast30Days, total)
        },
        statusDistribution: withShare([
          { label: '已激活', value: byStatus.active },
          { label: '未激活', value: byStatus.inactive },
          { label: '待审核', value: byStatus.pending },
          { label: '已停用', value: byStatus.suspended }
        ]),
        genderDistribution: withShare([
          { label: '男', value: byGender.male },
          { label: '女', value: byGender.female },
          { label: '未知', value: byGender.unknown }
        ]),
        funnel: [
          { label: '在册用户', value: total },
          { label: '已激活', value: byStatus.active },
          { label: '已激活且已归属组织', value: activatedAndAssigned },
          { label: '其中曾登录', value: activatedAssignedLoggedIn },
          { label: '其中近 30 天活跃', value: activatedAssignedActive30 }
        ],
        health: [
          { label: '激活率', value: Math.round(ratio(byStatus.active, total) * 100) },
          { label: 'MFA 覆盖', value: Math.round(ratio(mfaEnabledCount, total) * 100) },
          { label: '组织归属', value: Math.round(ratio(assignedCount, total) * 100) },
          { label: '角色绑定', value: Math.round(ratio(total - noRoleCount, total) * 100) },
          { label: '近 30 天活跃', value: Math.round(ratio(activeUsersLast30Days, total) * 100) },
          { label: '未锁定', value: Math.round(ratio(total - lockedCount, total) * 100) }
        ],
        weeklyNewUsers,
        creationCalendar
      }
    }
  }
}

/** 最近登录时间落在 UserAudit，过滤必须走 audit 关系。 */
function userLoggedInSince(since: Date): Prisma.UserWhereInput {
  return { audit: { is: { lastLoginAt: { gte: since } } } }
}

function userHasLoggedIn(): Prisma.UserWhereInput {
  return { audit: { is: { lastLoginAt: { not: null } } } }
}

function userNeverLoggedIn(): Prisma.UserWhereInput {
  return {
    OR: [{ audit: { is: null } }, { audit: { is: { lastLoginAt: null } } }]
  }
}
