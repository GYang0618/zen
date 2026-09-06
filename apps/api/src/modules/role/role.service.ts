import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PermissionStatus, RoleKind } from '@prisma/client'
import { completePageQuery } from '@zen/shared'

import { AuditService } from '../../common/auth/audit.service.js'
import { AuthContextService } from '../../common/auth/auth-context.service.js'
import { SessionService } from '../../common/auth/session.service.js'
import { toArray } from '../../common/index.js'
import { buildPaginationMeta, paginate } from '../../common/pagination/index.js'
import { findRolesQuerySchema } from './dto/index.js'
import {
  fromApiDataScope,
  fromApiRoleStatus,
  toApiDataScope,
  toRoleListItemResponse,
  toRoleResponse
} from './role.mapper.js'
import { RoleRepository } from './role.repository.js'
import {
  buildRoleClonedDiff,
  buildRoleCreatedDiff,
  buildRoleDataScopeDiff,
  buildRoleDeletedDiff,
  buildRoleMembersDiff,
  buildRolePermissionsDiff,
  buildRoleUpdatedDiff,
  toUserDisplayName
} from './role-audit-diff.js'

import type { Prisma } from '@prisma/client'
import type {
  AssignRoleDataScope,
  AssignRoleMembersDto,
  AssignRolePermissionsDto,
  CloneRoleDto,
  CreateRoleDto,
  FindRolesQueryDto,
  RoleDataScope,
  RoleEffectiveStatus,
  RoleStatus,
  UpdateRoleDto
} from './dto/index.js'
import type {
  PermissionGroupResponse,
  RoleListItemResponse,
  RoleListResponse,
  RoleMemberResponse,
  RoleMembersResponse,
  RoleResponse
} from './responses/role.response.js'

const SUPER_ADMIN_ROLE_CODE = 'super_admin'

@Injectable()
export class RoleService {
  constructor(
    @Inject(RoleRepository) private readonly roleRepo: RoleRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService
  ) {}

