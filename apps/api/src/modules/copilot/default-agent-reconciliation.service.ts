import { Inject, Injectable } from '@nestjs/common'
import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'

import type { AuthContext } from '@zen/shared'

@Injectable()
export class DefaultAgentReconciliationService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async reconcile(auth: AuthContext) {
    const staleBefore = new Date(Date.now() - DEFAULT_AGENT_RUN_BUDGET.timeoutMs)
    const now = new Date()
    const rejectedApprovalWhere = {
      tenantId: auth.tenantId,
      userId: auth.userId,
      status: 'rejected',
      decision: 'reject'
    } as const
    const expiredApprovalWhere = {
      tenantId: auth.tenantId,
      userId: auth.userId,
      status: 'pending',
      expiresAt: { lte: now }
    } as const
    const [
      runs,
      turns,
      timedOutTools,
      rejectedApprovalRuns,
      rejectedApprovalTurns,
      rejectedApprovalTools,
      expiredApprovalRuns,
      expiredApprovalTurns,
      expiredApprovalTools,
      expiredApprovals,
      idempotency
    ] = await this.prisma.$transaction([
      this.prisma.agentRun.updateMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: { in: ['pending', 'running', 'finishing'] },
          OR: [
            { leaseExpiresAt: { lte: now } },
            { leaseExpiresAt: null, updatedAt: { lt: staleBefore } }
          ]
        },
        data: { status: 'timed_out', endReason: 'timeout', endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running', 'finishing'] },
          updatedAt: { lt: staleBefore },
          run: { tenantId: auth.tenantId, userId: auth.userId }
        },
        data: { status: 'timed_out', endReason: 'timeout', endedAt: now }
      }),
      this.prisma.agentToolExecution.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running'] },
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            status: 'timed_out',
            endReason: 'timeout'
          }
        },
        data: { status: 'cancelled', errorReason: 'RUN_TIMED_OUT', endedAt: now }
      }),
      this.prisma.agentRun.updateMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: 'interrupted',
          approvals: { some: rejectedApprovalWhere }
        },
        data: { status: 'cancelled', endReason: 'approval_rejected', endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: 'interrupted',
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: rejectedApprovalWhere }
          }
        },
        data: { status: 'cancelled', endReason: 'approval_rejected', endedAt: now }
      }),
      this.prisma.agentToolExecution.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running'] },
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: rejectedApprovalWhere }
          }
        },
        data: { status: 'cancelled', errorReason: 'APPROVAL_REJECTED', endedAt: now }
      }),
      this.prisma.agentRun.updateMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          status: 'interrupted',
          approvals: { some: expiredApprovalWhere }
        },
        data: { status: 'timed_out', endReason: 'approval_expired', endedAt: now }
      }),
      this.prisma.agentTurn.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: 'interrupted',
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: expiredApprovalWhere }
          }
        },
        data: { status: 'timed_out', endReason: 'approval_expired', endedAt: now }
      }),
      this.prisma.agentToolExecution.updateMany({
        where: {
          tenantId: auth.tenantId,
          status: { in: ['pending', 'running'] },
          run: {
            tenantId: auth.tenantId,
            userId: auth.userId,
            approvals: { some: expiredApprovalWhere }
          }
        },
        data: { status: 'cancelled', errorReason: 'APPROVAL_EXPIRED', endedAt: now }
      }),
      this.prisma.agentApproval.updateMany({
        where: expiredApprovalWhere,
        data: { status: 'expired' }
      }),
      this.prisma.agentIdempotencyRecord.deleteMany({
        where: { tenantId: auth.tenantId, userId: auth.userId, expiresAt: { lte: now } }
      })
    ])
    return {
      timedOutRuns: runs.count,
      timedOutTurns: turns.count,
      timedOutTools: timedOutTools.count,
      rejectedApprovalRuns: rejectedApprovalRuns.count,
      rejectedApprovalTurns: rejectedApprovalTurns.count,
      rejectedApprovalTools: rejectedApprovalTools.count,
      expiredApprovalRuns: expiredApprovalRuns.count,
      expiredApprovalTurns: expiredApprovalTurns.count,
      expiredApprovalTools: expiredApprovalTools.count,
      expiredApprovals: expiredApprovals.count,
      deletedIdempotencyRecords: idempotency.count
    }
  }
}
