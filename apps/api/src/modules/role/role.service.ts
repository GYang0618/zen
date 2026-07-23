import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'

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
  AssignRolePermissionsDto,
  CreateRoleDto,
  FindRolesQueryDto,
  RoleDataScope,
  RoleStatus,
  UpdateRoleDto
} from './dto'
import type {
  PermissionGroupResponse,
  RoleListItemResponse,
  RoleListResponse,
  RoleResponse
} from './responses/role.response'

const LOCKED_SYSTEM_ROLE_CODES = new Set(['super_admin'])

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
    const permissionIds = await this.resolvePermissionIds(data.permissionCodes ?? [])
    const created = await this.roleRepo.create({
      code: data.code,
      name: data.name,
      description: data.description,
      dataScope: fromApiDataScope(dataScope),
      customOrgIds,
      sort: data.sort,
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

    const { keyword, status, dataScope, page, pageSize } = findRolesQuerySchema.parse(query ?? {})
    const where = this.buildFindRolesWhere({
      keyword,
      status: toArray(status),
      dataScope: toArray(dataScope)
    })

    if (hasPage && hasPageSize) {
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
    const total = items.length
    return {
      items: items.map(toRoleListItemResponse),
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

    if (existing.isSystem && LOCKED_SYSTEM_ROLE_CODES.has(existing.code)) {
      throw new ForbiddenException('系统内置超级管理员角色不可编辑')
    }

    const updateData: Prisma.RoleUpdateInput = {}
    let scopeChanged = false

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.sort !== undefined) updateData.sort = data.sort
    if (data.status !== undefined) updateData.status = fromApiRoleStatus(data.status)

    if (data.dataScope !== undefined || data.customOrgIds !== undefined) {
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

    if (data.permissionCodes !== undefined) {
      await this.assignPermissions(id, { permissionCodes: data.permissionCodes }, existing)
    } else if (scopeChanged) {
      await this.invalidateRoleMembers(id)
    }

    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  async assignPermissions(
    id: string,
    payload: AssignRolePermissionsDto,
    existingRole?: Awaited<ReturnType<RoleRepository['findById']>>
  ): Promise<RoleResponse> {
    const existing = existingRole ?? (await this.roleRepo.findById(id))
    if (!existing) throw new NotFoundException('角色不存在')

    if (existing.isSystem && LOCKED_SYSTEM_ROLE_CODES.has(existing.code)) {
      throw new ForbiddenException('系统内置超级管理员角色权限不可修改')
    }

    const permissionIds = await this.resolvePermissionIds(payload.permissionCodes)
    await this.roleRepo.replacePermissions(id, permissionIds)

    await this.auditService.write({
      action: 'system.role.permissions_assigned',
      resource: 'role',
      resourceId: id,
      diff: { permissionCodes: payload.permissionCodes }
    })

    await this.authContextService.bumpPermVer()
    const memberIds = await this.roleRepo.findUserIdsByRoleId(id)
    await Promise.all(memberIds.map((userId) => this.sessionService.revokeAllForUser(userId)))

    const role = await this.roleRepo.findById(id)
    if (!role) throw new NotFoundException('角色不存在')
    return toRoleResponse(role)
  }

  private async invalidateRoleMembers(roleId: string) {
    await this.authContextService.bumpPermVer()
    const memberIds = await this.roleRepo.findUserIdsByRoleId(roleId)
    await Promise.all(memberIds.map((userId) => this.sessionService.revokeAllForUser(userId)))
  }

  async remove(idsInput: string[]): Promise<RoleListItemResponse[]> {
    const ids = normalizeIds(idsInput)
    const roles = await this.roleRepo.findManyByIds(ids)
    if (roles.length !== ids.length) {
      throw new NotFoundException('部分角色不存在')
    }

    const systemRoles = roles.filter((role) => role.isSystem)
    if (systemRoles.length > 0) {
      throw new ForbiddenException('系统内置角色不可删除')
    }

    const rolesWithMembers = roles.filter((role) => role._count.users > 0)
    if (rolesWithMembers.length > 0) {
      throw new BadRequestException('存在已分配成员的角色，请先移除成员后再删除')
    }

    await this.roleRepo.deleteManyByIds(ids)
    return roles.map(toRoleListItemResponse)
  }

  async listPermissions(): Promise<PermissionGroupResponse[]> {
    const permissions = await this.roleRepo.findAllPermissions()
    return groupPermissionsByModule(permissions)
  }

  private async resolvePermissionIds(codes: string[]): Promise<string[]> {
    if (codes.length === 0) return []

    const uniqueCodes = [...new Set(codes.map((code) => code.trim()).filter(Boolean))]
    const permissions = await this.roleRepo.findPermissionsByCodes(uniqueCodes)
    if (permissions.length !== uniqueCodes.length) {
      throw new BadRequestException('部分权限编码不存在')
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

  private buildFindRolesWhere(params: {
    keyword?: string
    status?: RoleStatus[]
    dataScope?: RoleDataScope[]
  }): Prisma.RoleWhereInput {
    const { keyword, status, dataScope } = params
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

    if (conditions.length === 0) return {}
    if (conditions.length === 1) return conditions[0]
    return { AND: conditions }
  }
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
      description: permission.description ?? null
    })
    groups.set(moduleName, current)
  }

  return Array.from(groups.entries()).map(([module, modulePermissions]) => ({
    module,
    permissions: modulePermissions
  }))
}
