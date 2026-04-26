import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, UserStatusCode } from '@prisma/client'
import argon2 from 'argon2'

import { toArray } from '@/common'
import { paginate } from '@/common/pagination'

import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { toUserInfoResponse, toUserListItemResponse } from './user.mapper'
import { UserRepository } from './user.repository'

import type { CreateUserDto } from './dto/create-user.dto'
import type {
  FindUsersQueryDto,
  UserStatus,
  UsersSortBy,
  UsersSortOrder
} from './dto/find-users-query.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UserInfoResponse, UserListResponse } from './responses/user.response'

const DEFAULT_ROLE_CODE = 'guest'

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

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

    const user = await this.userRepo.findUniqueWithDomain({ id: userId })
    if (!user) throw new NotFoundException('用户不存在')

    return toUserInfoResponse(user)
  }

  async update(id: string, data: UpdateUserDto): Promise<UserInfoResponse> {
    const nextData: Prisma.UserUpdateInput = { ...data }
    if (typeof data.password === 'string') {
      nextData.password = await argon2.hash(data.password)
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
    const { keyword, status, role, page, pageSize, sortBy, sortOrder } = findUsersQuerySchema.parse(
      query ?? {}
    )
    const where = this.buildFindUsersWhere({
      keyword,
      status: toArray(status),
      role: toArray(role)
    })
    const orderBy = buildUsersOrderBy(sortBy, sortOrder)

    const { items, pagination } = await paginate({
      page,
      pageSize,
      count: () => this.userRepo.count(where),
      findMany: ({ skip, take }) => this.userRepo.findManyWithDomain(where, skip, take, orderBy)
    })

    return { items: items.map(toUserListItemResponse), pagination }
  }

  async remove(id: string): Promise<UserInfoResponse> {
    const user = await this.userRepo.findUniqueWithDomain({ id })
    if (!user) throw new NotFoundException('用户不存在')

    await this.userRepo.delete({ id })
    return toUserInfoResponse(user)
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
