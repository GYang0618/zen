import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'

import { CONFIG_NAMESPACES } from '../../config/index.js'
import { PrismaService } from '../../infra/prisma/index.js'
import { REQUIRE_STEP_UP_KEY } from '../decorators/require-step-up.decorator.js'

import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@zen/shared'
import type { Request } from 'express'
import type { AuthConfig } from '../../config/index.js'

export type StepUpPayload = {
  sub: string
  typ: 'step-up'
  purpose: string
  tenantId?: string
  runId?: string
  toolName?: string
  approvalId?: string
  nonce?: string
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
    if (token) return this.verifyStepUpToken(token, request)
    throw new ForbiddenException('需要二次确认')
  }

  private async verifyStepUpToken(token: string, request: StepUpRequest): Promise<true> {
    try {
      const payload = await this.jwtService.verifyAsync<StepUpPayload>(token, {
        secret: this.authCfg.secret
      })
      if (payload.typ !== 'step-up' || payload.sub !== request.user?.sub) {
        throw new ForbiddenException('二次确认令牌无效')
      }
      if (payload.purpose !== 'agent-hitl') return true
      const runId = request.header('x-agent-run-id')
      const toolName = request.header('x-agent-tool-name')
      const approvalId = request.header('x-agent-approval-id')
      if (
        payload.tenantId !== request.auth?.tenantId ||
        payload.runId !== runId ||
        payload.toolName !== toolName ||
        payload.approvalId !== approvalId ||
        !payload.nonce
      )
        throw new ForbiddenException('二次确认令牌无效')
      const consumed = await this.prisma.agentStepUpGrant.updateMany({
        where: {
          nonce: payload.nonce,
          tenantId: request.auth?.tenantId,
          userId: request.user?.sub,
          runId,
          toolName,
          approvalId,
          consumedAt: null,
          expiresAt: { gt: new Date() },
          approval: { status: 'approved' }
        },
        data: { consumedAt: new Date() }
      })
      if (consumed.count !== 1) throw new ForbiddenException('二次确认令牌无效或已使用')
      return true
    } catch (error) {
      if (error instanceof ForbiddenException) throw error
      throw new ForbiddenException('二次确认令牌无效或已过期')
    }
  }
}
