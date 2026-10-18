import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { AuditResult, Prisma } from '@prisma/client'

import { PrismaService } from '../../infra/prisma/index.js'

import type { auditStatsQuerySchema } from '@zen/shared'
import type { z } from 'zod'

export type AuditStatsQuery = z.infer<typeof auditStatsQuerySchema>

type StatsWindow = {
  start: Date
  end: Date
  startDate: string
  endDate: string
  days: number
}

const LATENCY_BUCKETS = [
  ['latencyLt10Ms', 0, 10],
  ['latency10To25Ms', 10, 25],
  ['latency25To50Ms', 25, 50],
  ['latency50To100Ms', 50, 100],
  ['latency100To250Ms', 100, 250],
  ['latency250To500Ms', 250, 500],
  ['latency500To1000Ms', 500, 1000],
  ['latency1000To2500Ms', 1000, 2500],
  ['latency2500To5000Ms', 2500, 5000],
  ['latencyGte5000Ms', 5000, null]
] as const

const LATENCY_SUM_FIELDS = {
  latencySumMs: true,
  latencyLt10Ms: true,
  latency10To25Ms: true,
  latency25To50Ms: true,
  latency50To100Ms: true,
  latency100To250Ms: true,
  latency250To500Ms: true,
  latency500To1000Ms: true,
  latency1000To2500Ms: true,
  latency2500To5000Ms: true,
  latencyGte5000Ms: true
} as const

type LatencyBuckets = Partial<Record<(typeof LATENCY_BUCKETS)[number][0], number | null>>

function p95Bucket(counts: LatencyBuckets, sampleCount: number) {
  if (sampleCount === 0) return null
  const target = Math.ceil(sampleCount * 0.95)
  let cumulative = 0
  for (const [key, lowerBoundMs, upperBoundMs] of LATENCY_BUCKETS) {
    cumulative += counts[key] ?? 0
    if (cumulative >= target) return { lowerBoundMs, upperBoundMs }
  }
  return null
}

function latencySummary(
  sumMs: bigint | number | null,
  buckets: LatencyBuckets,
  totalCount: number
) {
  const sampleCount = LATENCY_BUCKETS.reduce((sum, [key]) => sum + (buckets[key] ?? 0), 0)
  const percentileBucket = p95Bucket(buckets, sampleCount)
  return {
    sampleCount,
    meanMs: sampleCount ? Number(sumMs ?? 0n) / sampleCount : null,
    meanScope: sampleCount === totalCount ? 'all_requests' : 'covered_requests',
    p95EstimateMs: percentileBucket?.upperBoundMs ?? percentileBucket?.lowerBoundMs ?? null,
    p95Bucket: percentileBucket,
    p95IsLowerBound: percentileBucket?.upperBoundMs === null,
    coverageCount: sampleCount,
    coverageRatio: totalCount ? sampleCount / totalCount : 0
  }
}

