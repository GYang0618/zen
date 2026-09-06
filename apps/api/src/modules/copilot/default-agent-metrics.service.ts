import { Inject, Injectable } from '@nestjs/common'

import { PrismaService } from '../../infra/prisma/index.js'
import { percentile } from './default-agent-runtime.utils.js'

import type { AuthContext } from '@zen/shared'

@Injectable()
export class DefaultAgentMetricsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async get(auth: AuthContext) {
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
        where: { tenantId: auth.tenantId, createdAt: { gte: since }, run: { userId: auth.userId } },
        _count: true
      }),
      this.prisma.agentEvaluation.aggregate({
        where: { tenantId: auth.tenantId, createdAt: { gte: since }, run: { userId: auth.userId } },
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
}
