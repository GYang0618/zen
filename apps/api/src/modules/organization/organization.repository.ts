import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

import type { Prisma } from '@prisma/client'

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
      orderBy: [{ name: 'asc' }, { id: 'asc' }]
    })
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
}
