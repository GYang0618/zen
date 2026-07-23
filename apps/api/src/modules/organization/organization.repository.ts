import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

import type { Prisma } from '@prisma/client'

export const ORGANIZATION_INCLUDE = {
  leader: {
    select: { id: true, username: true, nickname: true }
  },
  _count: {
    select: { users: true, children: true }
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

  findByCode(code: string) {
    return this.prisma.organization.findUnique({ where: { code } })
  }

  findManyByIds(ids: string[]) {
    return this.prisma.organization.findMany({
      where: { id: { in: ids } },
      include: ORGANIZATION_INCLUDE
    })
  }

  findAll() {
    return this.prisma.organization.findMany({
      include: ORGANIZATION_INCLUDE,
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }]
    })
  }

  findMany(where: Prisma.OrganizationWhereInput = {}) {
    return this.prisma.organization.findMany({
      where,
      include: ORGANIZATION_INCLUDE,
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }]
    })
  }

  findDescendantsByPathPrefix(pathPrefix: string) {
    return this.prisma.organization.findMany({
      where: { path: { startsWith: pathPrefix } },
      select: { id: true, path: true, level: true }
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

  deleteManyByIds(ids: string[]) {
    return this.prisma.organization.deleteMany({
      where: { id: { in: ids } }
    })
  }

  findActiveUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true }
    })
  }

  listMembers(organizationId: string) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId, leftAt: null },
      include: {
        user: { select: { id: true, username: true, nickname: true, email: true } },
        post: { select: { id: true, code: true, name: true } }
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
    })
  }

  async upsertMember(input: {
    organizationId: string
    userId: string
    isPrimary: boolean
    postId?: string | null
  }) {
    if (input.isPrimary) {
      await this.prisma.userOrganization.updateMany({
        where: { userId: input.userId, leftAt: null, isPrimary: true },
        data: { isPrimary: false }
      })
    }

    return this.prisma.userOrganization.upsert({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId
        }
      },
      create: {
        userId: input.userId,
        organizationId: input.organizationId,
        isPrimary: input.isPrimary,
        postId: input.postId ?? null,
        joinedAt: new Date(),
        leftAt: null
      },
      update: {
        isPrimary: input.isPrimary,
        postId: input.postId ?? null,
        leftAt: null,
        joinedAt: new Date()
      },
      include: {
        user: { select: { id: true, username: true, nickname: true, email: true } },
        post: { select: { id: true, code: true, name: true } }
      }
    })
  }

  async removeMember(organizationId: string, userId: string) {
    return this.prisma.userOrganization.updateMany({
      where: { organizationId, userId, leftAt: null },
      data: { leftAt: new Date(), isPrimary: false }
    })
  }

  listPosts(organizationId?: string) {
    return this.prisma.post.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }]
    })
  }

  findPostByCode(code: string) {
    return this.prisma.post.findUnique({ where: { code } })
  }

  findPostById(id: string) {
    return this.prisma.post.findUnique({ where: { id } })
  }

  createPost(data: Prisma.PostCreateInput) {
    return this.prisma.post.create({ data })
  }

  updatePost(id: string, data: Prisma.PostUpdateInput) {
    return this.prisma.post.update({ where: { id }, data })
  }

  deletePost(id: string) {
    return this.prisma.post.delete({ where: { id } })
  }
}
