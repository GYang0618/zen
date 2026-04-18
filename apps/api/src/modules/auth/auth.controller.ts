import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes
} from '@nestjs/common'

import { Public } from '@/common/decorators/public.decorator'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'
import { type AppConfig, type AuthConfig, CONFIG_NAMESPACES } from '@/config'

import { AuthService } from './auth.service'
import { AuthTokenService, type JwtTokenPayload } from './auth.token.service'
import { durationToSeconds, REFRESH_TOKEN_COOKIE_NAME } from './auth-cookie'
import { loginSchema } from './dto/login.dto'
import { registerSchema } from './dto/register.dto'

import type { FastifyReply, FastifyRequest } from 'fastify'
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface'
import type { UserInfoResponse } from '@/modules/user/responses/user.response'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { LoginResponse, RefreshResponse, RegisterResponse } from './responses/auth.response'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: AuthTokenService,
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
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<RegisterResponse> {
    const { session, refreshToken } = await this.authService.register(registerDto)
    await this.persistRefreshToken(reply, session.user.id, refreshToken)
    return session
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<LoginResponse> {
    const { session, refreshToken } = await this.authService.login(loginDto)
    await this.persistRefreshToken(reply, session.user.id, refreshToken)
    return session
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
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
    await this.persistRefreshToken(reply, session.user.id, nextRefreshToken)
    return session
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply
  ): Promise<void> {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
    if (refreshToken) {
      try {
        const payload = await this.tokenService.verifyRefreshToken(refreshToken)
        await this.authService.logout(payload.sub)
      } catch {
        // ignore
      }
    }

    this.clearRefreshToken(reply)
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() request: FastifyRequest): Promise<UserInfoResponse> {
    const user = (request as unknown as { user?: JwtPayload }).user
    if (!user?.sub) throw new UnauthorizedException('缺少认证信息')
    return this.authService.getMe(user.sub)
  }

  private clearRefreshToken(reply: FastifyReply) {
    reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      path: this.cookiePath,
      sameSite: 'strict',
      secure: this.appCfg.isProd,
      httpOnly: true
    })
  }

  private async persistRefreshToken(reply: FastifyReply, userId: string, refreshToken: string) {
    const maxAgeSeconds = durationToSeconds(this.authCfg.refreshExpiresIn)
    const refreshTokenExpiresAt = new Date(Date.now() + maxAgeSeconds * 1000)
    await this.authService.rotateRefreshToken(userId, refreshToken, refreshTokenExpiresAt)

    reply.setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      path: this.cookiePath,
      httpOnly: true,
      secure: this.appCfg.isProd,
      sameSite: 'strict',
      maxAge: maxAgeSeconds
    })
  }

  private get cookiePath() {
    const prefix = this.appCfg.apiPrefix.endsWith('/')
      ? this.appCfg.apiPrefix.slice(0, -1)
      : this.appCfg.apiPrefix
    return `${prefix}/auth`
  }
}
