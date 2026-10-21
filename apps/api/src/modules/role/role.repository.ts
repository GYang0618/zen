import { Inject, Injectable } from '@nestjs/common'
import { ROLE_MEMBER_PREVIEW_LIMIT } from '@zen/shared'

import { ratio, withShare } from '../../common/stats/series.js'
import { PrismaService } from '../../infra/prisma/prisma.service.js'

import type { Prisma } from '@prisma/client'
import type { RoleStatisticsResponse } from './responses/role.response.js'

const TOP_ROLE_LIMIT = 5
const ROLE_COMPARISON_LIMIT = 8

const DATA_SCOPE_LABELS: Record<string, string> = {
  all: '全部数据',
  organization: '组织及下级',
  organization_only: '仅本组织',
  self: '仅本人',
  custom: '自定义范围'
}

export const ROLE_INCLUDE = {
  permissions: {
    include: { permission: true }
  },
  users: {
    take: ROLE_MEMBER_PREVIEW_LIMIT,
    orderBy: { createdAt: 'desc' as const },
    include: {
      user: {
        include: {
          profile: true
        }
      }
    }
  },
  _count: {
    select: { users: true }
  }
} satisfies Prisma.RoleInclude

export type RoleWithRelations = Prisma.RoleGetPayload<{ include: typeof ROLE_INCLUDE }>

