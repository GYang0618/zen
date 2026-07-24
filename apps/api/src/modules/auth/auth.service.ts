import { randomBytes } from 'node:crypto'

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { UserStatusCode } from '@prisma/client'
import argon2 from 'argon2'

import { AuthContextService } from '@/common/auth/auth-context.service'
import { MembershipService } from '@/common/auth/membership.service'
import { SessionService } from '@/common/auth/session.service'
import { PrismaService } from '@/infra/prisma'

import { UserService } from '../user/user.service'
import { AuthTokenService } from './auth.token.service'

import type { User } from '@prisma/client'
import type { UserListItemResponse } from '../user/responses/user.response'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { AuthSessionResponse } from './responses/auth.response'

const REFRESH_TOKEN_HASH_PREFIX = 'refresh:'
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30

export interface IssueSessionResult {
  session: AuthSessionResponse
  refreshToken: string
}

export interface RefreshSessionMeta {
  ip?: string
  userAgent?: string
}

export interface LoginMeta extends RefreshSessionMeta {
  identifier: string
}

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(AuthTokenService) private readonly tokenService: AuthTokenService,
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(MembershipService) private readonly membershipService: MembershipService,
    @Inject(AuthContextService) private readonly authContextService: AuthContextService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async register(dto: RegisterDto, meta: RefreshSessionMeta = {}): Promise<IssueSessionResult> {
    await this.assertEmailNotTaken(dto.email)
    await this.assertUsernameNotTaken(dto.username)

    const createdUser = await this.userService.create(dto)
    await this.membershipService.ensureDefaultMembership(createdUser.id)
    await this.userService.touchLoginAudit(createdUser.id, meta.ip)
    await this.recordLoginEvent({
      userId: createdUser.id,
      identifier: dto.email,
      success: true,
      ip: meta.ip,
      userAgent: meta.userAgent
    })

    return await this.issueSessionFromListItem(createdUser)
  }

  async login(
    dto: LoginDto,
    meta: RefreshSessionMeta = {}
  ): Promise<IssueSessionResult | { requiresMfa: true; mfaToken: string }> {
    const user = await this.findUserByIdentifier(dto.identifier)
    if (!user) {
      await this.recordLoginEvent({
        identifier: dto.identifier,
        success: false,
        ip: meta.ip,
        userAgent: meta.userAgent,
        reason: 'user_not_found'
      })
      throw new UnauthorizedException('账号或密码错误')
    }

    try {
      await this.releaseLockIfExpired(user)
      await this.verifyPassword(user, dto.password)
      await this.resetLoginAttempts(user)
      await this.assertAccountActive(user)
    } catch (error) {
      await this.recordLoginEvent({
        userId: user.id,
        identifier: dto.identifier,
        success: false,
        ip: meta.ip,
        userAgent: meta.userAgent,
        reason: error instanceof Error ? error.message : 'login_failed'
      })
      throw error
    }

    await this.userService.ensureUserDomainData(user.id)
    const security = await this.prisma.userSecurity.findUnique({ where: { userId: user.id } })
    if (security?.mfaEnabled && security.mfaSecret) {
      return {
        requiresMfa: true,
        mfaToken: this.tokenService.signMfaChallenge(user.id, user.email)
      }
    }

    await this.membershipService.ensureDefaultMembership(user.id)
    await this.userService.touchLoginAudit(user.id, meta.ip)
    await this.recordLoginEvent({
      userId: user.id,
      identifier: dto.identifier,
      success: true,
      ip: meta.ip,
      userAgent: meta.userAgent
    })
    const userInfo = await this.userService.getUserInfoByUserId(user.id)
    const mustChangePassword = await this.resolveMustChangePassword(user.id)

    return await this.issueSession(user.id, userInfo, mustChangePassword)
  }

  async verifyMfaLogin(
    mfaToken: string,
    code: string,
    meta: RefreshSessionMeta = {}
  ): Promise<IssueSessionResult> {
    let payload: { sub: string; email: string }
    try {
      payload = await this.tokenService.verifyTypedToken(mfaToken, 'mfa')
    } catch {
      throw new UnauthorizedException('MFA 令牌无效或已过期')
    }

    const security = await this.prisma.userSecurity.findUnique({ where: { userId: payload.sub } })
    if (!security?.mfaEnabled || !security.mfaSecret) {
      throw new BadRequestException('未启用 MFA')
    }

    const { authenticator } = await import('otplib')
    const ok = authenticator.verify({ token: code, secret: security.mfaSecret })
    if (!ok) throw new UnauthorizedException('验证码错误')

    await this.membershipService.ensureDefaultMembership(payload.sub)
    await this.userService.touchLoginAudit(payload.sub, meta.ip)
    await this.recordLoginEvent({
      userId: payload.sub,
      identifier: payload.email,
      success: true,
      ip: meta.ip,
      userAgent: meta.userAgent
    })
    const userInfo = await this.userService.getUserInfoByUserId(payload.sub)
    const mustChangePassword = await this.resolveMustChangePassword(payload.sub)
    return await this.issueSession(payload.sub, userInfo, mustChangePassword)
  }

  async setupMfa(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.userService.findOne({ id: userId })
    if (!user) throw new UnauthorizedException('用户不存在')
    const { authenticator } = await import('otplib')
    const secret = authenticator.generateSecret()
    await this.userService.ensureUserDomainData(userId)
    await this.prisma.userSecurity.update({
      where: { userId },
      data: { mfaSecret: secret, mfaEnabled: false, mfaType: 'OFF' }
    })
    const otpauthUrl = authenticator.keyuri(user.email, 'Zen Admin', secret)
    return { secret, otpauthUrl }
  }

  async enableMfa(userId: string, code: string): Promise<void> {
    const security = await this.prisma.userSecurity.findUnique({ where: { userId } })
    if (!security?.mfaSecret) throw new BadRequestException('请先获取 MFA 密钥')
    const { authenticator } = await import('otplib')
    const ok = authenticator.verify({ token: code, secret: security.mfaSecret })
    if (!ok) throw new UnauthorizedException('验证码错误')
    await this.prisma.userSecurity.update({
      where: { userId },
      data: { mfaEnabled: true, mfaType: 'TOTP' }
    })
  }

  async disableMfa(userId: string, code: string): Promise<void> {
    const security = await this.prisma.userSecurity.findUnique({ where: { userId } })
    if (!security?.mfaEnabled || !security.mfaSecret) {
      throw new BadRequestException('MFA 未启用')
    }
    const { authenticator } = await import('otplib')
    const ok = authenticator.verify({ token: code, secret: security.mfaSecret })
    if (!ok) throw new UnauthorizedException('验证码错误')
    await this.prisma.userSecurity.update({
      where: { userId },
      data: { mfaEnabled: false, mfaType: 'OFF', mfaSecret: null }
    })
  }

  async createStepUpToken(
    userId: string,
    input: { password?: string; mfaCode?: string }
  ): Promise<{ stepUpToken: string }> {
    const user = await this.userService.findOne({ id: userId })
    if (!user) throw new UnauthorizedException('用户不存在')

    if (input.password) {
      const ok = await argon2.verify(user.password, input.password)
      if (!ok) throw new UnauthorizedException('密码错误')
    } else if (input.mfaCode) {
      const security = await this.prisma.userSecurity.findUnique({ where: { userId } })
      if (!security?.mfaEnabled || !security.mfaSecret) {
        throw new BadRequestException('未启用 MFA，请使用密码确认')
      }
      const { authenticator } = await import('otplib')
      const ok = authenticator.verify({ token: input.mfaCode, secret: security.mfaSecret })
      if (!ok) throw new UnauthorizedException('验证码错误')
    } else {
      throw new BadRequestException('请提供密码或 MFA 验证码')
    }

    return { stepUpToken: this.tokenService.signStepUp(user.id, user.email) }
  }

  async refresh(userId: string): Promise<IssueSessionResult> {
    const user = await this.userService.findOne({ id: userId })
    if (!user) throw new UnauthorizedException('用户不存在')
    await this.assertAccountActive(user)

    const userInfo = await this.userService.getUserInfoByUserId(user.id)
    const mustChangePassword = await this.resolveMustChangePassword(user.id)
    return await this.issueSession(user.id, userInfo, mustChangePassword)
  }

  async logout(userId: string, refreshToken?: string) {
    if (!refreshToken) {
      await this.sessionService.revokeAllForUser(userId)
      return
    }

    const matched = await this.sessionService.findActiveMatching(userId, (hash) =>
      argon2.verify(hash, `${REFRESH_TOKEN_HASH_PREFIX}${refreshToken}`)
    )
    if (matched) {
      await this.sessionService.revokeById(matched.id)
    }
  }

  async getMe(userId: string) {
    return this.userService.getUserInfoByUserId(userId)
  }

  async updateMe(userId: string, data: Parameters<UserService['updateMe']>[1]) {
    return this.userService.updateMe(userId, data)
  }

  listSessions(userId: string) {
    return this.sessionService.listActiveSummariesByUser(userId)
  }

  async resolveCurrentSessionId(userId: string, refreshToken: string | undefined) {
    if (!refreshToken) return null
    const matched = await this.sessionService.findActiveMatching(userId, (hash) =>
      argon2.verify(hash, `${REFRESH_TOKEN_HASH_PREFIX}${refreshToken}`)
    )
    return matched?.id ?? null
  }

  async revokeSession(userId: string, sessionId: string) {
    const ok = await this.sessionService.revokeByIdForUser(userId, sessionId)
    if (!ok) throw new UnauthorizedException('会话不存在或已失效')
  }

  async revokeOtherSessions(userId: string, refreshToken: string | undefined) {
    const currentId = await this.resolveCurrentSessionId(userId, refreshToken)
    if (!currentId) {
      await this.sessionService.revokeAllForUser(userId)
      return
    }
    await this.sessionService.revokeOthersForUser(userId, currentId)
  }

  async revokeSessionsForUsers(userIds: string[]) {
    await Promise.all(userIds.map((id) => this.sessionService.revokeAllForUser(id)))
  }

  /**
   * 忘记密码：生成一次性令牌。无邮件通道时在日志输出，开发环境可回传 token。
   */
  async forgotPassword(email: string): Promise<{ ok: true; resetToken?: string }> {
    const user = await this.userService.findOne({ email: email.trim() })
    if (!user || user.deletedAt) {
      return { ok: true }
    }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = await argon2.hash(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt }
    })

    this.logger.warn(`Password reset token for ${email}: ${rawToken}`)
    const expose = process.env.NODE_ENV !== 'production'
    return expose ? { ok: true, resetToken: rawToken } : { ok: true }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const candidates = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    let matched: (typeof candidates)[number] | null = null
    for (const candidate of candidates) {
      if (await argon2.verify(candidate.tokenHash, token)) {
        matched = candidate
        break
      }
    }
    if (!matched) throw new BadRequestException('重置令牌无效或已过期')

    const hashed = await argon2.hash(password)
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: matched.userId }, data: { password: hashed } }),
      this.prisma.passwordResetToken.update({
        where: { id: matched.id },
        data: { usedAt: new Date() }
      })
    ])
    await this.userService.ensureUserDomainData(matched.userId)
    await this.prisma.userSecurity.update({
      where: { userId: matched.userId },
      data: {
        mustChangePassword: false,
        lastPasswordChange: new Date(),
        passwordExpireAt: null
      }
    })
    await this.sessionService.revokeAllForUser(matched.userId)
  }

  async changePassword(
    userId: string,
    newPassword: string,
    currentPassword?: string
  ): Promise<void> {
    const user = await this.userService.findOne({ id: userId })
    if (!user) throw new UnauthorizedException('用户不存在')

    const mustChange = await this.resolveMustChangePassword(userId)
    if (!mustChange) {
      if (!currentPassword) throw new BadRequestException('请提供当前密码')
      const ok = await argon2.verify(user.password, currentPassword)
      if (!ok) throw new UnauthorizedException('当前密码错误')
    }

    const hashed = await argon2.hash(newPassword)
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } })
    await this.userService.ensureUserDomainData(userId)
    await this.prisma.userSecurity.update({
      where: { userId },
      data: {
        mustChangePassword: false,
        lastPasswordChange: new Date(),
        passwordExpireAt: null
      }
    })
  }

  private async resolveMustChangePassword(userId: string): Promise<boolean> {
    await this.userService.ensureUserDomainData(userId)
    const security = await this.prisma.userSecurity.findUnique({ where: { userId } })
    if (!security) return false
    if (security.mustChangePassword) return true
    if (security.passwordExpireAt && security.passwordExpireAt.getTime() <= Date.now()) {
      return true
    }
    return false
  }

  private async recordLoginEvent(input: {
    userId?: string
    identifier: string
    success: boolean
    ip?: string
    userAgent?: string
    reason?: string
  }) {
    await this.prisma.loginEvent.create({
      data: {
        userId: input.userId,
        identifier: input.identifier,
        success: input.success,
        ip: input.ip,
        userAgent: input.userAgent,
        reason: input.reason
      }
    })
  }

  private async findUserByIdentifier(identifier: string) {
    const normalizedIdentifier = identifier.trim()

    const byEmail = await this.userService.findOne({ email: normalizedIdentifier })
    if (byEmail) return byEmail

    const byUsername = await this.userService.findOne({ username: normalizedIdentifier })
    if (byUsername) return byUsername

    return this.userService.findOne({ phoneNumber: normalizedIdentifier })
  }

  private async issueSession(
    userId: string,
    userInfo: Awaited<ReturnType<UserService['getUserInfoByUserId']>>,
    mustChangePassword = false
  ): Promise<IssueSessionResult> {
    const permVer = await this.authContextService.readPermVer()
    const tokens = this.tokenService.generateTokenPair(userId, userInfo.contact.email, permVer)

    const roles = userInfo.auth.roles
    const permissions = userInfo.auth.permissions

    return {
      refreshToken: tokens.refreshToken,
      session: {
        accessToken: tokens.accessToken,
        mustChangePassword,
        user: {
          id: userInfo.id,
          username: userInfo.profile.username,
          email: userInfo.contact.email,
          nickname: userInfo.profile.nickname ?? null,
          avatar: userInfo.profile.avatar ?? null,
          phoneNumber: userInfo.contact.phoneNumber ?? null,
          role: roles[0] ?? null,
          permissions
        } satisfies AuthSessionResponse['user']
      }
    }
  }

  private async issueSessionFromListItem(user: UserListItemResponse): Promise<IssueSessionResult> {
    const permVer = await this.authContextService.readPermVer()
    const tokens = this.tokenService.generateTokenPair(user.id, user.email, permVer)

    return {
      refreshToken: tokens.refreshToken,
      session: {
        accessToken: tokens.accessToken,
        mustChangePassword: false,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname ?? null,
          avatar: user.avatar ?? null,
          phoneNumber: user.phoneNumber ?? null,
          role: user.role,
          permissions: user.permissions
        } satisfies AuthSessionResponse['user']
      }
    }
  }

  async createRefreshSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    meta: RefreshSessionMeta = {}
  ) {
    const refreshTokenHash = await argon2.hash(`${REFRESH_TOKEN_HASH_PREFIX}${refreshToken}`)
    await this.sessionService.create({
      userId,
      refreshTokenHash,
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent
    })
  }

  async rotateRefreshSession(
    userId: string,
    previousRefreshToken: string,
    nextRefreshToken: string,
    expiresAt: Date,
    meta: RefreshSessionMeta = {}
  ) {
    const previous = await this.sessionService.findActiveMatching(userId, (hash) =>
      argon2.verify(hash, `${REFRESH_TOKEN_HASH_PREFIX}${previousRefreshToken}`)
    )
    if (previous) {
      await this.sessionService.revokeById(previous.id)
    }

    await this.createRefreshSession(userId, nextRefreshToken, expiresAt, meta)
  }

  async assertRefreshTokenValid(userId: string, refreshToken: string) {
    const matched = await this.sessionService.findActiveMatching(userId, (hash) =>
      argon2.verify(hash, `${REFRESH_TOKEN_HASH_PREFIX}${refreshToken}`)
    )
    if (!matched) {
      throw new UnauthorizedException('刷新令牌无效或已过期')
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
      await this.userService.updateSecurityFields(user.id, {
        isLocked: true,
        loginAttempts: attempts,
        lockExpireAt
      })
      throw new ForbiddenException('失败次数过多，账号已被锁定')
    }
    await this.userService.updateSecurityFields(user.id, { loginAttempts: attempts })
    throw new UnauthorizedException('账号或密码错误')
  }

  private async resetLoginAttempts(user: User) {
    if (user.loginAttempts === 0) return
    await this.userService.updateSecurityFields(user.id, {
      loginAttempts: 0,
      isLocked: false,
      lockExpireAt: null
    })
  }

  private assertAccountActive(user: User) {
    if (user.status !== UserStatusCode.ACTIVE) throw new ForbiddenException('账号已被禁用')
  }
}