@Injectable()
export class AuditStatsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private resolveWindow(query: AuditStatsQuery): StatsWindow {
    const end = query.endDate ? new Date(query.endDate) : new Date()
    const start = query.startDate
      ? new Date(query.startDate)
      : new Date(end.getTime() - query.days * 24 * 60 * 60 * 1000)
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))

    if (start >= end) throw new BadRequestException('startDate 必须早于 endDate')
    if (days > 90) throw new BadRequestException('统计时间范围不能超过 90 天')

    return {
      start,
      end,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days
    }
  }

  private timeWhere(window: StatsWindow) {
    return { gte: window.start, lt: window.end }
  }

  async overview(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const createdAt = this.timeWhere(window)
    const bucket = this.timeWhere(window)
    const date = { gte: window.start, lt: window.end }

    const [operationCount, loginCount, loginFailures, access, agentUsage, runCount, failedRuns] =
      await Promise.all([
        this.prisma.auditLog.count({ where: { tenantId, createdAt } }),
        this.prisma.loginEvent.count({ where: { tenantId, createdAt } }),
        this.prisma.loginEvent.count({ where: { tenantId, createdAt, success: false } }),
        this.prisma.apiAccessStat.aggregate({
          where: { tenantId, bucket },
          _sum: { count: true, errorCount: true, ...LATENCY_SUM_FIELDS }
        }),
        this.prisma.agentUsageDaily.aggregate({
          where: { tenantId, date },
          _sum: {
            modelCalls: true,
            toolCalls: true,
            inputTokens: true,
            outputTokens: true,
            totalTokens: true,
            costMicros: true
          }
        }),
        this.prisma.agentRun.count({ where: { tenantId, createdAt } }),
        this.prisma.agentRun.count({
          where: { tenantId, createdAt, status: 'failed' }
        })
      ])

    const requestCount = access._sum.count ?? 0
    const errorCount = access._sum.errorCount ?? 0
    const usage = agentUsage._sum

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      operations: { count: operationCount },
      logins: { count: loginCount, failures: loginFailures },
      apiAccess: {
        requestCount,
        errorCount,
        errorRate: requestCount ? errorCount / requestCount : 0,
        ...latencySummary(access._sum.latencySumMs, access._sum, requestCount)
      },
      agent: {
        runs: runCount,
        failedRuns,
        modelCalls: usage.modelCalls ?? 0,
        toolCalls: usage.toolCalls ?? 0,
        inputTokens: Number(usage.inputTokens ?? 0n),
        outputTokens: Number(usage.outputTokens ?? 0n),
        totalTokens: Number(usage.totalTokens ?? 0n),
        costMicros: Number(usage.costMicros ?? 0n)
      }
    }
  }

  async operations(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      createdAt: this.timeWhere(window)
    }
    const [byAction, byResource, byResult, byActorType, denied, failed] = await Promise.all([
      this.prisma.auditLog.groupBy({ by: ['action'], where, _count: { _all: true } }),
      this.prisma.auditLog.groupBy({ by: ['resource'], where, _count: { _all: true } }),
      this.prisma.auditLog.groupBy({ by: ['result'], where, _count: { _all: true } }),
      this.prisma.auditLog.groupBy({ by: ['actorType'], where, _count: { _all: true } }),
      this.prisma.auditLog.count({ where: { ...where, result: AuditResult.DENIED } }),
      this.prisma.auditLog.count({ where: { ...where, result: AuditResult.FAILURE } })
    ])

    const top = <T extends { _count: { _all: number } }>(rows: T[]) =>
      [...rows]
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, query.top)
        .map((row) => ({ ...row, count: row._count._all }))

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      total: await this.prisma.auditLog.count({ where }),
      denied,
      failed,
      byAction: top(byAction),
      byResource: top(byResource),
      byResult: top(byResult),
      byActorType: top(byActorType)
    }
  }

  async logins(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const where: Prisma.LoginEventWhereInput = {
      tenantId,
      createdAt: this.timeWhere(window)
    }
    const [total, successes, failures, byEvent, byOutcome] = await Promise.all([
      this.prisma.loginEvent.count({ where }),
      this.prisma.loginEvent.count({ where: { ...where, success: true } }),
      this.prisma.loginEvent.count({ where: { ...where, success: false } }),
      this.prisma.loginEvent.groupBy({ by: ['event'], where, _count: { _all: true } }),
      this.prisma.loginEvent.groupBy({ by: ['success'], where, _count: { _all: true } })
    ])

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      total,
      successes,
      failures,
      successRate: total ? successes / total : 0,
      byEvent: byEvent.map((row) => ({ event: row.event, count: row._count._all })),
      byOutcome: byOutcome.map((row) => ({ success: row.success, count: row._count._all }))
    }
  }

  async security(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const createdAt = this.timeWhere(window)
    const auditWhere: Prisma.AuditLogWhereInput = {
      tenantId,
      createdAt,
      result: { in: [AuditResult.DENIED, AuditResult.FAILURE] }
    }
    const [denied, failed, rateLimited, failedLogins, topActions, topIps] = await Promise.all([
      this.prisma.auditLog.count({ where: { ...auditWhere, result: AuditResult.DENIED } }),
      this.prisma.auditLog.count({ where: { ...auditWhere, result: AuditResult.FAILURE } }),
      this.prisma.auditLog.count({ where: { ...auditWhere, action: 'security.rate_limited' } }),
      this.prisma.loginEvent.count({ where: { tenantId, createdAt, success: false } }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: auditWhere,
        _count: { _all: true }
      }),
      this.prisma.auditLog.groupBy({
        by: ['ip'],
        where: { ...auditWhere, ip: { not: null } },
        _count: { _all: true }
      })
    ])
    const top = <T extends { _count: { _all: number } }>(rows: T[]) =>
      [...rows]
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, query.top)
        .map((row) => ({ ...row, count: row._count._all }))

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      denied,
      failed,
      rateLimited,
      failedLogins,
      totalSecurityEvents: denied + failed + failedLogins,
      byAction: top(topActions),
      byIp: top(topIps)
    }
  }

  async access(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const where = { tenantId, bucket: this.timeWhere(window) }
    const granularity = window.days <= 2 ? 'hour' : 'day'
    const [summary, byCaller, byRoute, trend] = await Promise.all([
      this.prisma.apiAccessStat.aggregate({
        where,
        _sum: { count: true, errorCount: true, ...LATENCY_SUM_FIELDS }
      }),
      this.prisma.apiAccessStat.groupBy({
        by: ['callerType'],
        where,
        _sum: { count: true, errorCount: true, ...LATENCY_SUM_FIELDS }
      }),
      this.prisma.apiAccessStat.groupBy({
        by: ['method', 'route'],
        where,
        _sum: { count: true, errorCount: true, ...LATENCY_SUM_FIELDS }
      }),
      this.prisma.$queryRaw<
        Array<{
          bucketStart: Date
          requestCount: bigint
          errorCount: bigint
          latencySumMs: bigint
          latencyLt10Ms: bigint
          latency10To25Ms: bigint
          latency25To50Ms: bigint
          latency50To100Ms: bigint
          latency100To250Ms: bigint
          latency250To500Ms: bigint
          latency500To1000Ms: bigint
          latency1000To2500Ms: bigint
          latency2500To5000Ms: bigint
          latencyGte5000Ms: bigint
        }>
      >(Prisma.sql`
        SELECT
          date_trunc(${granularity}, "bucket") AS "bucketStart",
          SUM("count")::bigint AS "requestCount",
          SUM("error_count")::bigint AS "errorCount",
          SUM("latency_sum_ms")::bigint AS "latencySumMs",
          SUM("latency_lt_10_ms")::bigint AS "latencyLt10Ms",
          SUM("latency_10_to_25_ms")::bigint AS "latency10To25Ms",
          SUM("latency_25_to_50_ms")::bigint AS "latency25To50Ms",
          SUM("latency_50_to_100_ms")::bigint AS "latency50To100Ms",
          SUM("latency_100_to_250_ms")::bigint AS "latency100To250Ms",
          SUM("latency_250_to_500_ms")::bigint AS "latency250To500Ms",
          SUM("latency_500_to_1000_ms")::bigint AS "latency500To1000Ms",
          SUM("latency_1000_to_2500_ms")::bigint AS "latency1000To2500Ms",
          SUM("latency_2500_to_5000_ms")::bigint AS "latency2500To5000Ms",
          SUM("latency_gte_5000_ms")::bigint AS "latencyGte5000Ms"
        FROM "api_access_stats"
        WHERE "tenant_id" = ${tenantId}
          AND "bucket" >= ${window.start}
          AND "bucket" < ${window.end}
        GROUP BY 1
        ORDER BY 1
      `)
    ])
    const requestCount = summary._sum.count ?? 0
    const errorCount = summary._sum.errorCount ?? 0
    const routes = [...byRoute]
      .sort((a, b) => (b._sum.count ?? 0) - (a._sum.count ?? 0))
      .slice(0, query.top)
      .map((row) => ({
        method: row.method,
        route: row.route,
        count: row._sum.count ?? 0,
        errorCount: row._sum.errorCount ?? 0,
        ...latencySummary(row._sum.latencySumMs, row._sum, row._sum.count ?? 0)
      }))

    const trendRows = new Map(trend.map((row) => [row.bucketStart.getTime(), row] as const))
    const bucketMs = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    let bucketStartMs = Math.floor(window.start.getTime() / bucketMs) * bucketMs
    const timeSeries: Array<
      {
        bucketStart: string
        requestCount: number
        errorCount: number
        errorRate: number
      } & ReturnType<typeof latencySummary>
    > = []
    while (bucketStartMs < window.end.getTime()) {
      const row = trendRows.get(bucketStartMs)
      const count = Number(row?.requestCount ?? 0)
      const errors = Number(row?.errorCount ?? 0)
      const latency = row
        ? latencySummary(
            row.latencySumMs,
            {
              latencyLt10Ms: Number(row.latencyLt10Ms),
              latency10To25Ms: Number(row.latency10To25Ms),
              latency25To50Ms: Number(row.latency25To50Ms),
              latency50To100Ms: Number(row.latency50To100Ms),
              latency100To250Ms: Number(row.latency100To250Ms),
              latency250To500Ms: Number(row.latency250To500Ms),
              latency500To1000Ms: Number(row.latency500To1000Ms),
              latency1000To2500Ms: Number(row.latency1000To2500Ms),
              latency2500To5000Ms: Number(row.latency2500To5000Ms),
              latencyGte5000Ms: Number(row.latencyGte5000Ms)
            },
            count
          )
        : latencySummary(0n, {}, 0)
      timeSeries.push({
        bucketStart: new Date(bucketStartMs).toISOString(),
        requestCount: count,
        errorCount: errors,
        errorRate: count ? errors / count : 0,
        ...latency
      })
      bucketStartMs += bucketMs
    }

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      trendGranularity: granularity,
      trend: timeSeries,
      requestCount,
      errorCount,
      errorRate: requestCount ? errorCount / requestCount : 0,
      ...latencySummary(summary._sum.latencySumMs, summary._sum, requestCount),
      byCaller: byCaller.map((row) => ({
        callerType: row.callerType,
        count: row._sum.count ?? 0,
        errorCount: row._sum.errorCount ?? 0,
        ...latencySummary(row._sum.latencySumMs, row._sum, row._sum.count ?? 0)
      })),
      topRoutes: routes
    }
  }

  async agent(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const date = { gte: window.start, lt: window.end }
    const createdAt = this.timeWhere(window)
    const [usage, byModel, runs, byRunStatus] = await Promise.all([
      this.prisma.agentUsageDaily.aggregate({
        where: { tenantId, date },
        _sum: {
          modelCalls: true,
          toolCalls: true,
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          costMicros: true
        }
      }),
      this.prisma.agentUsageDaily.groupBy({
        by: ['model'],
        where: { tenantId, date },
        _sum: { modelCalls: true, totalTokens: true, costMicros: true }
      }),
      this.prisma.agentRun.count({ where: { tenantId, createdAt } }),
      this.prisma.agentRun.groupBy({
        by: ['status'],
        where: { tenantId, createdAt },
        _count: { _all: true }
      })
    ])
    const totalTokens = usage._sum.totalTokens ?? 0n
    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      runs,
      modelCalls: usage._sum.modelCalls ?? 0,
      toolCalls: usage._sum.toolCalls ?? 0,
      inputTokens: Number(usage._sum.inputTokens ?? 0n),
      outputTokens: Number(usage._sum.outputTokens ?? 0n),
      totalTokens: Number(totalTokens),
      costMicros: Number(usage._sum.costMicros ?? 0n),
      averageTokensPerRun: runs ? Number(totalTokens) / runs : 0,
      byRunStatus: byRunStatus.map((row) => ({ status: row.status, count: row._count._all })),
      byModel: [...byModel]
        .sort((a, b) => Number(b._sum.totalTokens ?? 0n) - Number(a._sum.totalTokens ?? 0n))
        .slice(0, query.top)
        .map((row) => ({
          model: row.model,
          modelCalls: row._sum.modelCalls ?? 0,
          totalTokens: Number(row._sum.totalTokens ?? 0n),
          costMicros: Number(row._sum.costMicros ?? 0n)
        }))
    }
  }
}
