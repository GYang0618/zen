import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/prisma.service.js'

import type { Prisma } from '@prisma/client'
import type { OrganizationStatisticsResponse } from './responses/organization.response.js'

export const ORGANIZATION_INCLUDE = {
  leader: {
    select: {
      id: true,
      username: true,
      nickname: true,
      email: true,
      phoneNumber: true,
      profile: { select: { realName: true, avatar: true, jobTitle: true } }
    }
  },
  _count: {
    select: {
      users: { where: { leftAt: null } },
      posts: true
    }
  }
} satisfies Prisma.OrganizationInclude

export type OrganizationWithRelations = Prisma.OrganizationGetPayload<{
  include: typeof ORGANIZATION_INCLUDE
}>

export type DissolveResult = {
  deletedDescendants: Array<{ id: string; code: string; name: string; parentId: string | null }>
  affectedUserIds: string[]
  directChildren: Array<{ id: string; code: string; name: string }>
}

export type MergeResult = {
  directChildren: Array<{ id: string; code: string; name: string }>
  transferredUserIds: string[]
}

@Injectable()
export class OrganizationRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: ORGANIZATION_INCLUDE
    })
  }

  findByIdInScope(id: string, scope: Prisma.OrganizationWhereInput) {
    return this.prisma.organization.findFirst({
      where: { AND: [{ id }, scope] },
      include: ORGANIZATION_INCLUDE
    })
  }

  findByCode(code: string) {
    return this.prisma.organization.findUnique({ where: { code } })
  }

  findMany(where: Prisma.OrganizationWhereInput = {}) {
    return this.prisma.organization.findMany({
      where,
      include: ORGANIZATION_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }]
    })
  }

  findPaged(where: Prisma.OrganizationWhereInput, pagination: { skip: number; take: number }) {
    return this.prisma.organization.findMany({
      where,
      include: ORGANIZATION_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.take
    })
  }

  count(where: Prisma.OrganizationWhereInput = {}) {
    return this.prisma.organization.count({ where })
  }

  findDescendantsByPathPrefix(pathPrefix: string) {
    return this.prisma.organization.findMany({
      where: { path: { startsWith: pathPrefix } },
      select: { id: true, path: true, level: true }
    })
  }

  countDescendantsByPathPrefix(pathPrefix: string, scope: Prisma.OrganizationWhereInput = {}) {
    return this.prisma.organization.count({
      where: { AND: [{ path: { startsWith: pathPrefix } }, scope] }
    })
  }

  findChildrenTypes(parentId: string) {
    return this.prisma.organization.findMany({
      where: { parentId },
      select: { id: true, type: true }
    })
  }

  create(data: Prisma.OrganizationCreateInput) {
    return this.prisma.organization.create({
      data,
      include: ORGANIZATION_INCLUDE
    })
  }

  update(id: string, data: Prisma.OrganizationUpdateInput) {
    return this.prisma.organization.update({
      where: { id },
      data,
      include: ORGANIZATION_INCLUDE
    })
  }

  delete(id: string) {
    return this.prisma.organization.delete({ where: { id } })
  }

  updateManyPaths(
    updates: Array<{ id: string; path: string; level: number; parentId?: string | null }>
  ) {
    return this.prisma.$transaction(
      updates.map((item) =>
        this.prisma.organization.update({
          where: { id: item.id },
          data: {
            path: item.path,
            level: item.level,
            ...(item.parentId !== undefined ? { parentId: item.parentId } : {})
          }
        })
      )
    )
  }

  findActiveUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: 'ACTIVE' },
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

  findOrganizationsDisplayByIds(ids: string[]) {
    return this.prisma.organization.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, code: true }
    })
  }

  listMembers(organizationId: string) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId, leftAt: null },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            phoneNumber: true,
            status: true,
            profile: { select: { avatar: true } }
          }
        },
        post: {
          select: {
            id: true,
            level: true,
            jobProfile: { select: { name: true, level: true } }
          }
        },
        organization: { select: { name: true } }
      },
      orderBy: [{ user: { username: 'asc' } }, { userId: 'asc' }]
    })
  }

  addMember(organizationId: string, userId: string) {
    return this.prisma.userOrganization.upsert({
      where: {
        userId_organizationId: { userId, organizationId }
      },
      create: {
        userId,
        organizationId,
        isPrimary: false,
        joinedAt: new Date(),
        leftAt: null
      },
      update: {
        leftAt: null,
        joinedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            email: true,
            phoneNumber: true,
            status: true,
            profile: { select: { avatar: true } }
          }
        },
        post: {
          select: {
            id: true,
            level: true,
            jobProfile: { select: { name: true, level: true } }
          }
        },
        organization: { select: { name: true } }
      }
    })
  }

  async removeMember(organizationId: string, userId: string) {
    return this.prisma.userOrganization.updateMany({
      where: { organizationId, userId, leftAt: null },
      data: { leftAt: new Date(), isPrimary: false }
    })
  }

  listPositions(organizationId: string) {
    return this.prisma.post.findMany({
      where: { organizationId },
      orderBy: [{ jobProfile: { name: 'asc' } }, { id: 'asc' }],
      include: {
        jobProfile: true,
        _count: { select: { users: { where: { leftAt: null } } } }
      }
    })
  }

  findOrganizationPositionByProfile(organizationId: string, jobProfileId: string) {
    return this.prisma.post.findUnique({
      where: {
        organizationId_jobProfileId: { organizationId, jobProfileId }
      }
    })
  }

  createPosition(data: Prisma.PostCreateInput) {
    return this.prisma.post.create({
      data,
      include: {
        jobProfile: true,
        _count: { select: { users: { where: { leftAt: null } } } }
      }
    })
  }

  countActivities(tenantId: string, organizationId: string) {
    return this.prisma.auditLog.count({
      where: { tenantId, resource: 'organization', resourceId: organizationId }
    })
  }

  listActivities(
    tenantId: string,
    organizationId: string,
    pagination: { skip: number; take: number }
  ) {
    return this.prisma.auditLog.findMany({
      where: { tenantId, resource: 'organization', resourceId: organizationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...pagination
    })
  }

  findActivityActors(ids: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        username: true,
        nickname: true,
        profile: { select: { realName: true, avatar: true } }
      }
    })
  }

  findDistinctTypes() {
    return this.prisma.organization.findMany({
      distinct: ['type'],
      select: { type: true }
    })
  }

  async getTenantSettings(tenantId: string): Promise<Record<string, unknown>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })
    if (
      !tenant?.settings ||
      typeof tenant.settings !== 'object' ||
      Array.isArray(tenant.settings)
    ) {
      return {}
    }
    return tenant.settings as Record<string, unknown>
  }

  updateTenantSettings(tenantId: string, settings: Record<string, unknown>) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: settings as Prisma.InputJsonValue }
    })
  }

  async dissolve(
    id: string,
    targetOrgId: string | null | undefined,
    transferChildren: boolean,
    targetChildrenOrgId?: string | null
  ): Promise<DissolveResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { id },
        include: { children: true }
      })
      if (!org) return null

      const directChildren = org.children.map((c) => ({ id: c.id, code: c.code, name: c.name }))

      // 1. 连同子部门一起彻底删除
      if (!transferChildren) {
        const currentPath = org.path ?? `/${org.id}/`
        const matchedDescendants = await tx.organization.findMany({
          where: {
            path: { startsWith: currentPath },
            id: { not: org.id }
          },
          select: { id: true, code: true, name: true, parentId: true }
        })
        const allOrgIds = [org.id, ...matchedDescendants.map((d) => d.id)]

        const affectedMembers = await tx.userOrganization.findMany({
          where: { organizationId: { in: allOrgIds }, leftAt: null },
          select: { userId: true }
        })
        const affectedUserIds = Array.from(new Set(affectedMembers.map((m) => m.userId)))

        // 批量转移或清理全部受波及的组织成员
        if (targetOrgId) {
          await tx.userOrganization.updateMany({
            where: { organizationId: { in: allOrgIds } },
            data: {
              organizationId: targetOrgId,
              postId: null
            }
          })
        } else {
          await tx.userOrganization.deleteMany({
            where: { organizationId: { in: allOrgIds } }
          })
        }

        // 清理所有相关编制
        await tx.post.deleteMany({ where: { organizationId: { in: allOrgIds } } })

        // 清理解散组织关联的便签和文件资产引用，防止外键约束
        await tx.demoNote.deleteMany({ where: { organizationId: { in: allOrgIds } } })
        await tx.fileAsset.updateMany({
          where: { organizationId: { in: allOrgIds } },
          data: { organizationId: null }
        })

        // 先解开这批待删除组织的所有自引用关系，杜绝层级约束死锁
        await tx.organization.updateMany({
          where: { id: { in: allOrgIds } },
          data: { parentId: null }
        })

        // 原子批量删除所有目标组织
        await tx.organization.deleteMany({
          where: { id: { in: allOrgIds } }
        })

        return {
          deletedDescendants: matchedDescendants,
          affectedUserIds,
          directChildren
        }
      }

      // 2. 保留子部门：合并到指定目标组织或自动提升一级
      if (org.children.length > 0) {
        const targetParentId = targetChildrenOrgId ?? org.parentId
        const targetParent = targetParentId
          ? await tx.organization.findUnique({ where: { id: targetParentId } })
          : null

        for (const child of org.children) {
          const oldPrefix = child.path ?? `/${child.id}/`
          const newPath = `${targetParent?.path || '/'}${child.id}/`
          const levelDelta = (targetParent?.level ?? 0) + 1 - child.level
          const descendants = await tx.organization.findMany({
            where: { path: { startsWith: oldPrefix } },
            select: { id: true, path: true, level: true }
          })
          for (const desc of descendants) {
            await tx.organization.update({
              where: { id: desc.id },
              data: {
                path: `${newPath}${desc.path?.slice(oldPrefix.length) ?? ''}`,
                level: desc.level + levelDelta,
                ...(desc.id === child.id ? { parentId: targetParentId ?? null } : {})
              }
            })
          }
        }
      }

      // 3. 成员处理：仅当前组织
      const currentMembers = await tx.userOrganization.findMany({
        where: { organizationId: id, leftAt: null },
        select: { userId: true }
      })
      const affectedUserIds = currentMembers.map((m) => m.userId)

      if (targetOrgId) {
        await tx.userOrganization.updateMany({
          where: { organizationId: id },
          data: {
            organizationId: targetOrgId,
            postId: null
          }
        })
      } else {
        await tx.userOrganization.deleteMany({
          where: { organizationId: id }
        })
      }

      // 4. 清理当前组织岗位编制
      await tx.post.deleteMany({ where: { organizationId: id } })

      // 5. 删除当前组织
      await tx.organization.delete({ where: { id } })

      return {
        deletedDescendants: [],
        affectedUserIds,
        directChildren
      }
    })
  }

  async merge(sourceId: string, targetId: string): Promise<MergeResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.organization.findUnique({
        where: { id: sourceId },
        include: { children: true }
      })
      const target = await tx.organization.findUnique({ where: { id: targetId } })
      if (!source || !target) return null

      const directChildren = source.children.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name
      }))

      for (const child of source.children) {
        const oldPrefix = child.path ?? `/${child.id}/`
        const newPath = `${target.path || '/'}${child.id}/`
        const levelDelta = target.level + 1 - child.level
        const descendants = await tx.organization.findMany({
          where: { path: { startsWith: oldPrefix } },
          select: { id: true, path: true, level: true }
        })
        for (const desc of descendants) {
          await tx.organization.update({
            where: { id: desc.id },
            data: {
              path: `${newPath}${desc.path?.slice(oldPrefix.length) ?? ''}`,
              level: desc.level + levelDelta,
              ...(desc.id === child.id ? { parentId: targetId } : {})
            }
          })
        }
      }

      const currentMembers = await tx.userOrganization.findMany({
        where: { organizationId: sourceId, leftAt: null },
        select: { userId: true }
      })
      const transferredUserIds = currentMembers.map((m) => m.userId)

      await tx.userOrganization.updateMany({
        where: { organizationId: sourceId },
        data: {
          organizationId: targetId,
          postId: null
        }
      })

      await tx.post.deleteMany({ where: { organizationId: sourceId } })
      await tx.organization.delete({ where: { id: sourceId } })

      return {
        directChildren,
        transferredUserIds
      }
    })
  }

  async batchTransferMembers(userIds: string[], targetOrgId: string, targetPostId?: string | null) {
    return this.prisma.$transaction(
      userIds.map((userId) =>
        this.prisma.userOrganization.upsert({
          where: {
            userId_organizationId: {
              userId,
              organizationId: targetOrgId
            }
          },
          update: {
            postId: targetPostId ?? null,
            leftAt: null
          },
          create: {
            userId,
            organizationId: targetOrgId,
            postId: targetPostId ?? null,
            isPrimary: true
          }
        })
      )
    )
  }

  async getStatistics(
    where?: Prisma.OrganizationWhereInput,
    rootId?: string
  ): Promise<OrganizationStatisticsResponse> {
    let scopeWhere: Prisma.OrganizationWhereInput = where ?? {}
    if (rootId) {
      const rootOrg = await this.prisma.organization.findUnique({
        where: { id: rootId },
        select: { id: true, path: true }
      })
      if (rootOrg) {
        const rootPath = rootOrg.path ? `${rootOrg.path}/` : undefined
        scopeWhere = {
          AND: [
            scopeWhere,
            {
              OR: [
                { id: rootId },
                ...(rootPath ? [{ path: { startsWith: rootPath } }] : [{ parentId: rootId }])
              ]
            }
          ]
        }
      }
    }

    const [
      total,
      typeGroups,
      rootCount,
      maxLevelAggregate,
      hasLeaderCount,
      noLeaderCount,
      totalMemberships,
      emptyOrgCount,
      topOrgs
    ] = await Promise.all([
      this.prisma.organization.count({ where: scopeWhere }),
      this.prisma.organization.groupBy({ by: ['type'], where: scopeWhere, _count: true }),
      this.prisma.organization.count({ where: { ...scopeWhere, parentId: null } }),
      this.prisma.organization.aggregate({ where: scopeWhere, _max: { level: true } }),
      this.prisma.organization.count({ where: { ...scopeWhere, leaderId: { not: null } } }),
      this.prisma.organization.count({ where: { ...scopeWhere, leaderId: null } }),
      this.prisma.userOrganization.count({
        where: { leftAt: null, organization: scopeWhere }
      }),
      this.prisma.organization.count({
        where: { ...scopeWhere, users: { none: { leftAt: null } } }
      }),
      this.prisma.organization.findMany({
        where: scopeWhere,
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
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

    const byType: Record<string, number> = {}
    for (const g of typeGroups) {
      byType[g.type.toLowerCase()] = g._count
    }

    const topOrgsByMembers = topOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      code: org.code,
      type: org.type.toLowerCase() as OrganizationStatisticsResponse['members']['topOrgsByMembers'][number]['type'],
      memberCount: org._count.users
    }))

    return {
      total,
      byType,
      structure: {
        rootCount,
        maxDepth: maxLevelAggregate._max.level ?? 1,
        hasLeaderCount,
        noLeaderCount
      },
      members: {
        totalMemberships,
        emptyOrgCount,
        topOrgsByMembers
      }
    }
  }
}
