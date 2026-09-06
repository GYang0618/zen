import { Inject, Injectable } from '@nestjs/common'
import { AGENT_HITL_STEP_UP_WINDOW_MS } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'

import type { AgentApprovalStatus } from '@prisma/client'
import type { AuthContext } from '@zen/shared'

@Injectable()
export class DefaultAgentApprovalService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(auth: AuthContext, status?: string) {
    await this.expire(auth)
    return this.prisma.agentApproval.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        ...(status ? { status: status as AgentApprovalStatus } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  }

  recentApproved(auth: AuthContext) {
    return this.prisma.agentApproval
      .findFirst({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: 'approved',
          decidedAt: { gte: new Date(Date.now() - AGENT_HITL_STEP_UP_WINDOW_MS) }
        },
        select: { id: true }
      })
      .then(Boolean)
  }

  getStepUpGrant(auth: AuthContext, runId: string) {
    return this.prisma.agentStepUpGrant.findFirst({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        runId,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        approval: { status: 'approved' }
      },
      orderBy: { createdAt: 'desc' },
      select: { runId: true, toolName: true, approvalId: true, nonce: true }
    })
  }

  private expire(auth: AuthContext) {
    return this.prisma.agentApproval.updateMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        status: 'pending',
        expiresAt: { lte: new Date() }
      },
      data: { status: 'expired' }
    })
  }
}
