import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PermissionStatus, RoleKind } from '@prisma/client'

import { toArray } from '@/common'
import { AuditService } from '@/common/auth/audit.service'
import { AuthContextService } from '@/common/auth/auth-context.service'
import { SessionService } from '@/common/auth/session.service'
import { buildPaginationMeta, paginate } from '@/common/pagination'

import { findRolesQuerySchema } from './dto'
import {
  fromApiDataScope,
  fromApiRoleStatus,
  toApiDataScope,
  toRoleListItemResponse,
  toRoleResponse
} from './role.mapper'
import { RoleRepository } from './role.repository'

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
} from './dto'
import type {
  PermissionGroupResponse,
  RoleListItemResponse,
  RoleListResponse,
  RoleMemberResponse,
  RoleMembersResponse,
  RoleResponse
} from './responses/role.response'

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
    const permissionIds = await this.resolveActivePermissionIds(data.permissionCodes ?? [])
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

    if (permissionIds.length > 0) {
      await this.authContextService.bumpPermVer()
    }

    await this.auditService.write({
      action: 'system.role.created',
      resource: 'role',
      resourceId: created.id,
      diff: {
        code: data.code,
        name: data.name,
        dataScope,
        permissionCount: permissionIds.length
      }
    })

    const role = await this.roleRepo.findById(created.id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  async findAll(query?: FindRolesQueryDto): Promise<RoleListResponse> {
    const hasPage = query?.page !== undefined
    const hasPageSize = query?.pageSize !== undefined
    if (hasPage !== hasPageSize) {
      throw new BadRequestException('page 和 pageSize 必须同时传入')
    }

    const parsed = findRolesQuerySchema.parse(query ?? {})
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
        data.name === undefined && data.description === undefined && data.icon === undefined &&
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

    await this.auditService.write({
      action:
        data.status !== undefined
          ? data.status === 'active'
            ? 'system.role.unfrozen'
            : 'system.role.frozen'
          : 'system.role.updated',
      resource: 'role',
      resourceId: id,
      diff: {
        name: data.name,
        description: data.description,
        status: data.status,
        dataScope: data.dataScope,
        customOrgIds: data.customOrgIds,
        expiresAt: data.expiresAt,
        icon: data.icon,
        iconColor: data.iconColor
      }
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
      diff: {
        from: toApiDataScope(existing.dataScope),
        to: payload.dataScope,
        customOrgIds
      }
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
      diff: {
        sourceRoleId: source.id,
        sourceRoleCode: source.code,
        permissionCount: permissionCodes.length,
        dataScope: created.dataScope
      }
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

    await this.roleRepo.addMembers(roleId, userIds)
    await this.auditService.write({
      action: 'system.role.members_added',
      resource: 'role',
      resourceId: roleId,
      diff: { userIds, roleCode: role.code, roleName: role.name }
    })
    await this.authContextService.bumpPermVer()
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

    await this.roleRepo.removeMember(roleId, userId)
    await this.auditService.write({
      action: 'system.role.member_removed',
      resource: 'role',
      resourceId: roleId,
      diff: { userId, roleCode: role.code, roleName: role.name }
    })
    await this.authContextService.bumpPermVer()
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
    const nextCodes = [
      ...new Set(payload.permissionCodes.map((code) => code.trim()).filter(Boolean))
    ]
    const permissionIds = await this.resolveActivePermissionIds(nextCodes)
    await this.roleRepo.replacePermissions(id, permissionIds)
    // touch updatedAt for optimistic lock progression
    await this.roleRepo.update(id, { updatedAt: new Date() })

    const previousSet = new Set(previousCodes)
    const nextSet = new Set(nextCodes)
    const added = nextCodes.filter((code) => !previousSet.has(code))
    const removed = previousCodes.filter((code) => !nextSet.has(code))

    await this.auditService.write({
      action: 'system.role.permissions_assigned',
      resource: 'role',
      resourceId: id,
      diff: { added, removed, permissionCodes: nextCodes }
    })

    // 仅 bump permVer：成员下次请求因 token.permVer 不匹配触发 401 → 静默 refresh，避免自己改权限被硬踢
    await this.authContextService.bumpPermVer()

    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  private async invalidateRoleMembers(_roleId: string) {
    await this.authContextService.bumpPermVer()
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
      diff: { ids, codes: roles.map((role) => role.code) }
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

  private async resolveActivePermissionIds(codes: string[]): Promise<string[]> {
    if (codes.length === 0) return []

    const uniqueCodes = [...new Set(codes.map((code) => code.trim()).filter(Boolean))]
    const permissions = await this.roleRepo.findActivePermissionsByCodes(uniqueCodes)
    if (permissions.length !== uniqueCodes.length) {
      throw new BadRequestException('部分权限编码不存在或已下线，无法勾选')
    }

    return permissions.map((item) => item.id)
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
