import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

import type { Prisma } from '@prisma/client'

export const USER_INCLUDE = {
  profile: true,
  security: true,
  preference: true,
  audit: true,
  departments: {
    include: { department: true }
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

  findUniqueWithDomain(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where, include: USER_INCLUDE })
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

  count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where })
  }

  findManyWithDomain(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
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
}
