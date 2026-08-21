import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {
  buildOrganizationTypeCatalog,
  createAuditDiff,
  isOrganizationTypeEnabled,
  parseAuditDiff,
  parseOrganizationTypeCatalogConfig,
  serializeOrganizationTypeCatalog
} from '@zen/shared'

import { applyOrganizationTreeDataScope } from '@/common/auth/apply-data-scope'
import { AuditService } from '@/common/auth/audit.service'
import { AuthContextService } from '@/common/auth/auth-context.service'
import { SessionService } from '@/common/auth/session.service'
import { paginate } from '@/common/pagination/paginate.util'
import { PostService } from '@/modules/post'

import {
  fromApiOrganizationType,
  toApiOrganizationType,
  toOrganizationMemberResponse,
  toOrganizationResponse
} from './organization.mapper'
import { OrganizationRepository } from './organization.repository'
import { assertValidParentType, canBeChildOf, throwMoveRejection } from './organization.rules'
import {
  buildOrganizationCreatedDiff,
  buildOrganizationLeaderDiff,
  buildOrganizationMembersDiff,
  buildOrganizationParentDiff,
  buildOrganizationPositionCreatedDiff,
  buildOrganizationUpdatedDiff,
  toUserDisplayName
} from './organization-audit-diff'

import type { Prisma } from '@prisma/client'
import type {
  AuditDiff,
  AuthContext,
  OrganizationActivity,
  OrganizationTreeNode,
  OrganizationType,
  OrganizationTypeCatalog,
  OrganizationTypeCatalogResponse,
  UpdateOrganizationTypeCatalog
} from '@zen/shared'
import type {
  AddOrganizationMemberDto,
  ChangeOrganizationParentDto,
  CreateOrganizationDto,
  CreatePositionDto,
  OrganizationActivitiesQueryDto,
  UpdateOrganizationDto,
  UpdateOrganizationLeaderDto,
  UpdateOrganizationPositionDto
} from './dto'
import type { OrganizationWithRelations } from './organization.repository'
import type {
  OrganizationActivitiesResponse,
  OrganizationMemberResponse,
  OrganizationResponse,
  OrganizationTreeResponse,
  PositionResponse
} from './responses/organization.response'

const NAME_COLLATOR = new Intl.Collator('zh-CN', {
  numeric: true,
  sensitivity: 'base'
})

const ORGANIZATION_ACTION_TITLES: Record<string, string> = {
  'system.organization.created': '创建了组织',
  'system.organization.updated': '更新了信息',
  'system.organization.leader_updated': '变更了负责人',
  'system.organization.parent_changed': '调整了上级',
  'system.organization.member_added': '添加了成员',
  'system.organization.member_removed': '移除了成员',
  'system.organization.position_created': '创建了岗位'
}

