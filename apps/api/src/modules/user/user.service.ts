import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Gender, UserStatusCode } from '@prisma/client'

import { toArray } from '@/common'
import { applyUserListDataScope } from '@/common/auth/apply-data-scope'
import { AuditService } from '@/common/auth/audit.service'
import { AuthContextService } from '@/common/auth/auth-context.service'
import { MembershipService } from '@/common/auth/membership.service'
import { SessionService } from '@/common/auth/session.service'
import { buildPaginationMeta, paginate } from '@/common/pagination'
import argon2 from '@/common/utils/argon2'
import { CONFIG_NAMESPACES } from '@/config'
import { durationToSeconds } from '@/modules/auth/auth-cookie'

import { StorageService } from '../storage/storage.service'
import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { generateTemporaryPassword } from './generate-temporary-password'
import {
  toAssignUserRolesResult,
  toBirthdayDate,
  toReplaceUserOrganizationsResult,
  toUpdateUserResult,
  toUserInfoResponse,
  toUserResponse
} from './user.mapper'
import { UserRepository } from './user.repository'

import type { Prisma } from '@prisma/client'
import type { AuthContext, UpdateMyProfile, UserGender } from '@zen/shared'
import type { AuthConfig } from '@/config'
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
  AssignUserRolesResponse,
  CreateUserResponse,
  ReplaceUserOrganizationsResponse,
  UpdateUserResponse,
  UserInfoResponse,
  UserListItemResponse,
  UserListResponse,
  UserResponse
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
    @Inject(AuthContextService) private readonly authContextService: AuthContextService,
    @Inject(CONFIG_NAMESPACES.AUTH) private readonly authCfg: AuthConfig,
    @Inject(StorageService) private readonly storageService: StorageService
  ) {}

  private toUser(user: Parameters<typeof toUserResponse>[0]) {
    return toUserResponse(user, durationToSeconds(this.authCfg.expiresIn) * 1000)
  }

  private async withResolvedAvatar<T extends { avatar: string | null }>(dto: T): Promise<T> {
    return {
      ...dto,
      avatar: await this.storageService.resolveAvatarUrl(dto.avatar)
    }
  }

  private async withResolvedProfileAvatar(dto: UserInfoResponse): Promise<UserInfoResponse> {
    return {
      ...dto,
      profile: {
        ...dto.profile,
        avatar: await this.storageService.resolveAvatarUrl(dto.profile.avatar)
      }
    }
  }

  async create(data: CreateUserDto): Promise<CreateUserResponse> {
    const initialPassword = data.password ?? generateTemporaryPassword()
    const hashedPassword = await argon2.hash(initialPassword)
    const created = await this.userRepo.create({
      username: data.username,
      email: data.email,
      phoneNumber: data.phoneNumber,
      nickname: data.nickname,
      password: hashedPassword,
      profile: {
        create: {
          realName: data.realName ?? null,
          gender: toGenderCode(data.gender),
          remark: data.remark ?? null
        }
      }
    })

    await this.userRepo.ensureDomainData(created.id)
    await this.userRepo.updateSecurity(created.id, { mustChangePassword: true })
    await this.membershipService.ensureDefaultMembership(created.id)

    if (data.roleIds && data.roleIds.length > 0) {
      await this.replaceUserRoles(created.id, data.roleIds, { revokeSessions: false })
    } else {
      await this.assignRoleByCode(created.id, DEFAULT_ROLE_CODE)
    }

    if (data.organizations && data.organizations.length > 0) {
      await this.syncOrganizations(created.id, data.organizations, { revokeSessions: false })
    }

    await this.auditService.write({
      action: 'system.user.created',
      resource: 'user',
      resourceId: created.id,
      diff: { username: data.username, email: data.email, mustChangePassword: true }
    })

    const user = await this.getUserById(created.id)
    return { ...user, initialPassword }
  }

  findOne(where: Prisma.UserWhereUniqueInput) {
    return this.userRepo.findUnique(where)
  }

  async getUserInfoByUserId(userId: string): Promise<UserInfoResponse> {
    await this.userRepo.ensureDomainData(userId)

    const user = await this.userRepo.findActiveWithDomainById(userId)
    if (!user) throw new NotFoundException('用户不存在')

    return this.withResolvedProfileAvatar(toUserInfoResponse(user))
  }

  async getUserById(userId: string): Promise<UserResponse> {
    await this.userRepo.ensureDomainData(userId)

    const user = await this.userRepo.findActiveWithDomainById(userId)
    if (!user) throw new NotFoundException('用户不存在')

    return this.withResolvedAvatar(this.toUser(user))
  }

  async updateMe(userId: string, data: UpdateMyProfile): Promise<UserInfoResponse> {
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
              avatar: data.avatar ?? null,
              birthday: data.birthday !== undefined ? toBirthdayDate(data.birthday) : null
            },
            update: {
              ...(data.bio !== undefined ? { remark: data.bio } : {}),
              ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
              ...(data.birthday !== undefined ? { birthday: toBirthdayDate(data.birthday) } : {})
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
    return this.getUserById(userId)
  }

  async update(id: string, data: UpdateUserDto): Promise<UpdateUserResponse> {
    const existingUser = await this.userRepo.findActiveBasicInfoById(id)
    if (!existingUser) {
      throw new NotFoundException('用户不存在')
    }

    const profileUpdate: Prisma.UserProfileUpdateInput = {
      ...(data.realName !== undefined ? { realName: data.realName } : {}),
      ...(data.gender !== undefined ? { gender: toGenderCode(data.gender) } : {}),
      ...(data.remark !== undefined ? { remark: data.remark } : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar } : {})
    }
    const hasProfileUpdate = Object.keys(profileUpdate).length > 0

    await this.userRepo.update(
      { id },
      {
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
        ...(hasProfileUpdate
          ? {
              profile: {
                upsert: {
                  create: {
                    realName: data.realName ?? null,
                    gender: toGenderCode(data.gender),
                    remark: data.remark ?? null,
                    avatar: data.avatar ?? null
                  },
                  update: profileUpdate
                }
              }
            }
          : {})
      }
    )

    await this.userRepo.ensureDomainData(id)
    await this.auditService.write({
      action: 'system.user.updated',
      resource: 'user',
      resourceId: id,
      diff: data
    })
    const updatedUser = await this.userRepo.findActiveBasicInfoById(id)
    if (!updatedUser) throw new NotFoundException('用户不存在')
    return toUpdateUserResult(updatedUser)
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

    const { keyword, status, role, organizationId, page, pageSize, sortBy, sortOrder } =
      findUsersQuerySchema.parse(query ?? {})
    const where = this.buildFindUsersWhere(
      {
        keyword,
        status: toArray(status),
        role: toArray(role),
        organizationId
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

      return {
        items: await Promise.all(items.map((item) => this.withResolvedAvatar(this.toUser(item)))),
        pagination
      }
    }

    const items = await this.userRepo.findManyWithDomain(where, undefined, undefined, orderBy)
    const total = items.length
    return {
      items: await Promise.all(items.map((item) => this.withResolvedAvatar(this.toUser(item)))),
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
    return users.map((item) => this.toUser(item))
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
    return users.map((item) => this.toUser(item))
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
    return deletedUsers.map((item) => this.toUser(item))
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
    return updatedUsers.map((item) => this.toUser(item))
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

  async revokeSessions(id: string): Promise<UserListItemResponse> {
    const existing = await this.userRepo.findActiveWithDomainById(id)
    if (!existing) throw new NotFoundException('用户不存在')

    await this.sessionService.revokeAllForUser(id)
    await this.auditService.write({
      action: 'system.user.sessions_revoked',
      resource: 'user',
      resourceId: id
    })
    return this.getUserListItemByUserId(id)
  }

  async assignRoleByCode(userId: string, roleCode: string) {
    const role = await this.userRepo.findRoleByCode(roleCode)
    if (!role) return
    await this.userRepo.upsertUserRole(userId, role.id)
  }

  async assignRoles(userId: string, payload: AssignUserRolesDto): Promise<AssignUserRolesResponse> {
    const existing = await this.userRepo.findActiveRolesById(userId)
    if (!existing) throw new NotFoundException('用户不存在')
    await this.replaceUserRoles(userId, payload.roleIds, {
      currentCodes: existing.roles.map((item) => item.role.code),
      revokeSessions: true
    })
    const updatedUser = await this.userRepo.findActiveRolesById(userId)
    if (!updatedUser) throw new NotFoundException('用户不存在')
    return toAssignUserRolesResult(updatedUser)
  }

  async replaceOrganizations(
    userId: string,
    payload: ReplaceUserOrganizationsDto
  ): Promise<ReplaceUserOrganizationsResponse> {
    const existing = await this.userRepo.findActiveOrganizationsById(userId)
    if (!existing) throw new NotFoundException('用户不存在')
    await this.syncOrganizations(userId, payload.organizations, { revokeSessions: true })
    const updatedUser = await this.userRepo.findActiveOrganizationsById(userId)
    if (!updatedUser) throw new NotFoundException('用户不存在')
    return toReplaceUserOrganizationsResult(updatedUser)
  }

  private async replaceUserRoles(
    userId: string,
    roleIdsInput: string[],
    options: { currentCodes?: string[]; revokeSessions: boolean }
  ) {
    const roleIds = [
      ...new Set(roleIdsInput.map((id) => id.trim()).filter((id): id is string => id.length > 0))
    ]
    if (roleIds.length === 0) {
      throw new BadRequestException('至少需要一个角色')
    }

    const roles = await this.userRepo.findRolesByIds(roleIds)
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('部分角色不存在或已禁用')
    }

    const nextCodes = roles.map((role) => role.code)
    const currentCodes = options.currentCodes ?? []
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
    if (options.revokeSessions) {
      await this.sessionService.revokeAllForUser(userId)
    }
  }

  private async syncOrganizations(
    userId: string,
    input: ReplaceUserOrganizationsDto['organizations'],
    options: { revokeSessions: boolean }
  ) {
    const organizations = input.map((item) => ({
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
      if (primaryCount === 0) {
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
    if (options.revokeSessions) {
      await this.sessionService.revokeAllForUser(userId)
    }
  }

  private buildFindUsersWhere(
    params: {
      keyword?: string
      status?: UserStatus[]
      role?: string[]
      organizationId?: string
    },
    auth?: AuthContext
  ): Prisma.UserWhereInput {
    const { keyword, status, role, organizationId } = params
    const conditions: Prisma.UserWhereInput[] = []

    if (keyword) {
      const mode = 'insensitive' as const
      conditions.push({
        OR: [
          { email: { contains: keyword, mode } },
          { username: { contains: keyword, mode } },
          { nickname: { contains: keyword, mode } },
          { phoneNumber: { contains: keyword, mode } },
          { profile: { is: { realName: { contains: keyword, mode } } } }
        ]
      })
    }

    if (status && status.length > 0) {
      conditions.push({ status: { in: status.map(toUserStatusCode) } })
    }

    if (role && role.length > 0) {
      conditions.push({ roles: { some: { role: { code: { in: role } } } } })
    }

    if (organizationId) {
      conditions.push({
        organizations: { some: { organizationId, leftAt: null } }
      })
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

function toGenderCode(gender?: UserGender | null): Gender {
  if (gender === 'male') return Gender.MALE
  if (gender === 'female') return Gender.FEMALE
  return Gender.UNKNOWN
}

function buildUsersOrderBy(
  sortBy?: UsersSortBy,
  sortOrder?: UsersSortOrder
): Prisma.UserOrderByWithRelationInput {
  const direction = sortOrder ?? (sortBy ? 'asc' : 'desc')
  if (sortBy === 'username') return { username: direction }
  if (sortBy === 'email') return { email: direction }
  if (sortBy === 'lastLoginAt') return { audit: { lastLoginAt: direction } }
  if (sortBy === 'lastActiveAt') return { audit: { lastActiveAt: direction } }
  return { createdAt: direction }
}
