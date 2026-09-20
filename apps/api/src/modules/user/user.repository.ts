import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/prisma.service.js'

import type { Prisma, UserStatusCode } from '@prisma/client'

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

  replaceUserRoles(
    userId: string,
    roles: Array<{ roleId: string; isPrimary: boolean }>
  ) {
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
}
