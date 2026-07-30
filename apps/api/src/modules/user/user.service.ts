import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { UserStatusCode } from '@prisma/client'

import { toArray } from '@/common'
import { applyUserListDataScope } from '@/common/auth/apply-data-scope'
import { AuditService } from '@/common/auth/audit.service'
import { AuthContextService } from '@/common/auth/auth-context.service'
import { MembershipService } from '@/common/auth/membership.service'
import { SessionService } from '@/common/auth/session.service'
import { buildPaginationMeta, paginate } from '@/common/pagination'
import argon2 from '@/common/utils/argon2'

import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { toUserInfoResponse, toUserListItemResponse } from './user.mapper'
import { UserRepository } from './user.repository'

import type { Prisma } from '@prisma/client'
import type { AuthContext } from '@zen/shared'
import type { AssignUserRolesDto } from './dto/assign-user-roles.dto'
import type { CreateUserDto } from './dto/create-user.dto'
import type {
  FindUsersQueryDto,
  UserStatus,
  UsersSortBy,
  UsersSortOrder
} from './dto/find-users-query.dto'
import type { ReplaceUserOrganizationsDto } from './dto/replace-user-organizations.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UpdateUsersStatusDto } from './dto/update-users-status.dto'
import type {
  UserInfoResponse,
  UserListItemResponse,
  UserListResponse
} from './responses/user.response'

