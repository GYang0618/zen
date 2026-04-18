import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import argon2 from 'argon2'

import { findUsersQuerySchema } from './dto/find-users-query.dto'
import { toUserInfoResponse, toUserListItemResponse } from './user.mapper'
import { UserRepository } from './user.repository'

import type { CreateUserDto } from './dto/create-user.dto'
import type { FindUsersQueryDto } from './dto/find-users-query.dto'
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
      phone: data.phone,
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

  findAll(query?: FindUsersQueryDto): Promise<UserListResponse> {
    const { keyword, page, pageSize } = findUsersQuerySchema.parse(query ?? {})
    const where = this.buildKeywordWhere(keyword)
    return this.paginateUsers(where, page, pageSize)
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

  private buildKeywordWhere(keyword?: string): Prisma.UserWhereInput {
    if (!keyword) return {}
    const mode = 'insensitive' as const
    return {
      OR: [
        { email: { contains: keyword, mode } },
        { username: { contains: keyword, mode } },
        { nickname: { contains: keyword, mode } },
        { phone: { contains: keyword, mode } }
      ]
    }
  }

  private async paginateUsers(
    where: Prisma.UserWhereInput,
    page: number,
    pageSize: number
  ): Promise<UserListResponse> {
    const skip = (page - 1) * pageSize
    const [total, users] = await Promise.all([
      this.userRepo.count(where),
      this.userRepo.findManyWithDomain(where, skip, pageSize)
    ])

    return {
      items: users.map(toUserListItemResponse),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    }
  }
}