function buildPath(parentPath: string | null | undefined, id: string): string {
  return `${parentPath || '/'}${id}/`
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function displayText(value: string | null | undefined): string {
  if (value == null || value === '') return '空'
  return value
}

function formatMembersLine(names: string[], verb: '添加了' | '移除了'): string {
  if (names.length === 0) return `${verb} 0 人`
  return `${verb}${names.join('、')} 共 ${names.length} 人`
}

function formatChanges(diff: AuditDiff): string {
  if (!diff.changes || diff.changes.length === 0) {
    return diff.summary ?? '无字段变更'
  }
  return diff.changes
    .map(
      (change) =>
        `${change.label}由「${displayText(change.from)}」更新为「${displayText(change.to)}」`
    )
    .join('、')
}

function formatActivityDescription(action: string, diff: AuditDiff | null): string {
  if (!diff) {
    return ORGANIZATION_ACTION_TITLES[action] ?? '更新了组织'
  }

  if (
    action === 'system.organization.created' ||
    action === 'system.organization.position_created'
  ) {
    return diff.summary ?? ORGANIZATION_ACTION_TITLES[action] ?? '更新了组织'
  }

  if (
    action === 'system.organization.updated' ||
    action === 'system.organization.leader_updated' ||
    action === 'system.organization.parent_changed'
  ) {
    return formatChanges(diff)
  }

  if (action === 'system.organization.member_added') {
    return formatMembersLine(
      (diff.members?.added ?? []).map((item) => item.name),
      '添加了'
    )
  }

  if (action === 'system.organization.member_removed') {
    return formatMembersLine(
      (diff.members?.removed ?? []).map((item) => item.name),
      '移除了'
    )
  }

  return diff.summary ?? ORGANIZATION_ACTION_TITLES[action] ?? '更新了组织'
}

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(OrganizationRepository) private readonly orgRepo: OrganizationRepository,
    @Inject(PostService) private readonly postService: PostService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService,
    @Inject(SessionService) private readonly sessionService: SessionService
  ) {}

  async getTree(auth: AuthContext): Promise<OrganizationTreeResponse> {
    const rows = await this.orgRepo.findMany(this.scope(auth))
    const nodes = new Map<string, OrganizationTreeNode>()
    for (const row of rows) {
      nodes.set(row.id, { ...toOrganizationResponse(row), children: [] })
    }

    const roots: OrganizationTreeNode[] = []
    for (const row of rows) {
      const node = nodes.get(row.id)
      if (!node) continue
      const parent = row.parentId ? nodes.get(row.parentId) : undefined
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
    return this.sortTree(roots)
  }

  async getTypeCatalog(auth: AuthContext): Promise<OrganizationTypeCatalogResponse> {
    const [catalog, typeRows] = await Promise.all([
      this.loadTypeCatalog(auth),
      this.orgRepo.findDistinctTypes()
    ])
    return {
      catalog,
      inUseTypes: typeRows.map((row) => toApiOrganizationType(row.type))
    }
  }

  async updateTypeCatalog(
    data: UpdateOrganizationTypeCatalog,
    auth: AuthContext
  ): Promise<OrganizationTypeCatalogResponse> {
    const catalog = buildOrganizationTypeCatalog({
      types: Object.fromEntries(
        data.items.map((item) => [item.type, { enabled: item.enabled, label: item.label }])
      )
    })
    await this.saveTypeCatalog(auth, catalog)
    await this.writeAudit(
      auth,
      auth.tenantId,
      'system.organization.type_catalog_updated',
      createAuditDiff({
        summary: `组织类型已更新为「${catalog.templateId === 'custom' ? '自定义' : catalog.templateId}」`
      })
    )
    return this.getTypeCatalog(auth)
  }

  async findOne(id: string, auth: AuthContext): Promise<OrganizationResponse> {
    return toOrganizationResponse(await this.requireVisible(id, auth))
  }

  async create(data: CreateOrganizationDto, auth: AuthContext): Promise<OrganizationResponse> {
    if (await this.orgRepo.findByCode(data.code)) {
      throw new ConflictException('组织编码已存在')
    }

    const parent = data.parentId ? await this.requireVisible(data.parentId, auth) : null
    assertValidParentType(data.type, parent ? toApiOrganizationType(parent.type) : null)
    await this.assertTypeEnabled(data.type, auth)
    await this.assertActiveUser(data.leaderId)

    const created = await this.orgRepo.create({
      code: data.code,
      name: data.name,
      type: fromApiOrganizationType(data.type),
      description: data.description,
      effectiveDate: toDate(data.effectiveDate),
      level: parent ? parent.level + 1 : 1,
      parent: parent ? { connect: { id: parent.id } } : undefined,
      leader: data.leaderId ? { connect: { id: data.leaderId } } : undefined
    })
    const updated = await this.orgRepo.update(created.id, {
      path: buildPath(parent?.path, created.id)
    })
    await this.writeAudit(
      auth,
      updated.id,
      'system.organization.created',
      buildOrganizationCreatedDiff(updated)
    )
    return toOrganizationResponse(updated)
  }

  async update(
    id: string,
    data: UpdateOrganizationDto,
    auth: AuthContext
  ): Promise<OrganizationResponse> {
    const existing = await this.requireVisible(id, auth)
    if (data.type) await this.assertTypeChange(existing, data.type, auth)

    const updated = await this.orgRepo.update(id, {
      name: data.name,
      type: data.type ? fromApiOrganizationType(data.type) : undefined,
      description: data.description,
      effectiveDate: data.effectiveDate ? toDate(data.effectiveDate) : undefined
    })
    await this.writeAudit(
      auth,
      id,
      'system.organization.updated',
      buildOrganizationUpdatedDiff(existing, data)
    )
    return toOrganizationResponse(updated)
  }

  async updateLeader(
    id: string,
    data: UpdateOrganizationLeaderDto,
    auth: AuthContext
  ): Promise<OrganizationResponse> {
    const existing = await this.requireVisible(id, auth)
    await this.assertActiveUser(data.leaderId)

    const leaderIds = [
      ...new Set(
        [existing.leaderId, data.leaderId].filter((value): value is string => Boolean(value))
      )
    ]
    const leaders = new Map(
      (await this.orgRepo.findUsersDisplayByIds(leaderIds)).map((user) => [
        user.id,
        { id: user.id, name: toUserDisplayName(user) }
      ])
    )

    const updated = await this.orgRepo.update(id, {
      leader: data.leaderId === null ? { disconnect: true } : { connect: { id: data.leaderId } }
    })
    await this.writeAudit(
      auth,
      id,
      'system.organization.leader_updated',
      buildOrganizationLeaderDiff(
        existing,
        existing.leaderId ? (leaders.get(existing.leaderId) ?? null) : null,
        data.leaderId
          ? (leaders.get(data.leaderId) ?? { id: data.leaderId, name: data.leaderId })
          : null
      )
    )
    return toOrganizationResponse(updated)
  }

  async changeParent(
    id: string,
    data: ChangeOrganizationParentDto,
    auth: AuthContext
  ): Promise<OrganizationResponse> {
    const existing = await this.requireVisible(id, auth)
    if (data.parentId === existing.parentId) {
      throwMoveRejection('ORG_MOVE_SAME_PARENT', '已在该组织下')
    }
    if (data.parentId === id) {
      throwMoveRejection('ORG_MOVE_TO_SELF', '不能将组织移动到自身之下')
    }
    await this.assertSubtreeManageable(existing.path, auth)

    const parent = data.parentId ? await this.requireVisible(data.parentId, auth) : null
    if (parent?.path?.startsWith(existing.path ?? `/${id}/`)) {
      throwMoveRejection('ORG_MOVE_TO_DESCENDANT', '不能将组织移动到其下级组织中')
    }
    assertValidParentType(
      toApiOrganizationType(existing.type),
      parent ? toApiOrganizationType(parent.type) : null
    )

    const parentIds = [
      ...new Set(
        [existing.parentId, data.parentId].filter((value): value is string => Boolean(value))
      )
    ]
    const parents = new Map(
      (await this.orgRepo.findOrganizationsDisplayByIds(parentIds)).map((item) => [
        item.id,
        { id: item.id, name: item.name }
      ])
    )

    const oldPrefix = existing.path ?? `/${id}/`
    const newPath = buildPath(parent?.path, id)
    const levelDelta = (parent?.level ?? 0) + 1 - existing.level
    const descendants = await this.orgRepo.findDescendantsByPathPrefix(oldPrefix)
    await this.orgRepo.updateManyPaths(
      descendants.map((node) => ({
        id: node.id,
        path: `${newPath}${node.path?.slice(oldPrefix.length) ?? ''}`,
        level: node.level + levelDelta,
        ...(node.id === id ? { parentId: data.parentId } : {})
      }))
    )

    await this.writeAudit(
      auth,
      id,
      'system.organization.parent_changed',
      buildOrganizationParentDiff(
        existing,
        existing.parentId ? (parents.get(existing.parentId) ?? null) : null,
        data.parentId
          ? (parents.get(data.parentId) ?? { id: data.parentId, name: data.parentId })
          : null
      )
    )
    await this.authContextService.bumpPermVer()
    return toOrganizationResponse(await this.requireVisible(id, auth))
  }

  async listMembers(id: string, auth: AuthContext): Promise<OrganizationMemberResponse[]> {
    await this.requireVisible(id, auth)
    return (await this.orgRepo.listMembers(id)).map(toOrganizationMemberResponse)
  }

  async addMember(
    id: string,
    data: AddOrganizationMemberDto,
    auth: AuthContext
  ): Promise<OrganizationMemberResponse[]> {
    const organization = await this.requireVisible(id, auth)
    const userIds = [...new Set(data.userIds.map((item) => item.trim()).filter(Boolean))]
    if (userIds.length === 0) {
      throw new BadRequestException('至少选择一名用户')
    }

    for (const userId of userIds) {
      await this.assertActiveUser(userId)
    }

    const members = await Promise.all(userIds.map((userId) => this.orgRepo.addMember(id, userId)))
    const displayUsers = await this.orgRepo.findUsersDisplayByIds(userIds)
    const displayById = new Map(
      displayUsers.map((user) => [user.id, toUserDisplayName(user)] as const)
    )

    await this.writeAudit(
      auth,
      id,
      'system.organization.member_added',
      buildOrganizationMembersDiff(
        organization,
        userIds.map((userId) => ({
          id: userId,
          name: displayById.get(userId) ?? userId
        })),
        'added'
      )
    )

    await Promise.all(userIds.map((userId) => this.refreshUserAccess(userId)))
    return members.map(toOrganizationMemberResponse)
  }

  async removeMember(id: string, userId: string, auth: AuthContext): Promise<void> {
    const organization = await this.requireVisible(id, auth)
    const displayUsers = await this.orgRepo.findUsersDisplayByIds([userId])
    const displayUser = displayUsers[0]
    const result = await this.orgRepo.removeMember(id, userId)
    if (result.count === 0) throw new NotFoundException('组织成员不存在')
    await this.writeAudit(
      auth,
      id,
      'system.organization.member_removed',
      buildOrganizationMembersDiff(
        organization,
        [
          {
            id: userId,
            name: displayUser ? toUserDisplayName(displayUser) : userId
          }
        ],
        'removed'
      )
    )
    await this.refreshUserAccess(userId)
  }

  async listPositions(id: string, auth: AuthContext): Promise<PositionResponse[]> {
    await this.requireVisible(id, auth)
    return this.postService.listOrganizationPositions(id)
  }

  async createPosition(
    id: string,
    data: CreatePositionDto,
    auth: AuthContext
  ): Promise<PositionResponse> {
    const organization = await this.requireVisible(id, auth)
    const position = await this.postService.linkOrganizationPosition(id, data)
    await this.writeAudit(
      auth,
      id,
      'system.organization.position_created',
      buildOrganizationPositionCreatedDiff(organization, {
        id: position.id,
        code: position.code,
        name: position.name,
        level: position.level,
        headcount: position.headcount
      })
    )
    return position
  }

  async updatePosition(
    id: string,
    positionId: string,
    data: UpdateOrganizationPositionDto,
    auth: AuthContext
  ): Promise<PositionResponse> {
    await this.requireVisible(id, auth)
    return this.postService.updateOrganizationPosition(id, positionId, data)
  }

  async removePosition(id: string, positionId: string, auth: AuthContext): Promise<void> {
    await this.requireVisible(id, auth)
    await this.postService.unlinkOrganizationPosition(id, positionId)
  }

  async listActivities(
    id: string,
    query: OrganizationActivitiesQueryDto,
    auth: AuthContext
  ): Promise<OrganizationActivitiesResponse> {
    await this.requireVisible(id, auth)
    const page = await paginate({
      page: query.page,
      pageSize: query.pageSize,
      count: () => this.orgRepo.countActivities(auth.tenantId, id),
      findMany: (pagination) => this.orgRepo.listActivities(auth.tenantId, id, pagination)
    })
    const actorIds = [
      ...new Set(page.items.flatMap((item) => (item.actorId ? [item.actorId] : [])))
    ]
    const actors = new Map(
      (await this.orgRepo.findActivityActors(actorIds)).map((user) => [user.id, user])
    )
    return {
      pagination: page.pagination,
      items: page.items.map((item) => this.toActivity(item, actors.get(item.actorId ?? '')))
    }
  }

  private scope(auth: AuthContext): Prisma.OrganizationWhereInput {
    return applyOrganizationTreeDataScope(auth) as Prisma.OrganizationWhereInput
  }

  private async requireVisible(id: string, auth: AuthContext) {
    const organization = await this.orgRepo.findByIdInScope(id, this.scope(auth))
    if (!organization) throw new NotFoundException('组织不存在或不可访问')
    return organization
  }

  private async assertActiveUser(userId: string | null | undefined): Promise<void> {
    if (!userId) return
    if (!(await this.orgRepo.findActiveUserById(userId))) {
      throw new NotFoundException('用户不存在或不可用')
    }
  }

  private async assertSubtreeManageable(path: string | null, auth: AuthContext): Promise<void> {
    if (!path) throw new ConflictException('组织路径未初始化')
    const [total, visible] = await Promise.all([
      this.orgRepo.countDescendantsByPathPrefix(path),
      this.orgRepo.countDescendantsByPathPrefix(path, this.scope(auth))
    ])
    if (total !== visible) {
      throw new ForbiddenException({
        message: '无权移动包含不可管理下级的组织',
        reason: 'ORG_MOVE_OUT_OF_SCOPE'
      })
    }
  }

  private async loadTypeCatalog(auth: AuthContext): Promise<OrganizationTypeCatalog> {
    const settings = await this.orgRepo.getTenantSettings(auth.tenantId)
    return buildOrganizationTypeCatalog(
      parseOrganizationTypeCatalogConfig(settings.organizationTypes)
    )
  }

  private async saveTypeCatalog(auth: AuthContext, catalog: OrganizationTypeCatalog) {
    const settings = await this.orgRepo.getTenantSettings(auth.tenantId)
    await this.orgRepo.updateTenantSettings(auth.tenantId, {
      ...settings,
      organizationTypes: serializeOrganizationTypeCatalog(catalog)
    })
  }

  private async assertTypeEnabled(type: OrganizationType, auth: AuthContext): Promise<void> {
    const catalog = await this.loadTypeCatalog(auth)
    if (!isOrganizationTypeEnabled(type, catalog)) {
      throw new BadRequestException({
        message: '该组织类型未在本企业启用',
        reason: 'ORG_TYPE_DISABLED'
      })
    }
  }

  private async assertTypeChange(
    existing: OrganizationWithRelations,
    nextType: UpdateOrganizationDto['type'],
    auth: AuthContext
  ): Promise<void> {
    if (!nextType) return
    const parent = existing.parentId ? await this.orgRepo.findById(existing.parentId) : null
    assertValidParentType(nextType, parent ? toApiOrganizationType(parent.type) : null)
    if (nextType !== toApiOrganizationType(existing.type)) {
      await this.assertTypeEnabled(nextType, auth)
    }
    const children = await this.orgRepo.findChildrenTypes(existing.id)
    if (children.some((child) => !canBeChildOf(toApiOrganizationType(child.type), nextType))) {
      throw new ConflictException('新组织类型与现有下级组织不兼容')
    }
  }

  private sortTree(nodes: OrganizationTreeNode[]): OrganizationTreeNode[] {
    return nodes
      .map((node) => ({ ...node, children: this.sortTree(node.children) }))
      .sort(
        (left, right) =>
          NAME_COLLATOR.compare(left.name, right.name) || left.id.localeCompare(right.id)
      )
  }

  /**
   * 成员归属变更只影响当事人：清空其鉴权快照并注销其会话。
   * 不 bump 租户 permVer，否则所有在线用户（含操作者）的 accessToken 会立即失效并触发 401。
   */
  private async refreshUserAccess(userId: string): Promise<void> {
    this.authContextService.invalidateCache(userId)
    await this.sessionService.revokeAllForUser(userId)
  }

  private writeAudit(auth: AuthContext, resourceId: string, action: string, diff: AuditDiff) {
    return this.auditService.write({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action,
      resource: 'organization',
      resourceId,
      diff
    })
  }

  private toActivity(
    item: {
      id: string
      actorId: string | null
      action: string
      diff: Prisma.JsonValue | null
      createdAt: Date
    },
    actor:
      | {
          id: string
          username: string
          nickname: string | null
          profile: { realName: string | null; avatar: string | null } | null
        }
      | undefined
  ): OrganizationActivity {
    const diff = parseAuditDiff(item.diff)
    return {
      id: item.id,
      actor: {
        id: actor?.id ?? item.actorId,
        name: actor?.profile?.realName ?? actor?.nickname ?? actor?.username ?? '系统',
        avatar: actor?.profile?.avatar ?? null
      },
      action: item.action,
      title: ORGANIZATION_ACTION_TITLES[item.action] ?? '操作了组织',
      description: formatActivityDescription(item.action, diff),
      diff,
      createdAt: item.createdAt.toISOString()
    }
  }
}