  async create(data: CreateRoleDto): Promise<RoleResponse> {
    const existing = await this.roleRepo.findByCode(data.code)
    if (existing) {
      throw new ConflictException('角色编码已存在')
    }

    const dataScope = data.dataScope ?? 'self'
    const customOrgIds = await this.resolveCustomOrgIds(dataScope, data.customOrgIds)
    const { ids: permissionIds } = await this.resolveActivePermissionIds(data.permissionCodes ?? [])
    const expiresAt = parseExpiresAt(data.expiresAt)

    const created = await this.roleRepo.create({
      code: data.code,
      name: data.name,
      description: data.description,
      icon: data.icon ?? null,
      iconColor: data.iconColor ?? null,
      expiresAt,
      dataScope: fromApiDataScope(dataScope),
      customOrgIds,
      sort: data.sort,
      kind: RoleKind.CUSTOM,
      isSystem: false,
      permissions:
        permissionIds.length > 0
          ? {
              create: permissionIds.map((permissionId) => ({ permissionId }))
            }
          : undefined
    })

    await this.auditService.write({
      action: 'system.role.created',
      resource: 'role',
      resourceId: created.id,
      diff: buildRoleCreatedDiff({
        id: created.id,
        code: data.code,
        name: data.name,
        dataScope,
        permissionCount: permissionIds.length
      })
    })

    const role = await this.roleRepo.findById(created.id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  async findAll(query?: FindRolesQueryDto): Promise<RoleListResponse> {
    const completedQuery = completePageQuery(query ?? {})
    const hasPage = completedQuery.page !== undefined
    const hasPageSize = completedQuery.pageSize !== undefined

    const parsed = findRolesQuerySchema.parse(completedQuery)
    const { keyword, status, dataScope, page, pageSize } = parsed
    const effectiveStatus = toArray(parsed.effectiveStatus) as RoleEffectiveStatus[] | undefined
    const where = this.buildFindRolesWhere({
      keyword,
      status: toArray(status),
      dataScope: toArray(dataScope),
      effectiveStatus
    })

    if (hasPage && hasPageSize) {
      // effectiveStatus 含派生态时需内存过滤；先取全量再分页以保证计数准确
      if (effectiveStatus && effectiveStatus.length > 0) {
        const all = await this.roleRepo.findMany(where, undefined, undefined, [
          { sort: 'asc' },
          { createdAt: 'desc' }
        ])
        const filtered = all
          .map(toRoleListItemResponse)
          .filter((item) => effectiveStatus.includes(item.effectiveStatus))
        const total = filtered.length
        const start = (page! - 1) * pageSize!
        const items = filtered.slice(start, start + pageSize!)
        return {
          items,
          pagination: buildPaginationMeta(page!, pageSize!, total)
        }
      }

      const { items, pagination } = await paginate({
        page: page!,
        pageSize: pageSize!,
        count: () => this.roleRepo.count(where),
        findMany: ({ skip, take }) =>
          this.roleRepo.findMany(where, skip, take, [{ sort: 'asc' }, { createdAt: 'desc' }])
      })

      return { items: items.map(toRoleListItemResponse), pagination }
    }

    const items = await this.roleRepo.findMany(where, undefined, undefined, [
      { sort: 'asc' },
      { createdAt: 'desc' }
    ])
    let mapped = items.map(toRoleListItemResponse)
    if (effectiveStatus && effectiveStatus.length > 0) {
      mapped = mapped.filter((item) => effectiveStatus.includes(item.effectiveStatus))
    }
    const total = mapped.length
    return {
      items: mapped,
      pagination: buildPaginationMeta(1, total, total)
    }
  }

  async findOne(id: string): Promise<RoleResponse> {
    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  async update(id: string, data: UpdateRoleDto): Promise<RoleResponse> {
    const existing = await this.roleRepo.findById(id)
    if (!existing) throw new NotFoundException('角色不存在')

    if (this.isLockedSystemRole(existing)) {
      // 系统角色仅允许改展示字段
      const allowedOnlyDisplay =
        data.status === undefined && data.dataScope === undefined && data.customOrgIds === undefined
      if (
        !allowedOnlyDisplay &&
        data.name === undefined &&
        data.description === undefined &&
        data.icon === undefined &&
        data.iconColor === undefined
      ) {
        throw new ForbiddenException('系统内置超级管理员角色不可编辑')
      }
      if (
        existing.code === SUPER_ADMIN_ROLE_CODE &&
        (data.dataScope !== undefined || data.status !== undefined)
      ) {
        throw new ForbiddenException('系统内置超级管理员角色状态与数据范围不可修改')
      }
    }

    const updateData: Prisma.RoleUpdateInput = {}
    let scopeChanged = false

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.sort !== undefined) updateData.sort = data.sort
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.iconColor !== undefined) updateData.iconColor = data.iconColor
    if (data.expiresAt !== undefined) updateData.expiresAt = parseExpiresAt(data.expiresAt)
    if (data.status !== undefined) {
      if (this.isLockedSystemRole(existing)) {
        throw new ForbiddenException('系统角色不可变更状态')
      }
      updateData.status = fromApiRoleStatus(data.status)
    }

    if (data.dataScope !== undefined || data.customOrgIds !== undefined) {
      if (this.isLockedSystemRole(existing)) {
        throw new ForbiddenException('系统角色数据范围不可修改')
      }
      const nextScope = data.dataScope ?? toApiDataScope(existing.dataScope)
      const nextCustomOrgIds = await this.resolveCustomOrgIds(
        nextScope,
        data.customOrgIds ?? (nextScope === 'custom' ? existing.customOrgIds : [])
      )
      if (data.dataScope !== undefined) {
        updateData.dataScope = fromApiDataScope(data.dataScope)
      }
      updateData.customOrgIds = nextScope === 'custom' ? nextCustomOrgIds : []
      scopeChanged = true
    }

    await this.roleRepo.update(id, updateData)

    if (scopeChanged || data.status !== undefined || data.expiresAt !== undefined) {
      await this.invalidateRoleMembers(id)
    }

    const { action, diff } = buildRoleUpdatedDiff(existing, data)
    await this.auditService.write({
      action,
      resource: 'role',
      resourceId: id,
      diff
    })

    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  async assignDataScope(id: string, payload: AssignRoleDataScope): Promise<RoleResponse> {
    const existing = await this.roleRepo.findById(id)
    if (!existing) throw new NotFoundException('角色不存在')
    if (this.isLockedSystemRole(existing)) {
      throw new ForbiddenException('系统角色数据范围不可修改')
    }
    this.assertBaseVersion(existing.updatedAt, payload.baseVersion)

    const customOrgIds = await this.resolveCustomOrgIds(payload.dataScope, payload.customOrgIds)
    await this.roleRepo.update(id, {
      dataScope: fromApiDataScope(payload.dataScope),
      customOrgIds: payload.dataScope === 'custom' ? customOrgIds : []
    })

    await this.auditService.write({
      action: 'system.role.data_scope_updated',
      resource: 'role',
      resourceId: id,
      diff: buildRoleDataScopeDiff(existing, payload.dataScope, customOrgIds)
    })

    await this.invalidateRoleMembers(id)
    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  async clone(id: string, payload: CloneRoleDto): Promise<RoleResponse> {
    const source = await this.roleRepo.findById(id)
    if (!source) throw new NotFoundException('角色不存在')
    if (this.isLockedSystemRole(source)) {
      throw new ForbiddenException('系统角色不可克隆')
    }

    const existing = await this.roleRepo.findByCode(payload.code)
    if (existing) {
      throw new ConflictException('角色编码已存在')
    }

    const permissionCodes = source.permissions
      .filter((item) => item.permission.status === PermissionStatus.ACTIVE)
      .map((item) => item.permission.code)

    const validCustomOrgIds =
      source.dataScope === 'CUSTOM' ? await this.filterExistingOrgIds(source.customOrgIds) : []

    const created = await this.create({
      code: payload.code,
      name: payload.name,
      description: payload.description,
      icon: (source.icon as CreateRoleDto['icon']) ?? null,
      iconColor: (source.iconColor as CreateRoleDto['iconColor']) ?? null,
      expiresAt: payload.expiresAt ?? null,
      dataScope: toApiDataScope(source.dataScope),
      customOrgIds: validCustomOrgIds,
      sort: source.sort ?? undefined,
      permissionCodes
    })

    await this.auditService.write({
      action: 'system.role.cloned',
      resource: 'role',
      resourceId: created.id,
      diff: buildRoleClonedDiff({
        created: {
          id: created.id,
          code: created.code,
          name: created.name,
          dataScope: created.dataScope
        },
        source: { id: source.id, code: source.code, name: source.name },
        permissionCount: permissionCodes.length
      })
    })

    return created
  }

  async listMembers(roleId: string, page = 1, pageSize = 100): Promise<RoleMembersResponse> {
    const role = await this.roleRepo.findById(roleId)
    if (!role) throw new NotFoundException('角色不存在')

    const { items, pagination } = await paginate({
      page,
      pageSize,
      count: () => this.roleRepo.countMembers(roleId),
      findMany: ({ skip, take }) => this.roleRepo.findMembers(roleId, skip, take)
    })

    return {
      items: items.map(toRoleMemberResponse),
      pagination: pagination ?? buildPaginationMeta(page, pageSize, items.length)
    }
  }

  async addMembers(roleId: string, payload: AssignRoleMembersDto): Promise<RoleMembersResponse> {
    const role = await this.roleRepo.findById(roleId)
    if (!role) throw new NotFoundException('角色不存在')

    const userIds = [
      ...new Set(payload.userIds.map((id) => id.trim()).filter((id) => id.length > 0))
    ]
    if (userIds.length === 0) {
      throw new BadRequestException('至少选择一名用户')
    }

    const users = await this.roleRepo.findActiveUsersByIds(userIds)
    if (users.length !== userIds.length) {
      throw new BadRequestException('部分用户不存在或已删除')
    }

    const displayUsers = await this.roleRepo.findUsersDisplayByIds(userIds)
    const members = displayUsers.map((user) => ({
      id: user.id,
      name: toUserDisplayName(user)
    }))

    await this.roleRepo.addMembers(roleId, userIds)
    await this.auditService.write({
      action: 'system.role.members_added',
      resource: 'role',
      resourceId: roleId,
      diff: buildRoleMembersDiff(
        { id: role.id, code: role.code, name: role.name },
        members,
        'added'
      )
    })
    // 角色成员变更只影响当事人，避免 bump 租户 permVer 使所有在线用户的 token 失效。
    for (const userId of userIds) {
      this.authContextService.invalidateCache(userId)
    }
    await Promise.all(userIds.map((userId) => this.sessionService.revokeAllForUser(userId)))

    return this.listMembers(roleId)
  }

  async removeMember(roleId: string, userId: string): Promise<RoleMembersResponse> {
    const role = await this.roleRepo.findById(roleId)
    if (!role) throw new NotFoundException('角色不存在')

    const memberIds = await this.roleRepo.findUserIdsByRoleId(roleId)
    if (!memberIds.includes(userId)) {
      throw new NotFoundException('该用户未绑定此角色')
    }

    if (role.code === SUPER_ADMIN_ROLE_CODE) {
      const otherSuperAdmins = await this.roleRepo.countActiveSuperAdminsExcluding(userId)
      if (otherSuperAdmins === 0) {
        throw new BadRequestException('系统至少需要保留一名超级管理员')
      }
    }

    const userRoles = await this.roleRepo.findUserRoleCodes(userId)
    if (userRoles.length <= 1) {
      throw new BadRequestException('用户至少需要保留一个角色，无法解绑')
    }

    const displayUsers = await this.roleRepo.findUsersDisplayByIds([userId])
    const removedMember = displayUsers[0]
    const memberSnapshot = {
      id: userId,
      name: removedMember ? toUserDisplayName(removedMember) : userId
    }

    await this.roleRepo.removeMember(roleId, userId)
    await this.auditService.write({
      action: 'system.role.member_removed',
      resource: 'role',
      resourceId: roleId,
      diff: buildRoleMembersDiff(
        { id: role.id, code: role.code, name: role.name },
        [memberSnapshot],
        'removed'
      )
    })
    // 解绑后的权限由服务端鉴权快照实时收敛，无需让操作者和其他用户刷新 token。
    this.authContextService.invalidateCache(userId)
    await this.sessionService.revokeAllForUser(userId)

    return this.listMembers(roleId)
  }

  async assignPermissions(id: string, payload: AssignRolePermissionsDto): Promise<RoleResponse> {
    const existing = await this.roleRepo.findById(id)
    if (!existing) throw new NotFoundException('角色不存在')

    if (this.isLockedSystemRole(existing)) {
      throw new ForbiddenException('系统内置超级管理员角色权限不可修改')
    }

    this.assertBaseVersion(existing.updatedAt, payload.baseVersion)

    const previousCodes = existing.permissions.map((item) => item.permission.code)
    const { ids: permissionIds, codes: nextCodes } = await this.resolveActivePermissionIds(
      payload.permissionCodes
    )
    await this.roleRepo.replacePermissions(id, permissionIds)
    // touch updatedAt for optimistic lock progression
    await this.roleRepo.update(id, { updatedAt: new Date() })

    const previousSet = new Set(previousCodes)
    const nextSet = new Set(nextCodes)
    const addedCodes = nextCodes.filter((code) => !previousSet.has(code))
    const removedCodes = previousCodes.filter((code) => !nextSet.has(code))
    const snapshotCodes = [...new Set([...addedCodes, ...removedCodes])]
    const permissionRows =
      snapshotCodes.length > 0 ? await this.roleRepo.findPermissionsByCodes(snapshotCodes) : []
    const permissionMap = new Map(
      permissionRows.map((item) => [
        item.code,
        { code: item.code, module: item.module ?? '其他', name: item.name }
      ])
    )
    const toPermissionSnapshot = (codes: string[]) =>
      codes.map((code) => permissionMap.get(code) ?? { code, module: '其他', name: code })

    await this.auditService.write({
      action: 'system.role.permissions_assigned',
      resource: 'role',
      resourceId: id,
      diff: buildRolePermissionsDiff(
        { id: existing.id, code: existing.code, name: existing.name },
        toPermissionSnapshot(addedCodes),
        toPermissionSnapshot(removedCodes)
      )
    })

    await this.invalidateRoleMembers(id)

    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  /**
   * 权限 / 数据范围变更只影响该角色成员。
   * 鉴权快照按 userId:permVer 缓存，清空当事人缓存即可在下次请求加载新权限。
   * 不 bump 租户 permVer：否则所有在线用户（含操作者）的 accessToken 会立即 401。
   */
  private async invalidateRoleMembers(roleId: string) {
    const userIds = await this.roleRepo.findUserIdsByRoleId(roleId)
    for (const userId of userIds) {
      this.authContextService.invalidateCache(userId)
    }
  }

  async remove(idsInput: string[]): Promise<RoleListItemResponse[]> {
    const ids = normalizeIds(idsInput)
    const roles = await this.roleRepo.findManyByIds(ids)
    if (roles.length !== ids.length) {
      throw new NotFoundException('部分角色不存在')
    }

    const systemRoles = roles.filter((role) => role.isSystem || role.kind === RoleKind.SYSTEM)
    if (systemRoles.length > 0) {
      throw new ForbiddenException('系统内置角色不可删除')
    }

    const rolesWithMembers = roles.filter((role) => role._count.users > 0)
    if (rolesWithMembers.length > 0) {
      throw new BadRequestException('存在已分配成员的角色，请先移除成员后再删除')
    }

    await this.roleRepo.deleteManyByIds(ids)
    await this.auditService.write({
      action: 'system.role.deleted',
      resource: 'role',
      resourceId: ids.join(','),
      diff: buildRoleDeletedDiff(
        roles.map((role) => ({ id: role.id, code: role.code, name: role.name }))
      )
    })
    return roles.map(toRoleListItemResponse)
  }

  async listPermissions(): Promise<PermissionGroupResponse[]> {
    const permissions = await this.roleRepo.findAllPermissions()
    return groupPermissionsByModule(permissions)
  }

  private isLockedSystemRole(role: { code: string; isSystem: boolean; kind: RoleKind }): boolean {
    return role.isSystem || role.kind === RoleKind.SYSTEM || role.code === SUPER_ADMIN_ROLE_CODE
  }

  private assertBaseVersion(updatedAt: Date, baseVersion: string) {
    const baseline = new Date(baseVersion).getTime()
    if (Number.isNaN(baseline) || updatedAt.getTime() !== baseline) {
      throw new ConflictException('角色已被他人修改，请刷新后重试')
    }
  }

  /**
   * 解析可分配的权限：不存在的编码直接拒绝；已下线编码静默丢弃（与 clone 一致，兼容历史勾选）。
   */
  private async resolveActivePermissionIds(
    codes: string[]
  ): Promise<{ ids: string[]; codes: string[] }> {
    if (codes.length === 0) return { ids: [], codes: [] }

    const uniqueCodes = [...new Set(codes.map((code) => code.trim()).filter(Boolean))]
    const permissions = await this.roleRepo.findPermissionsByCodes(uniqueCodes)
    const foundCodes = new Set(permissions.map((item) => item.code))
    const missingCodes = uniqueCodes.filter((code) => !foundCodes.has(code))
    if (missingCodes.length > 0) {
      throw new BadRequestException(`部分权限编码不存在：${missingCodes.join('、')}`)
    }

    const active = permissions.filter((item) => item.status === PermissionStatus.ACTIVE)
    return {
      ids: active.map((item) => item.id),
      codes: active.map((item) => item.code)
    }
  }

  private async resolveCustomOrgIds(
    dataScope: RoleDataScope,
    customOrgIds?: string[]
  ): Promise<string[]> {
    if (dataScope !== 'custom') return []
    const ids = [...new Set((customOrgIds ?? []).map((id) => id.trim()).filter(Boolean))]
    if (ids.length === 0) {
      throw new BadRequestException('自定义数据范围时至少选择一个组织')
    }
    const count = await this.roleRepo.countOrganizationsByIds(ids)
    if (count !== ids.length) {
      throw new BadRequestException('部分组织不存在')
    }
    return ids
  }

  private async filterExistingOrgIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return []
    const count = await this.roleRepo.countOrganizationsByIds(ids)
    if (count === ids.length) return ids
    // 剔除已删除组织，避免克隆失败
    const existing: string[] = []
    for (const id of ids) {
      const c = await this.roleRepo.countOrganizationsByIds([id])
      if (c === 1) existing.push(id)
    }
    return existing
  }

  private buildFindRolesWhere(params: {
    keyword?: string
    status?: RoleStatus[]
    dataScope?: RoleDataScope[]
    effectiveStatus?: RoleEffectiveStatus[]
  }): Prisma.RoleWhereInput {
    const { keyword, status, dataScope, effectiveStatus } = params
    const conditions: Prisma.RoleWhereInput[] = []

    if (keyword) {
      const mode = 'insensitive' as const
      conditions.push({
        OR: [
          { name: { contains: keyword, mode } },
          { code: { contains: keyword, mode } },
          { description: { contains: keyword, mode } }
        ]
      })
    }

    if (status && status.length > 0) {
      conditions.push({ status: { in: status.map(fromApiRoleStatus) } })
    }

    if (dataScope && dataScope.length > 0) {
      conditions.push({ dataScope: { in: dataScope.map(fromApiDataScope) } })
    }

    // locked 可部分下推到 DB
    if (effectiveStatus?.length === 1 && effectiveStatus[0] === 'locked') {
      conditions.push({ OR: [{ kind: RoleKind.SYSTEM }, { isSystem: true }] })
    }

    if (conditions.length === 0) return {}
    if (conditions.length === 1) return conditions[0]!
    return { AND: conditions }
  }
}

function parseExpiresAt(value: string | null | undefined): Date | null {
  if (value === undefined) return null
  if (value === null) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999Z`)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('过期时间格式无效')
  }
  return date
}

function normalizeIds(idsInput: string[]): string[] {
  const ids = [
    ...new Set(
      idsInput
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ]
  if (ids.length === 0) {
    throw new BadRequestException('至少需要一个有效的角色 ID')
  }
  return ids
}

function toRoleMemberResponse(
  row: Awaited<ReturnType<RoleRepository['findMembers']>>[number]
): RoleMemberResponse {
  const primaryOrg = row.user.organizations[0]?.organization
  return {
    id: row.user.id,
    username: row.user.username,
    nickname: row.user.nickname ?? null,
    realName: row.user.profile?.realName ?? null,
    avatar: row.user.profile?.avatar ?? null,
    email: row.user.email,
    deptName: primaryOrg?.name ?? null,
    boundAt: row.createdAt.toISOString()
  }
}

function groupPermissionsByModule(
  permissions: Awaited<ReturnType<RoleRepository['findAllPermissions']>>
): PermissionGroupResponse[] {
  const groups = new Map<string, PermissionGroupResponse['permissions']>()

  for (const permission of permissions) {
    const moduleName = permission.module ?? '其他'
    const current = groups.get(moduleName) ?? []
    current.push({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      module: permission.module,
      resource: permission.resource,
      action: permission.action,
      description: permission.description ?? null,
      status: permission.status === PermissionStatus.DEPRECATED ? 'deprecated' : 'active',
      source: permission.source
    })
    groups.set(moduleName, current)
  }

  return Array.from(groups.entries()).map(([module, modulePermissions]) => ({
    module,
    permissions: modulePermissions
  }))
}
