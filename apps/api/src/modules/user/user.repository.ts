import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

import type { Prisma, UserStatusCode } from '@prisma/client'

export const USER_INCLUDE = {
  profile: true,
  security: true,
  preference: true,
  audit: true,
  organizations: {
    where: { leftAt: null },
    include: { organization: true, post: true }
  },
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } }
        }
      }
    }
  }
} satisfies Prisma.UserInclude

export type UserWithDomain = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>

@Injectable()
export class UserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findUnique(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where })
  }

  findActiveWithDomainById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: USER_INCLUDE })
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

  upsertUserRole(userId: string, roleId: string) {
    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {}
    })
  }

  findRolesByIds(ids: string[]) {
    return this.prisma.role.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' }
    })
  }

  replaceUserRoles(userId: string, roleIds: string[]) {
    return this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      ...(roleIds.length > 0
        ? [
            this.prisma.userRole.createMany({
              data: roleIds.map((roleId) => ({ userId, roleId }))
            })
          ]
        : [])
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
}