@Injectable()
export class RoleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: ROLE_INCLUDE
    })
  }

  findByCode(code: string) {
    return this.prisma.role.findUnique({ where: { code } })
  }

  findManyByIds(ids: string[]) {
    return this.prisma.role.findMany({
      where: { id: { in: ids } },
      include: ROLE_INCLUDE
    })
  }

  count(where: Prisma.RoleWhereInput) {
    return this.prisma.role.count({ where })
  }

  findMany(
    where: Prisma.RoleWhereInput,
    skip: number | undefined,
    take: number | undefined,
    orderBy: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[]
  ) {
    return this.prisma.role.findMany({
      where,
      include: ROLE_INCLUDE,
      skip,
      take,
      orderBy
    })
  }

  create(data: Prisma.RoleCreateInput) {
    return this.prisma.role.create({
      data,
      include: ROLE_INCLUDE
    })
  }

  update(id: string, data: Prisma.RoleUpdateInput) {
    return this.prisma.role.update({
      where: { id },
      data,
      include: ROLE_INCLUDE
    })
  }

  deleteManyByIds(ids: string[]) {
    return this.prisma.role.deleteMany({
      where: { id: { in: ids } }
    })
  }

  replacePermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...(permissionIds.length > 0
        ? [
            this.prisma.rolePermission.createMany({
              data: permissionIds.map((permissionId) => ({ roleId, permissionId }))
            })
          ]
        : [])
    ])
  }

  findPermissionsByCodes(codes: string[]) {
    return this.prisma.permission.findMany({
      where: { code: { in: codes } }
    })
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ module: 'asc' }, { code: 'asc' }]
    })
  }

  async findUserIdsByRoleId(roleId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true }
    })
    return rows.map((row) => row.userId)
  }

  countMembers(roleId: string) {
    return this.prisma.userRole.count({ where: { roleId } })
  }

  findMembers(roleId: string, skip?: number, take?: number) {
    return this.prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: {
          include: {
            profile: true,
            organizations: {
              where: { isPrimary: true, leftAt: null },
              include: { organization: true },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    })
  }

  addMembers(roleId: string, userIds: string[]) {
    return this.prisma.userRole.createMany({
      data: userIds.map((userId) => ({ userId, roleId })),
      skipDuplicates: true
    })
  }

  removeMember(roleId: string, userId: string) {
    return this.prisma.userRole.deleteMany({
      where: { roleId, userId }
    })
  }

  findActiveUsersByIds(ids: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true }
    })
  }

  findUsersDisplayByIds(ids: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        username: true,
        nickname: true,
        profile: { select: { realName: true } }
      }
    })
  }

  countActiveSuperAdminsExcluding(userId: string) {
    return this.prisma.userRole.count({
      where: {
        role: { code: 'super_admin' },
        userId: { not: userId },
        user: { deletedAt: null, status: 'ACTIVE' }
      }
    })
  }

  findUserRoleCodes(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { code: true } } }
    })
  }

  countOrganizationsByIds(ids: string[]) {
    return this.prisma.organization.count({
      where: { id: { in: ids } }
    })
  }

  countRolesReferencingOrg(orgId: string) {
    return this.prisma.role.count({
      where: {
        dataScope: 'CUSTOM',
        customOrgIds: { has: orgId }
      }
    })
  }

  async getStatistics(): Promise<RoleStatisticsResponse> {
    const now = new Date()
    const [
      total,
      kindGroups,
      statusGroups,
      expired,
      dataScopeGroups,
      assignedUserTotal,
      emptyRoleCount,
      disabledNotExpired,
      topRoleRecords,
      topRolePermissionRecords,
      totalRolePermissions
    ] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.role.groupBy({ by: ['kind'], _count: true }),
      this.prisma.role.groupBy({ by: ['status'], _count: true }),
      this.prisma.role.count({
        where: {
          expiresAt: { lte: now }
        }
      }),
      this.prisma.role.groupBy({ by: ['dataScope'], _count: true }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          roles: { some: {} }
        }
      }),
      this.prisma.role.count({
        where: {
          users: { none: {} }
        }
      }),
      this.prisma.role.count({
        where: {
          status: 'DISABLED',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
        }
      }),
      this.prisma.role.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: { users: true, permissions: true }
          }
        },
        orderBy: {
          users: { _count: 'desc' }
        },
        take: ROLE_COMPARISON_LIMIT
      }),
      this.prisma.role.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: { permissions: true }
          }
        },
        orderBy: {
          permissions: { _count: 'desc' }
        },
        take: TOP_ROLE_LIMIT
      }),
      this.prisma.rolePermission.count()
    ])

    const byKind = {
      system: 0,
      custom: 0
    }
    for (const g of kindGroups) {
      const key = g.kind.toLowerCase() as keyof typeof byKind
      if (key in byKind) {
        byKind[key] = g._count
      }
    }

    const byStatus = {
      active: 0,
      disabled: 0,
      expired
    }
    for (const g of statusGroups) {
      const key = g.status.toLowerCase() as 'active' | 'disabled'
      if (key in byStatus) {
        byStatus[key] = g._count
      }
    }

    const byDataScope = {
      all: 0,
      organization: 0,
      organization_only: 0,
      self: 0,
      custom: 0
    }
    for (const g of dataScopeGroups) {
      const key = g.dataScope.toLowerCase() as keyof typeof byDataScope
      if (key in byDataScope) {
        byDataScope[key] = g._count
      }
    }

    const topRoles = topRoleRecords.slice(0, TOP_ROLE_LIMIT).map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      userCount: role._count.users
    }))
    const roleComparison = topRoleRecords.map((role) => ({
      label: role.name,
      userCount: role._count.users,
      permissionCount: role._count.permissions
    }))

    const topRolesByPermissions = topRolePermissionRecords.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      permissionCount: r._count.permissions
    }))

    const averagePermissionsPerRole =
      total > 0 ? Number((totalRolePermissions / total).toFixed(1)) : 0
    const activeNotExpired = Math.max(0, total - expired - disabledNotExpired)
    const topPermissionSum = topRolesByPermissions.reduce(
      (sum, role) => sum + role.permissionCount,
      0
    )
    const dataScopeDistribution = withShare(
      Object.entries(byDataScope)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          label: DATA_SCOPE_LABELS[key] ?? key,
          value
        }))
    )

    return {
      total,
      byKind,
      byStatus,
      byDataScope,
      binding: {
        assignedUserTotal,
        emptyRoleCount,
        averagePermissionsPerRole,
        topRoles,
        topRolesByPermissions
      },
      series: {
        rates: {
          utilizationRate: ratio(total - emptyRoleCount, total),
          permissionConcentrationRate: ratio(topPermissionSum, totalRolePermissions)
        },
        kindDistribution: withShare([
          { label: '系统角色', value: byKind.system },
          { label: '自定义角色', value: byKind.custom }
        ]),
        statusDistribution: withShare([
          { label: '启用', value: activeNotExpired },
          { label: '禁用', value: disabledNotExpired },
          { label: '已过期', value: expired }
        ]),
        dataScopeDistribution,
        roleComparison
      }
    }
  }
}
