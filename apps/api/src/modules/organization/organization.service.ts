import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'

import { applyOrganizationTreeDataScope } from '@/common/auth/apply-data-scope'
import { AuditService } from '@/common/auth/audit.service'
import { AuthContextService } from '@/common/auth/auth-context.service'
import { SessionService } from '@/common/auth/session.service'

import {
  fromApiOrganizationStatus,
  fromApiOrganizationType,
  toOrganizationResponse
} from './organization.mapper'
import { OrganizationRepository } from './organization.repository'

import type { Prisma } from '@prisma/client'
import type { AuthContext, OrganizationTreeNode } from '@zen/shared'
import type {
  CreateOrganizationDto,
  DeleteOrganizationsDto,
  MoveOrganizationDto,
  UpdateOrganizationDto
} from './dto'
import type {
  OrganizationResponse,
  OrganizationTreeResponse
} from './responses/organization.response'

function buildPath(parentPath: string | null | undefined, id: string): string {
  const prefix = parentPath && parentPath.length > 0 ? parentPath : '/'
  return `${prefix}${id}/`
}

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(OrganizationRepository) private readonly orgRepo: OrganizationRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService,
    @Inject(SessionService) private readonly sessionService: SessionService
  ) {}

  async getTree(auth?: AuthContext): Promise<OrganizationTreeResponse> {
    const scopeWhere = auth
      ? (applyOrganizationTreeDataScope(auth) as Prisma.OrganizationWhereInput)
      : {}
    const rows = await this.orgRepo.findMany(scopeWhere)
    const nodes = new Map<string, OrganizationTreeNode>()

    for (const row of rows) {
      nodes.set(row.id, { ...toOrganizationResponse(row), children: [] })
    }

    const roots: OrganizationTreeNode[] = []
    for (const row of rows) {
      const node = nodes.get(row.id)
      if (!node) continue
      if (row.parentId && nodes.has(row.parentId)) {
        nodes.get(row.parentId)?.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }

  async findOne(id: string): Promise<OrganizationResponse> {
    const org = await this.orgRepo.findById(id)
    if (!org) throw new NotFoundException('组织不存在')
    return toOrganizationResponse(org)
  }

  async create(data: CreateOrganizationDto): Promise<OrganizationResponse> {
    const existing = await this.orgRepo.findByCode(data.code)
    if (existing) throw new ConflictException('组织编码已存在')

    let parentPath: string | null = null
    let level = 1
    if (data.parentId) {
      const parent = await this.orgRepo.findById(data.parentId)
      if (!parent) throw new NotFoundException('父组织不存在')
      parentPath = parent.path
      level = parent.level + 1
    }

    const created = await this.orgRepo.create({
      code: data.code,
      name: data.name,
      type: fromApiOrganizationType(data.type ?? 'department'),
      description: data.description,
      sort: data.sort,
      level,
      parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      leader: data.leaderId ? { connect: { id: data.leaderId } } : undefined
    })

    const path = buildPath(parentPath, created.id)
    const updated = await this.orgRepo.update(created.id, { path })

    await this.auditService.write({
      action: 'system.org.created',
      resource: 'organization',
      resourceId: updated.id,
      diff: { code: updated.code, name: updated.name }
    })

    return toOrganizationResponse(updated)
  }

  async update(id: string, data: UpdateOrganizationDto): Promise<OrganizationResponse> {
    const existing = await this.orgRepo.findById(id)
    if (!existing) throw new NotFoundException('组织不存在')

    if (data.parentId !== undefined && data.parentId !== existing.parentId) {
      throw new BadRequestException('请使用移动接口变更父组织')
    }

    const updated = await this.orgRepo.update(id, {
      name: data.name,
      description: data.description,
      sort: data.sort,
      type: data.type ? fromApiOrganizationType(data.type) : undefined,
      status: data.status ? fromApiOrganizationStatus(data.status) : undefined,
      leader:
        data.leaderId === undefined
          ? undefined
          : data.leaderId === null
            ? { disconnect: true }
            : { connect: { id: data.leaderId } }
    })

    await this.auditService.write({
      action: 'system.org.updated',
      resource: 'organization',
      resourceId: id,
      diff: data
    })

    return toOrganizationResponse(updated)
  }

  async move(id: string, payload: MoveOrganizationDto): Promise<OrganizationResponse> {
    const existing = await this.orgRepo.findById(id)
    if (!existing) throw new NotFoundException('组织不存在')
    if (!existing.path) throw new BadRequestException('组织路径未初始化，无法移动')

    if (payload.parentId === id) {
      throw new BadRequestException('不能将组织移动到自身之下')
    }

    let parentPath: string | null = null
    let parentLevel = 0
    if (payload.parentId) {
      const parent = await this.orgRepo.findById(payload.parentId)
      if (!parent) throw new NotFoundException('目标父组织不存在')
      if (parent.path?.startsWith(existing.path)) {
        throw new BadRequestException('不能将组织移动到其子节点之下')
      }
      parentPath = parent.path
      parentLevel = parent.level
    }

    const oldPrefix = existing.path
    const newPath = buildPath(parentPath, id)
    const levelDelta = parentLevel + 1 - existing.level

    const descendants = await this.orgRepo.findDescendantsByPathPrefix(oldPrefix)
    const updates = descendants.map((item) => {
      const suffix = item.path?.slice(oldPrefix.length) ?? ''
      return {
        id: item.id,
        path: `${newPath}${suffix}`,
        level: item.level + levelDelta,
        ...(item.id === id ? { parentId: payload.parentId } : {})
      }
    })

    await this.orgRepo.updateManyPaths(updates)

    const moved = await this.orgRepo.findById(id)
    if (!moved) throw new NotFoundException('组织不存在')

    await this.auditService.write({
      action: 'system.org.moved',
      resource: 'organization',
      resourceId: id,
      diff: { parentId: payload.parentId, path: moved.path }
    })

    return toOrganizationResponse(moved)
  }

  async remove(payload: DeleteOrganizationsDto): Promise<OrganizationResponse[]> {
    const ids = [...new Set(payload.ids)]
    const orgs = await this.orgRepo.findManyByIds(ids)
    if (orgs.length !== ids.length) {
      throw new NotFoundException('部分组织不存在')
    }

    const withChildren = orgs.filter((org) => org._count.children > 0)
    if (withChildren.length > 0) {
      throw new BadRequestException('存在子组织的节点不可删除，请先删除或移动子节点')
    }

    const withMembers = orgs.filter((org) => org._count.users > 0)
    if (withMembers.length > 0) {
      throw new BadRequestException('存在成员的组织不可删除，请先移除成员')
    }

    await this.orgRepo.deleteManyByIds(ids)
    await this.auditService.write({
      action: 'system.org.deleted',
      resource: 'organization',
      diff: { ids }
    })

    return orgs.map(toOrganizationResponse)
  }

  async listMembers(organizationId: string) {
    const org = await this.orgRepo.findById(organizationId)
    if (!org) throw new NotFoundException('组织不存在')
    const rows = await this.orgRepo.listMembers(organizationId)
    return rows.map((row) => ({
      userId: row.userId,
      username: row.user.username,
      nickname: row.user.nickname,
      email: row.user.email,
      isPrimary: row.isPrimary,
      postId: row.postId,
      postName: row.post?.name ?? null,
      joinedAt: row.joinedAt?.toISOString() ?? null
    }))
  }

  async upsertMember(
    organizationId: string,
    payload: { userId: string; isPrimary?: boolean; postId?: string | null }
  ) {
    const org = await this.orgRepo.findById(organizationId)
    if (!org) throw new NotFoundException('组织不存在')

    const user = await this.orgRepo.findActiveUserById(payload.userId)
    if (!user) throw new NotFoundException('用户不存在')

    if (payload.postId) {
      const post = await this.orgRepo.findPostById(payload.postId)
      if (!post || post.organizationId !== organizationId) {
        throw new BadRequestException('岗位不属于该组织')
      }
    }

    const row = await this.orgRepo.upsertMember({
      organizationId,
      userId: payload.userId,
      isPrimary: payload.isPrimary ?? false,
      postId: payload.postId
    })

    await this.auditService.write({
      action: 'system.org.member_upserted',
      resource: 'organization',
      resourceId: organizationId,
      diff: payload
    })
    await this.authContextService.bumpPermVer()
    await this.sessionService.revokeAllForUser(payload.userId)

    return {
      userId: row.userId,
      username: row.user.username,
      nickname: row.user.nickname,
      email: row.user.email,
      isPrimary: row.isPrimary,
      postId: row.postId,
      postName: row.post?.name ?? null,
      joinedAt: row.joinedAt?.toISOString() ?? null
    }
  }

  async removeMember(organizationId: string, userId: string) {
    const result = await this.orgRepo.removeMember(organizationId, userId)
    if (result.count === 0) throw new NotFoundException('成员不存在')
    await this.auditService.write({
      action: 'system.org.member_removed',
      resource: 'organization',
      resourceId: organizationId,
      diff: { userId }
    })
    await this.authContextService.bumpPermVer()
    await this.sessionService.revokeAllForUser(userId)
  }

  async listPosts(organizationId?: string) {
    const rows = await this.orgRepo.listPosts(organizationId)
    return rows.map((row) => this.toPostResponse(row))
  }

  async createPost(payload: {
    code: string
    name: string
    organizationId: string
    description?: string
    grade?: string
    headcount?: number
    sort?: number
  }) {
    const org = await this.orgRepo.findById(payload.organizationId)
    if (!org) throw new NotFoundException('组织不存在')
    const existing = await this.orgRepo.findPostByCode(payload.code)
    if (existing) throw new ConflictException('岗位编码已存在')

    const created = await this.orgRepo.createPost({
      code: payload.code,
      name: payload.name,
      description: payload.description,
      grade: payload.grade,
      headcount: payload.headcount ?? 1,
      sort: payload.sort,
      organization: { connect: { id: payload.organizationId } }
    })

    await this.auditService.write({
      action: 'system.post.created',
      resource: 'post',
      resourceId: created.id,
      diff: payload
    })

    return this.toPostResponse(created)
  }

  async updatePost(
    id: string,
    payload: {
      name?: string
      description?: string
      grade?: string
      headcount?: number
      sort?: number
      status?: 'active' | 'disabled'
    }
  ) {
    const existing = await this.orgRepo.findPostById(id)
    if (!existing) throw new NotFoundException('岗位不存在')

    const updated = await this.orgRepo.updatePost(id, {
      name: payload.name,
      description: payload.description,
      grade: payload.grade,
      headcount: payload.headcount,
      sort: payload.sort,
      status:
        payload.status === undefined
          ? undefined
          : payload.status === 'active'
            ? 'ACTIVE'
            : 'DISABLED'
    })

    await this.auditService.write({
      action: 'system.post.updated',
      resource: 'post',
      resourceId: id,
      diff: payload
    })

    return this.toPostResponse(updated)
  }

  private toPostResponse(row: {
    id: string
    code: string
    name: string
    organizationId: string
    description: string | null
    grade: string | null
    headcount: number
    status: 'ACTIVE' | 'DISABLED'
    sort: number | null
    createdAt: Date
    updatedAt: Date
    _count?: { users: number }
  }) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      organizationId: row.organizationId,
      description: row.description,
      grade: row.grade,
      headcount: row.headcount,
      filledCount: row._count?.users ?? 0,
      status: row.status === 'ACTIVE' ? ('active' as const) : ('disabled' as const),
      sort: row.sort ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  async deletePost(id: string) {
    const existing = await this.orgRepo.findPostById(id)
    if (!existing) throw new NotFoundException('岗位不存在')
    await this.orgRepo.deletePost(id)
    await this.auditService.write({
      action: 'system.post.deleted',
      resource: 'post',
      resourceId: id
    })
  }
}
