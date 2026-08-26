import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMyProfileSchema
} from '@zen/shared'

import { AllowAuthenticated } from '@/common/decorators/allow-authenticated.decorator'
import { Public } from '@/common/decorators/public.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { CONFIG_NAMESPACES } from '@/config'

import { AuthService } from './auth.service'
import { AuthTokenService } from './auth.token.service'
import { durationToSeconds, REFRESH_TOKEN_COOKIE_NAME } from './auth-cookie'
import { loginSchema } from './dto/login.dto'
import { registerSchema } from './dto/register.dto'

import type { ChangePassword, ForgotPassword, ResetPassword, UpdateMyProfile } from '@zen/shared'
import type { Request, Response } from 'express'
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface'
import type { AppConfig, AuthConfig } from '@/config'
import type { UserInfoResponse } from '@/modules/user/responses/user.response'
import type { JwtTokenPayload } from './auth.token.service'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { LoginResponse, RefreshResponse, RegisterResponse } from './responses/auth.response'

@AllowAuthenticated()
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(AuthTokenService) private readonly tokenService: AuthTokenService,
    @Inject(CONFIG_NAMESPACES.APP)
    private readonly appCfg: AppConfig,
    @Inject(CONFIG_NAMESPACES.AUTH)
    private readonly authCfg: AuthConfig
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) reply: Response
  ): Promise<RegisterResponse> {
    const { session, refreshToken } = await this.authService.register(
      registerDto,
      this.requestMeta(request)
    )
    await this.persistRefreshToken(reply, session.user.id, refreshToken, request)
    return session
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) reply: Response
  ): Promise<LoginResponse | { requiresMfa: true; mfaToken: string }> {
    const result = await this.authService.login(loginDto, this.requestMeta(request))
    if ('requiresMfa' in result) return result
    const { session, refreshToken } = result
    await this.persistRefreshToken(reply, session.user.id, refreshToken, request)
    return session
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Body() body: { mfaToken: string; code: string },
    @Req() request: Request,
    @Res({ passthrough: true }) reply: Response
  ): Promise<LoginResponse> {
    const { session, refreshToken } = await this.authService.verifyMfaLogin(
      body.mfaToken,
      body.code,
      this.requestMeta(request)
    )
    await this.persistRefreshToken(reply, session.user.id, refreshToken, request)
    return session
  }

  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  setupMfa(@Req() request: Request) {
    return this.authService.setupMfa(this.requireUserId(request))
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.NO_CONTENT)
  async enableMfa(@Req() request: Request, @Body() body: { code: string }): Promise<void> {
    await this.authService.enableMfa(this.requireUserId(request), body.code)
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disableMfa(@Req() request: Request, @Body() body: { code: string }): Promise<void> {
    await this.authService.disableMfa(this.requireUserId(request), body.code)
  }

  @Post('step-up')
  @HttpCode(HttpStatus.OK)
  stepUp(@Req() request: Request, @Body() body: { password?: string; mfaCode?: string }) {
    return this.authService.createStepUpToken(this.requireUserId(request), body)
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  forgotPassword(@Body() body: ForgotPassword) {
    return this.authService.forgotPassword(body.email)
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() body: ResetPassword): Promise<void> {
    await this.authService.resetPassword(body.token, body.password)
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ZodValidationPipe(changePasswordSchema))
  async changePassword(@Req() request: Request, @Body() body: ChangePassword): Promise<void> {
    const userId = this.requireUserId(request)
    await this.authService.changePassword(userId, body.newPassword, body.currentPassword)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) reply: Response
  ): Promise<RefreshResponse> {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
    if (!refreshToken) throw new UnauthorizedException('缺少刷新令牌')

    let payload: JwtTokenPayload
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken)
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期')
    }

    await this.authService.assertRefreshTokenValid(payload.sub, refreshToken)

    const { session, refreshToken: nextRefreshToken } = await this.authService.refresh(payload.sub)
    await this.rotateRefreshToken(reply, payload.sub, refreshToken, nextRefreshToken, request)
    return session
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) reply: Response
  ): Promise<void> {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
    if (refreshToken) {
      try {
        const payload = await this.tokenService.verifyRefreshToken(refreshToken)
        await this.authService.logout(payload.sub, refreshToken)
      } catch {
        // ignore
      }
    }

    this.clearRefreshToken(reply)
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() request: Request): Promise<UserInfoResponse> {
    const user = (request as unknown as { user?: JwtPayload }).user
    if (!user?.sub) throw new UnauthorizedException('缺少认证信息')
    return this.authService.getMe(user.sub)
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateMyProfileSchema))
  async updateMe(
    @Req() request: Request,
    @Body() body: UpdateMyProfile
  ): Promise<UserInfoResponse> {
    const userId = this.requireUserId(request)
    return this.authService.updateMe(userId, body)
  }

  private requestMeta(request: Request) {
    return {
      ip: request.ip,
      userAgent: request.get('user-agent') ?? undefined
    }
  }

  private requireUserId(request: Request): string {
    const user = (request as unknown as { user?: JwtPayload }).user
    if (!user?.sub) throw new UnauthorizedException('缺少认证信息')
    return user.sub
  }

  private clearRefreshToken(reply: Response) {
    reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      path: this.cookiePath,
      sameSite: 'strict',
      secure: this.appCfg.isProd,
      httpOnly: true
    })
  }

  private async persistRefreshToken(
    reply: Response,
    userId: string,
    refreshToken: string,
    request: Request
  ) {
    const maxAgeSeconds = durationToSeconds(this.authCfg.refreshExpiresIn)
    const refreshTokenExpiresAt = new Date(Date.now() + maxAgeSeconds * 1000)
    await this.authService.createRefreshSession(userId, refreshToken, refreshTokenExpiresAt, {
      ip: request.ip,
      userAgent: request.get('user-agent') ?? undefined
    })

    this.writeRefreshCookie(reply, refreshToken, refreshTokenExpiresAt)
  }

  private async rotateRefreshToken(
    reply: Response,
    userId: string,
    previousRefreshToken: string,
    nextRefreshToken: string,
    request: Request
  ) {
    const maxAgeSeconds = durationToSeconds(this.authCfg.refreshExpiresIn)
    const refreshTokenExpiresAt = new Date(Date.now() + maxAgeSeconds * 1000)
    await this.authService.rotateRefreshSession(
      userId,
      previousRefreshToken,
      nextRefreshToken,
      refreshTokenExpiresAt,
      {
        ip: request.ip,
        userAgent: request.get('user-agent') ?? undefined
      }
    )

    this.writeRefreshCookie(reply, nextRefreshToken, refreshTokenExpiresAt)
  }

  private writeRefreshCookie(reply: Response, refreshToken: string, expiresAt: Date) {
    reply.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      path: this.cookiePath,
      httpOnly: true,
      secure: this.appCfg.isProd,
      sameSite: 'strict',
      expires: expiresAt
    })
  }

  private get cookiePath() {
    const prefix = this.appCfg.apiPrefix.endsWith('/')
      ? this.appCfg.apiPrefix.slice(0, -1)
      : this.appCfg.apiPrefix
    return `${prefix}/auth`
  }
}