const DEFAULT_ROLE_CODE = 'user'
const SUPER_ADMIN_ROLE_CODE = 'super_admin'

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepository) private readonly userRepo: UserRepository,
    @Inject(MembershipService) private readonly membershipService: MembershipService,
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService
  ) {}

  async create(data: CreateUserDto): Promise<UserListItemResponse> {
    const hashedPassword = await argon2.hash(data.password)
    const created = await this.userRepo.create({
      username: data.username,
      email: data.email,
      phoneNumber: data.phoneNumber,
      nickname: data.nickname,
      password: hashedPassword
    })

    await this.userRepo.ensureDomainData(created.id)
    await this.membershipService.ensureDefaultMembership(created.id)
    await this.assignRoleByCode(created.id, DEFAULT_ROLE_CODE)
    return this.getUserListItemByUserId(created.id)
  }

  findOne(where: Prisma.UserWhereUniqueInput) {
    return this.userRepo.findUnique(where)
  }

  async getUserInfoByUserId(userId: string): Promise<UserInfoResponse> {
    await this.userRepo.ensureDomainData(userId)

    const user = await this.userRepo.findActiveWithDomainById(userId)
    if (!user) throw new NotFoundException('用户不存在')

    return toUserInfoResponse(user)
  }

  async updateMe(
    userId: string,
    data: {
      nickname?: string
      phoneNumber?: string | null
      bio?: string | null
      avatar?: string | null
      preferences?: {
        theme?: 'light' | 'dark' | 'system'
        notifyByEmail?: boolean
        notifyByPush?: boolean
        notifyBySms?: boolean
      }
    }
  ): Promise<UserInfoResponse> {
    const existing = await this.userRepo.findActiveWithDomainById(userId)
    if (!existing) throw new NotFoundException('用户不存在')

    const themeMap = {
      light: 'LIGHT',
      dark: 'DARK',
      system: 'SYSTEM'
    } as const

    await this.userRepo.update(
      { id: userId },
      {
        ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
        profile: {
          upsert: {
            create: {
              remark: data.bio ?? null,
              avatar: data.avatar ?? null
            },
            update: {
              ...(data.bio !== undefined ? { remark: data.bio } : {}),
              ...(data.avatar !== undefined ? { avatar: data.avatar } : {})
            }
          }
        },
        ...(data.preferences
          ? {
              preference: {
                upsert: {
                  create: {
                    theme: data.preferences.theme ? themeMap[data.preferences.theme] : 'SYSTEM',
                    notifyByEmail: data.preferences.notifyByEmail ?? true,
                    notifyByPush: data.preferences.notifyByPush ?? true,
                    notifyBySms: data.preferences.notifyBySms ?? false
                  },
                  update: {
                    ...(data.preferences.theme ? { theme: themeMap[data.preferences.theme] } : {}),
                    ...(data.preferences.notifyByEmail !== undefined
                      ? { notifyByEmail: data.preferences.notifyByEmail }
                      : {}),
                    ...(data.preferences.notifyByPush !== undefined
                      ? { notifyByPush: data.preferences.notifyByPush }
                      : {}),
                    ...(data.preferences.notifyBySms !== undefined
                      ? { notifyBySms: data.preferences.notifyBySms }
                      : {})
                  }
                }
              }
            }
          : {})
      }
    )

    await this.auditService.write({
      action: 'auth.profile.updated',
      resource: 'user',
      resourceId: userId,
      actorId: userId,
      diff: data
    })

    return this.getUserInfoByUserId(userId)
  }

  private async getUserListItemByUserId(userId: string): Promise<UserListItemResponse> {
    await this.userRepo.ensureDomainData(userId)

    const user = await this.userRepo.findActiveWithDomainById(userId)
    if (!user) throw new NotFoundException('用户不存在')

    return toUserListItemResponse(user)
  }

  async update(id: string, data: UpdateUserDto): Promise<UserListItemResponse> {
    const existingUser = await this.userRepo.findActiveWithDomainById(id)
    if (!existingUser) {
      throw new NotFoundException('用户不存在')
    }

    const { password, ...rest } = data
    const nextData: Prisma.UserUpdateInput = { ...rest }

    const maybeStatus = (data as { status?: UserStatus }).status
    if (typeof maybeStatus === 'string') {
      nextData.status = toUserStatusCode(maybeStatus)
    }

    if (typeof password === 'string') {
      nextData.password = await argon2.hash(password)
    }

    const updated = await this.userRepo.update({ id }, nextData)
    await this.userRepo.ensureDomainData(updated.id)
    return this.getUserListItemByUserId(updated.id)
  }

  /** 供内部（AuthService）使用，更新登录安全相关字段 */
  updateSecurityFields(id: string, data: Prisma.UserUpdateInput) {
    return this.userRepo.update({ id }, data)
  }

  async findAll(query?: FindUsersQueryDto, auth?: AuthContext): Promise<UserListResponse> {
    const hasPage = query?.page !== undefined
    const hasPageSize = query?.pageSize !== undefined
    if (hasPage !== hasPageSize) {
      throw new BadRequestException('page 和 pageSize 必须同时传入')
    }

    const { keyword, status, role, page, pageSize, sortBy, sortOrder } = findUsersQuerySchema.parse(
      query ?? {}
    )
    const where = this.buildFindUsersWhere(
      {
        keyword,
        status: toArray(status),
        role: toArray(role)
      },
      auth
    )
    const orderBy = buildUsersOrderBy(sortBy, sortOrder)

    if (hasPage && hasPageSize) {
      const { items, pagination } = await paginate({
        page: page!,
        pageSize: pageSize!,
        count: () => this.userRepo.count(where),
        findMany: ({ skip, take }) => this.userRepo.findManyWithDomain(where, skip, take, orderBy)
      })

      return { items: items.map(toUserListItemResponse), pagination }
    }

    const items = await this.userRepo.findManyWithDomain(where, undefined, undefined, orderBy)
    const total = items.length
    return {
      items: items.map(toUserListItemResponse),
      pagination: buildPaginationMeta(1, total, total)
    }
  }

  async remove(idsInput: string[], currentUserId?: string): Promise<UserListItemResponse[]> {
    const rawIds = Array.isArray(idsInput) ? idsInput : []
    const ids = [
      ...new Set(
        rawIds
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ]
    if (ids.length === 0) {
      throw new BadRequestException('至少需要一个有效的用户 ID')
    }
    if (currentUserId && ids.includes(currentUserId)) {
      throw new BadRequestException('不能删除当前登录用户')
    }

    const users = await this.userRepo.findManyWithDomainByIds(ids)
    if (users.length !== ids.length) {
      throw new NotFoundException('部分用户不存在')
    }

    await this.userRepo.softDeleteByIds(ids)
    return users.map(toUserListItemResponse)
  }

  async hardRemove(ids: string[], currentUserId?: string): Promise<UserListItemResponse[]> {
    const normalizedIds = [
      ...new Set(
        ids
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ]
    if (normalizedIds.length === 0) {
      throw new BadRequestException('至少需要一个有效的用户 ID')
    }
    if (currentUserId && normalizedIds.includes(currentUserId)) {
      throw new BadRequestException('不能删除当前登录用户')
    }

    const users = await this.userRepo.findManyWithDomainByIdsAny(normalizedIds)
    if (users.length !== normalizedIds.length) {
      throw new NotFoundException('部分用户不存在')
    }

    await this.userRepo.deleteManyByIds(normalizedIds)
    return users.map(toUserListItemResponse)
  }

  async restore(ids: string[]): Promise<UserListItemResponse[]> {
    const normalizedIds = [
      ...new Set(
        ids
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ]
    if (normalizedIds.length === 0) {
      throw new BadRequestException('至少需要一个有效的用户 ID')
    }

    const users = await this.userRepo.findManyWithDomainByIdsAny(normalizedIds)
    if (users.length !== normalizedIds.length) {
      throw new NotFoundException('部分用户不存在')
    }

    const deletedUsers = users.filter((user) => user.deletedAt !== null)
    if (deletedUsers.length === 0) {
      throw new BadRequestException('未找到可恢复的已删除用户')
    }

    await this.userRepo.restoreByIds(normalizedIds)
    return deletedUsers.map(toUserListItemResponse)
  }

  async updateStatus(payload: UpdateUsersStatusDto): Promise<UserListItemResponse[]> {
    const rawIds = Array.isArray(payload.ids) ? payload.ids : []
    const normalizedIds = [
      ...new Set(
        rawIds
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    ]
    if (normalizedIds.length === 0) {
      throw new BadRequestException('至少需要一个有效的用户 ID')
    }

    const users = await this.userRepo.findManyWithDomainByIds(normalizedIds)
    if (users.length !== normalizedIds.length) {
      throw new NotFoundException('部分用户不存在')
    }

    await this.userRepo.updateStatusByIds(normalizedIds, toUserStatusCode(payload.status))
    const updatedUsers = await this.userRepo.findManyWithDomainByIds(normalizedIds)
    return updatedUsers.map(toUserListItemResponse)
  }

  async ensureUserDomainData(userId: string) {
    return this.userRepo.ensureDomainData(userId)
  }

  async touchLoginAudit(userId: string, loginIp?: string) {
    await this.userRepo.ensureDomainData(userId)
    return this.userRepo.touchLoginAudit(userId, loginIp)
  }

  async unlock(id: string): Promise<UserListItemResponse> {
    const existing = await this.userRepo.findActiveWithDomainById(id)
    if (!existing) throw new NotFoundException('用户不存在')

    await this.userRepo.update({ id }, { isLocked: false, loginAttempts: 0, lockExpireAt: null })
    await this.auditService.write({
      action: 'system.user.unlocked',
      resource: 'user',
      resourceId: id
    })
    return this.getUserListItemByUserId(id)
  }

  async adminResetPassword(
    id: string,
    password: string,
    mustChangePassword = true
  ): Promise<UserListItemResponse> {
    const existing = await this.userRepo.findActiveWithDomainById(id)
    if (!existing) throw new NotFoundException('用户不存在')

    const hashed = await argon2.hash(password)
    await this.userRepo.update({ id }, { password: hashed })
    await this.userRepo.ensureDomainData(id)
    await this.userRepo.updateSecurity(id, {
      mustChangePassword,
      lastPasswordChange: new Date(),
      passwordExpireAt: null
    })
    await this.sessionService.revokeAllForUser(id)
    await this.auditService.write({
      action: 'system.user.password_reset',
      resource: 'user',
      resourceId: id,
      diff: { mustChangePassword }
    })
    return this.getUserListItemByUserId(id)
  }

  async assignRoleByCode(userId: string, roleCode: string) {
    const role = await this.userRepo.findRoleByCode(roleCode)
    if (!role) return
    await this.userRepo.upsertUserRole(userId, role.id)
  }

  async assignRoles(userId: string, payload: AssignUserRolesDto): Promise<UserInfoResponse> {
    const existing = await this.userRepo.findActiveWithDomainById(userId)
    if (!existing) throw new NotFoundException('用户不存在')

    const roleIds = [
      ...new Set(payload.roleIds.map((id) => id.trim()).filter((id): id is string => id.length > 0))
    ]
    if (roleIds.length === 0) {
      throw new BadRequestException('至少需要一个角色')
    }

    const roles = await this.userRepo.findRolesByIds(roleIds)
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('部分角色不存在或已禁用')
    }

    const currentCodes = existing.roles.map((item) => item.role.code)
    const nextCodes = roles.map((role) => role.code)
    const removingSuperAdmin =
      currentCodes.includes(SUPER_ADMIN_ROLE_CODE) && !nextCodes.includes(SUPER_ADMIN_ROLE_CODE)
    if (removingSuperAdmin) {
      const otherSuperAdmins = await this.userRepo.countActiveSuperAdminsExcluding(userId)
      if (otherSuperAdmins === 0) {
        throw new BadRequestException('系统至少需要保留一名超级管理员')
      }
    }

    await this.userRepo.replaceUserRoles(userId, roleIds)
    await this.auditService.write({
      action: 'system.user.roles_assigned',
      resource: 'user',
      resourceId: userId,
      diff: { roleIds, roleCodes: nextCodes }
    })
    await this.authContextService.bumpPermVer()
    await this.sessionService.revokeAllForUser(userId)

    return this.getUserInfoByUserId(userId)
  }

  async replaceOrganizations(
    userId: string,
    payload: ReplaceUserOrganizationsDto
  ): Promise<UserInfoResponse> {
    const existing = await this.userRepo.findActiveWithDomainById(userId)
    if (!existing) throw new NotFoundException('用户不存在')

    const organizations = payload.organizations.map((item) => ({
      organizationId: item.organizationId.trim(),
      isPrimary: item.isPrimary ?? false,
      postId: item.postId ?? null
    }))

    if (organizations.length > 0) {
      const orgIds = [...new Set(organizations.map((item) => item.organizationId))]
      const orgs = await this.userRepo.findOrganizationsByIds(orgIds)
      if (orgs.length !== orgIds.length) {
        throw new BadRequestException('部分组织不存在')
      }

      const primaryCount = organizations.filter((item) => item.isPrimary).length
      if (primaryCount > 1) {
        throw new BadRequestException('主职组织最多只能有一个')
      }
      if (primaryCount === 0 && organizations.length > 0) {
        organizations[0].isPrimary = true
      }

      const postIds = [
        ...new Set(
          organizations
            .map((item) => item.postId)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      ]
      if (postIds.length > 0) {
        const posts = await this.userRepo.findPostsByIds(postIds)
        if (posts.length !== postIds.length) {
          throw new BadRequestException('部分岗位不存在')
        }
        const postOrgMap = new Map(posts.map((post) => [post.id, post.organizationId]))
        for (const item of organizations) {
          if (!item.postId) continue
          if (postOrgMap.get(item.postId) !== item.organizationId) {
            throw new BadRequestException('岗位不属于对应组织')
          }
        }
      }
    }

    await this.userRepo.replaceUserOrganizations(userId, organizations)
    await this.auditService.write({
      action: 'system.user.organizations_replaced',
      resource: 'user',
      resourceId: userId,
      diff: { organizations }
    })
    await this.authContextService.bumpPermVer()
    await this.sessionService.revokeAllForUser(userId)

    return this.getUserInfoByUserId(userId)
  }

  private buildFindUsersWhere(
    params: {
      keyword?: string
      status?: UserStatus[]
      role?: string[]
    },
    auth?: AuthContext
  ): Prisma.UserWhereInput {
    const { keyword, status, role } = params
    const conditions: Prisma.UserWhereInput[] = []

    if (keyword) {
      const mode = 'insensitive' as const
      conditions.push({
        OR: [
          { email: { contains: keyword, mode } },
          { username: { contains: keyword, mode } },
          { nickname: { contains: keyword, mode } },
          { phoneNumber: { contains: keyword, mode } }
        ]
      })
    }

    if (status && status.length > 0) {
      conditions.push({ status: { in: status.map(toUserStatusCode) } })
    }

    if (role && role.length > 0) {
      conditions.push({ roles: { some: { role: { code: { in: role } } } } })
    }

    conditions.push({ deletedAt: null })

    if (auth) {
      conditions.push(applyUserListDataScope(auth) as Prisma.UserWhereInput)
    }

    if (conditions.length === 0) return {}
    if (conditions.length === 1) return conditions[0]
    return { AND: conditions }
  }
}

const USER_STATUS_CODE_MAP: Record<UserStatus, UserStatusCode> = {
  active: UserStatusCode.ACTIVE,
  inactive: UserStatusCode.INACTIVE,
  pending: UserStatusCode.PENDING,
  suspended: UserStatusCode.SUSPENDED
}

function toUserStatusCode(status: UserStatus): UserStatusCode {
  return USER_STATUS_CODE_MAP[status]
}

const USERS_SORT_FIELD_MAP: Record<UsersSortBy, Prisma.UserOrderByWithRelationInput> = {
  username: { username: 'asc' },
  email: { email: 'asc' },
  jobTitle: { profile: { jobTitle: 'asc' } },
  createdAt: { createdAt: 'asc' }
}

function buildUsersOrderBy(
  sortBy?: UsersSortBy,
  sortOrder?: UsersSortOrder
): Prisma.UserOrderByWithRelationInput {
  if (!sortBy) return { createdAt: 'desc' }
  const direction = sortOrder ?? 'asc'
  const base = USERS_SORT_FIELD_MAP[sortBy]

  if ('profile' in base) {
    return { profile: { jobTitle: direction } }
  }

  if ('username' in base) {
    return { username: direction }
  }

  if ('email' in base) {
    return { email: direction }
  }

  return { createdAt: direction }
}
