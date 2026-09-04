import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AGENT_HITL_STEP_UP_WINDOW_MS } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import type { AuthContext } from '@zen/shared'

@Injectable()
export class AgentApprovalService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService
  ) {}

  async listApprovals(auth: AuthContext, status?: string) {
    await this.expireApprovals(auth)
    return this.prisma.agentApproval.findMany({
      where: { tenantId: auth.tenantId, userId: auth.userId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
  }

  async hasRecentApprovedHitl(auth: AuthContext): Promise<boolean> {
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

  async issueHitlStepUpToken(auth: AuthContext): Promise<string | undefined> {
    if (!(await this.hasRecentApprovedHitl(auth))) return undefined
    return this.jwtService.sign(
      { sub: auth.userId, typ: 'step-up', purpose: 'agent-hitl' },
      { expiresIn: '3m' }
    )
  }

  async decideApproval(
    id: string,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    const approval = await this.prisma.agentApproval.findFirst({
      where: { id, tenantId: auth.tenantId, userId: auth.userId }
    })
    return this.applyApprovalDecision(approval, decision, reason, auth)
  }

  async decideApprovalByInterrupt(
    interruptId: string,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    const approval = await this.prisma.agentApproval.findFirst({
      where: { interruptId, tenantId: auth.tenantId, userId: auth.userId },
      orderBy: { createdAt: 'desc' }
    })
    return this.applyApprovalDecision(approval, decision, reason, auth)
  }

  private async expireApprovals(auth: AuthContext) {
    const now = new Date()
    const expired = await this.prisma.agentApproval.findMany({
      where: {
        tenantId: auth.tenantId,
        userId: auth.userId,
        status: 'pending',
        expiresAt: { lte: now }
      },
      select: { id: true, runId: true }
    })
    if (!expired.length) return

    await this.prisma.agentApproval.updateMany({
      where: { id: { in: expired.map((item) => item.id) } },
      data: { status: 'expired' }
    })
  }

  private async applyApprovalDecision(
    approval: {
      id: string
      runId: string
      status: string
      decision: string | null
      expiresAt: Date
    } | null,
    decision: 'approve' | 'reject',
    reason: string | undefined,
    auth: AuthContext
  ) {
    if (!approval) throw new NotFoundException('Agent approval not found')
    if (approval.status !== 'pending') {
      if (approval.decision === decision) {
        if (decision === 'reject') await this.finalizeRejectedApproval(approval.runId, auth)
        return approval
      }
      throw new BadRequestException('Approval has been decided')
    }
    if (approval.expiresAt <= new Date()) {
      await this.prisma.agentApproval.update({
        where: { id: approval.id },
        data: { status: 'expired' }
      })
      throw new BadRequestException('Approval has expired')
    }
    const decidedApproval = await this.prisma.agentApproval.update({
      where: { id: approval.id },
      data: {
        status: decision === 'approve' ? 'approved' : 'rejected',
        decision,
        reason,
        decidedBy: auth.userId,
        decidedAt: new Date()
      }
    })
    if (decision === 'reject') {
      await this.finalizeRejectedApproval(approval.runId, auth)
    }
    return decidedApproval
  }

  private async finalizeRejectedApproval(runId: string, auth: AuthContext) {
    const now = new Date()
    await this.prisma.$transaction([
      this.prisma.agentRun.updateMany({
        where: {
          id: runId,
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: { in: ['interrupted'] }
        },
        data: { status: 'cancelled', endReason: 'approval_rejected', endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          runId,
          tenantId: auth.tenantId,
          run: { userId: auth.userId },
          status: { in: ['interrupted'] }
        },
        data: { status: 'cancelled', endReason: 'approval_rejected', endedAt: now }
      })
    ])
    await this.prisma.agentToolExecution.updateMany({
      where: {
        runId,
        tenantId: auth.tenantId,
        status: { in: ['pending', 'running'] }
      },
      data: {
        status: 'cancelled',
        errorReason: 'APPROVAL_REJECTED',
        endedAt: now
      }
    })
  }
}
