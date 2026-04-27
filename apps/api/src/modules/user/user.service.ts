import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { UserStatusCode } from '@prisma/client'
import argon2 from 'argon2'

import { toArray } from '@/common'
import { buildPaginationMeta, paginate } from '@/common/pagination'

import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { toUserInfoResponse, toUserListItemResponse } from './user.mapper'
import { UserRepository } from './user.repository'

import type { Prisma } from '@prisma/client'
import type { CreateUserDto } from './dto/create-user.dto'
import type {
  FindUsersQueryDto,
  UserStatus,
  UsersSortBy,
  UsersSortOrder
} from './dto/find-users-query.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UpdateUsersStatusDto } from './dto/update-users-status.dto'
import type { UserInfoResponse, UserListResponse } from './responses/user.response'

const DEFAULT_ROLE_CODE = 'guest'

@Injectable()
export class UserService {
  constructor(@Inject(UserRepository) private readonly userRepo: UserRepository) {}

  async create(data: CreateUserDto): Promise<UserInfoResponse> {
    const hashedPassword = await argon2.hash(data.password)
    const created = await this.userRepo.create({
      username: data.username,
      email: data.email,
      phoneNumber: data.phoneNumber,
      nickname: data.nickname,
      password: hashedPassword
    })

    await this.userRepo.ensureDomainData(created.id)
    await this.assignRoleByCode(created.id, DEFAULT_ROLE_CODE)
    return this.getUserInfoByUserId(created.id)
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

  async update(id: string, data: UpdateUserDto): Promise<UserInfoResponse> {
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
    return this.getUserInfoByUserId(updated.id)
  }

  /** 供内部（AuthService）使用，更新登录安全相关字段 */
  updateSecurityFields(id: string, data: Prisma.UserUpdateInput) {
    return this.userRepo.update({ id }, data)
  }

  /** 供内部（AuthService）使用，写入 refresh token 哈希与过期时间 */
  updateRefreshTokenState(
    id: string,
    data: Pick<Prisma.UserUpdateInput, 'refreshTokenHash' | 'refreshTokenExpiresAt'>
  ) {
    return this.userRepo.update({ id }, data)
  }

  async findAll(query?: FindUsersQueryDto): Promise<UserListResponse> {
    const hasPage = query?.page !== undefined
    const hasPageSize = query?.pageSize !== undefined
    if (hasPage !== hasPageSize) {
      throw new BadRequestException('page 和 pageSize 必须同时传入')
    }

    const { keyword, status, role, page, pageSize, sortBy, sortOrder } = findUsersQuerySchema.parse(
      query ?? {}
    )
    const where = this.buildFindUsersWhere({
      keyword,
      status: toArray(status),
      role: toArray(role)
    })
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

  async remove(idsInput: string[], currentUserId?: string): Promise<UserInfoResponse[]> {
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
    return users.map(toUserInfoResponse)
  }

  async hardRemove(ids: string[], currentUserId?: string): Promise<UserInfoResponse[]> {
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
    return users.map(toUserInfoResponse)
  }

  async restore(ids: string[]): Promise<UserInfoResponse[]> {
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
    return deletedUsers.map(toUserInfoResponse)
  }

  async updateStatus(payload: UpdateUsersStatusDto): Promise<UserInfoResponse[]> {
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
    return updatedUsers.map(toUserInfoResponse)
  }

  async ensureUserDomainData(userId: string) {
    return this.userRepo.ensureDomainData(userId)
  }

  async touchLoginAudit(userId: string, loginIp?: string) {
    await this.userRepo.ensureDomainData(userId)
    return this.userRepo.touchLoginAudit(userId, loginIp)
  }

  async assignRoleByCode(userId: string, roleCode: string) {
    const role = await this.userRepo.findRoleByCode(roleCode)
    if (!role) return
    await this.userRepo.upsertUserRole(userId, role.id)
  }

  private buildFindUsersWhere(params: {
    keyword?: string
    status?: UserStatus[]
    role?: string[]
  }): Prisma.UserWhereInput {
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
