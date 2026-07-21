import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

import type { Prisma } from '@prisma/client'

export const ROLE_INCLUDE = {
  permissions: {
    include: { permission: true }
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
    orderBy: Prisma.RoleOrderByWithRelationInput
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
      orderBy: [{ module: 'asc' }, { code: 'asc' }]
    })
  }
}
