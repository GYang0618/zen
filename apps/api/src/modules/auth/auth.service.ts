import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import argon2 from 'argon2'

import { CONFIG_NAMESPACES } from '@/config'

import { UserService } from '../user/user.service'

import type { User } from '@prisma/client'
import type { AuthConfig } from '@/config'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { LoginResponse, RegisterResponse } from './responses/auth.response'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(CONFIG_NAMESPACES.AUTH)
    private readonly authCfg: AuthConfig
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existingEmail = await this.userService.findOne({ email: dto.email })
    if (existingEmail) {
      throw new BadRequestException('邮箱已存在')
    }

    const existingUsername = await this.userService.findOne({ username: dto.username })
    if (existingUsername) {
      throw new BadRequestException('用户名已存在')
    }

    const user = await this.userService.create({
      username: dto.username,
      email: dto.email,
      password: dto.password
    })

    const rawUser = await this.userService.findOne({ id: user.id })
    if (!rawUser) {
      throw new UnauthorizedException('注册失败，请稍后重试')
    }

    await this.userService.touchLoginAudit(rawUser.id)
    const userInfo = await this.userService.getUserInfoByUserId(rawUser.id)
    const tokens = this.generateTokens(rawUser)
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: rawUser.id,
        username: rawUser.username,
        email: rawUser.email,
        nickname: rawUser.nickname,
        phone: rawUser.phone
      },
      userInfo
    }
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.userService.findOne({ email: dto.email })
    if (!user) {
      throw new UnauthorizedException('账号或密码错误')
    }

    await this.checkLock(user)

    const isPasswordValid = await argon2.verify(user.password, dto.password)
    if (!isPasswordValid) {
      await this.handleLoginFailure(user)
    }

    if (user.loginAttempts > 0) {
      await this.userService.update({
        where: { id: user.id },
        data: { loginAttempts: 0, isLocked: false, lockExpireAt: null }
      })
    }

    if (user.status !== 1) {
      throw new ForbiddenException('账号已被禁用')
    }

    await this.userService.touchLoginAudit(user.id)
    const userInfo = await this.userService.getUserInfoByUserId(user.id)
    const tokens = this.generateTokens(user)
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        phone: user.phone
      },
      userInfo
    }
  }

  private async checkLock(user: User) {
    if (user.isLocked) {
      if (user.lockExpireAt && user.lockExpireAt > new Date()) {
        throw new ForbiddenException('账号已锁定，请稍后再试')
      }
      await this.userService.update({
        where: { id: user.id },
        data: { isLocked: false, loginAttempts: 0, lockExpireAt: null }
      })
    }
  }

  private async handleLoginFailure(user: User) {
    const attempts = user.loginAttempts + 1
    if (attempts >= 5) {
      const lockExpireAt = new Date()
      lockExpireAt.setMinutes(lockExpireAt.getMinutes() + 15)
      await this.userService.update({
        where: { id: user.id },
        data: { isLocked: true, loginAttempts: attempts, lockExpireAt }
      })
      throw new ForbiddenException('失败次数过多，账号已被锁定')
    }
    await this.userService.update({
      where: { id: user.id },
      data: { loginAttempts: attempts }
    })
    throw new UnauthorizedException('账号或密码错误')
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email }
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.authCfg.expiresIn as never
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.authCfg.refreshExpiresIn as never
      })
    }
  }
}
