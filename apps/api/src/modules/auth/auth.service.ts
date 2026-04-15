import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import argon2 from 'argon2'

import { UserService } from '../user/user.service'
import { AuthTokenService } from './auth.token.service'

import type { User } from '@prisma/client'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { AuthSessionResponse } from './responses/auth.response'
import type { LoginResponse, RegisterResponse } from './responses/auth.response'

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: AuthTokenService
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    await this.assertEmailNotTaken(dto.email)
    await this.assertUsernameNotTaken(dto.username)

    const userInfo = await this.userService.create(dto)
    await this.userService.touchLoginAudit(userInfo.id)

    return this.buildSession(userInfo.id, userInfo.contact!.email, userInfo)
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.userService.findOne({ email: dto.email })
    if (!user) throw new UnauthorizedException('账号或密码错误')

    await this.releaseLockIfExpired(user)
    await this.verifyPassword(user, dto.password)
    await this.resetLoginAttempts(user)
    await this.assertAccountActive(user)

    await this.userService.touchLoginAudit(user.id)
    const userInfo = await this.userService.getUserInfoByUserId(user.id)

    return this.buildSession(user.id, user.email, userInfo)
  }

  private buildSession(
    userId: string,
    email: string,
    userInfo: Awaited<ReturnType<UserService['getUserInfoByUserId']>>
  ): AuthSessionResponse {
    const tokens = this.tokenService.generateTokenPair(userId, email)
    return {
      ...tokens,
      user: {
        id: userInfo.id,
        username: userInfo.profile.username,
        email: userInfo.contact?.email ?? email,
        nickname: userInfo.profile.nickname ?? null,
        phone: userInfo.contact?.phone ?? null
      },
      userInfo
    }
  }

  private async assertEmailNotTaken(email: string) {
    const existing = await this.userService.findOne({ email })
    if (existing) throw new BadRequestException('邮箱已存在')
  }

  private async assertUsernameNotTaken(username: string) {
    const existing = await this.userService.findOne({ username })
    if (existing) throw new BadRequestException('用户名已存在')
  }

  private async releaseLockIfExpired(user: User) {
    if (!user.isLocked) return
    if (user.lockExpireAt && user.lockExpireAt > new Date()) {
      throw new ForbiddenException('账号已锁定，请稍后再试')
    }
    await this.userService.updateSecurityFields(user.id, {
      isLocked: false,
      loginAttempts: 0,
      lockExpireAt: null
    })
  }

  private async verifyPassword(user: User, password: string) {
    const isValid = await argon2.verify(user.password, password)
    if (!isValid) await this.handleLoginFailure(user)
  }

  private async handleLoginFailure(user: User): Promise<never> {
    const attempts = user.loginAttempts + 1
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockExpireAt = new Date()
      lockExpireAt.setMinutes(lockExpireAt.getMinutes() + LOCK_DURATION_MINUTES)
      await this.userService.updateSecurityFields(user.id, { isLocked: true, loginAttempts: attempts, lockExpireAt })
      throw new ForbiddenException('失败次数过多，账号已被锁定')
    }
    await this.userService.updateSecurityFields(user.id, { loginAttempts: attempts })
    throw new UnauthorizedException('账号或密码错误')
  }

  private async resetLoginAttempts(user: User) {
    if (user.loginAttempts === 0) return
    await this.userService.updateSecurityFields(user.id, { loginAttempts: 0, isLocked: false, lockExpireAt: null })
  }

  private assertAccountActive(user: User) {
    if (user.status !== 1) throw new ForbiddenException('账号已被禁用')
  }
}
