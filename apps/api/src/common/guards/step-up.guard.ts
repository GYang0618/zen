import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { AGENT_HITL_STEP_UP_WINDOW_MS } from '@zen/shared'

import { REQUIRE_STEP_UP_KEY } from '@/common/decorators/require-step-up.decorator'
import { CONFIG_NAMESPACES } from '@/config'
import { PrismaService } from '@/infra/prisma'

import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { Request } from 'express'
import type { AuthConfig } from '@/config'

export type StepUpPayload = {
  sub: string
  typ: 'step-up'
  purpose: string
}

type StepUpRequest = Request & {
  user?: { sub?: string }
  auth?: AuthContext
}

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(CONFIG_NAMESPACES.AUTH) private readonly authCfg: AuthConfig,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_STEP_UP_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!required) return true

    const request = context.switchToHttp().getRequest<StepUpRequest>()
    const token = request.header('x-step-up-token')
    if (token) return this.verifyStepUpToken(token, request.user?.sub)
    if (await this.hasRecentApprovedHitl(request.auth)) return true
    throw new ForbiddenException('需要二次确认')
  }

  private async verifyStepUpToken(token: string, userId: string | undefined): Promise<true> {
    try {
      const payload = await this.jwtService.verifyAsync<StepUpPayload>(token, {
        secret: this.authCfg.secret
      })
      if (payload.typ !== 'step-up' || payload.sub !== userId) {
        throw new ForbiddenException('二次确认令牌无效')
      }
      return true
    } catch (error) {
      if (error instanceof ForbiddenException) throw error
      throw new ForbiddenException('二次确认令牌无效或已过期')
    }
  }

  /**
   * 对话 HITL「确认执行」与页面输入密码是同一道人在场门槛。
   * 审批恢复时 CopilotKit 常不回传原 runId，不能靠幂等键对齐 Run，因此按当前用户最近一次通过记录放行。
   */
  private async hasRecentApprovedHitl(auth: AuthContext | undefined): Promise<boolean> {
    if (!auth) return false
    const approval = await this.prisma.agentApproval.findFirst({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        status: 'approved',
        decidedAt: { gte: new Date(Date.now() - AGENT_HITL_STEP_UP_WINDOW_MS) }
      },
      select: { id: true }
    })
    return Boolean(approval)
  }
}
