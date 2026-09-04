import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'

import { PrismaService } from '@/infra/prisma'

import { percentile, toJson } from '../default-agent-runtime.utils'

import type { AuthContext } from '@zen/shared'
import type { EvaluationCreateInput } from '../default-agent-runtime.schemas'

@Injectable()
export class AgentMetricsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recordEvaluation(runId: string, input: EvaluationCreateInput, auth: AuthContext) {
    if (!Number.isFinite(input.score) || input.score < 0 || input.score > 1) {
      throw new BadRequestException('Evaluation score must be between 0 and 1')
    }
    return this.prisma.agentEvaluation.upsert({
      where: {
        runId_evaluator_metric: { runId, evaluator: input.evaluator, metric: input.metric }
      },
      create: {
        runId,
        tenantId: auth.tenantId,
        evaluator: input.evaluator,
        metric: input.metric,
        score: input.score,
        details: input.details === undefined ? undefined : toJson(input.details)
      },
      update: {
        score: input.score,
        details: input.details === undefined ? undefined : toJson(input.details)
      }
    })
  }

  async getMetrics(auth: AuthContext) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000)
    const [runs, recentRuns, pendingApprovals, tools, scores] = await Promise.all([
      this.prisma.agentRun.groupBy({
        by: ['status'],
        where: { tenantId: auth.tenantId, userId: auth.userId, createdAt: { gte: since } },
        _count: true
      }),
      this.prisma.agentRun.findMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          createdAt: { gte: since },
          startedAt: { not: null },
          endedAt: { not: null }
        },
        select: {
          startedAt: true,
          endedAt: true,
          firstTokenAt: true,
          inputTokens: true,
          outputTokens: true
        },
        take: 1_000
      }),
      this.prisma.agentApproval.count({
        where: { tenantId: auth.tenantId, userId: auth.userId, status: 'pending' }
      }),
      this.prisma.agentToolExecution.groupBy({
        by: ['status'],
        where: {
          tenantId: auth.tenantId,
          createdAt: { gte: since },
          run: { userId: auth.userId }
        },
        _count: true
      }),
      this.prisma.agentEvaluation.aggregate({
        where: {
          tenantId: auth.tenantId,
          createdAt: { gte: since },
          run: { userId: auth.userId }
        },
        _avg: { score: true },
        _count: true
      })
    ])

    const durations = recentRuns
      .map((run) => run.endedAt!.getTime() - run.startedAt!.getTime())
      .sort((a, b) => a - b)
    const firstTokenDurations = recentRuns
      .filter((run) => run.firstTokenAt)
      .map((run) => run.firstTokenAt!.getTime() - run.startedAt!.getTime())
      .sort((a, b) => a - b)

    return {
      window: '24h',
      runs,
      pendingApprovals,
      tools,
      latencyMs: { p50: percentile(durations, 0.5), p95: percentile(durations, 0.95) },
      firstTokenLatencyMs: {
        p50: percentile(firstTokenDurations, 0.5),
        p95: percentile(firstTokenDurations, 0.95)
      },
      tokens: recentRuns.reduce(
        (total, run) => ({
          input: total.input + (run.inputTokens ?? 0),
          output: total.output + (run.outputTokens ?? 0)
        }),
        { input: 0, output: 0 }
      ),
      evaluations: scores
    }
  }

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
        data: {
          status: 'cancelled',
          errorReason: 'RUN_TIMED_OUT',
          endedAt: now
        }
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
        data: {
          status: 'cancelled',
          errorReason: 'APPROVAL_REJECTED',
          endedAt: now
        }
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
        data: {
          status: 'timed_out',
          errorReason: 'APPROVAL_EXPIRED',
          endedAt: now
        }
      }),
      this.prisma.agentApproval.updateMany({
        where: expiredApprovalWhere,
        data: { status: 'expired' }
      }),
      this.prisma.agentIdempotencyRecord.deleteMany({
        where: {
          tenantId: auth.tenantId,
          userId: auth.userId,
          expiresAt: { lte: now }
        }
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
