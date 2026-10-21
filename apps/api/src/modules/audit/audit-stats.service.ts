import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { AiQuotaMetric, AiQuotaPeriod, AiQuotaScope, AuditResult, Prisma } from '@prisma/client'

import { activityLevels, heatmapIntensity, ratio, withShare } from '../../common/stats/series.js'
import { PrismaService } from '../../infra/prisma/index.js'
import { quotaPeriodStart } from './quota-period.js'

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

const DAY_MS = 24 * 60 * 60 * 1000

const WEEKDAYS = [
  { dow: 1, label: '周一' },
  { dow: 2, label: '周二' },
  { dow: 3, label: '周三' },
  { dow: 4, label: '周四' },
  { dow: 5, label: '周五' },
  { dow: 6, label: '周六' },
  { dow: 0, label: '周日' }
] as const

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${hour}时`)

const ACTOR_LABELS: Record<string, string> = {
  user: '用户',
  agent: 'Agent',
  system: '系统'
}

const CALLER_LABELS: Record<string, string> = {
  user: '用户',
  agent: 'Agent',
  api_key: 'API Key',
  anonymous: '匿名'
}

const LOGIN_EVENT_LABELS: Record<string, string> = {
  login: '密码登录',
  mfa: 'MFA 登录'
}

const PURPOSE_LABELS: Record<string, string> = {
  chat: '对话',
  summarization: '摘要',
  title: '标题',
  fallback: '回退模型'
}

const RUN_STATUS_LABELS: Record<string, string> = {
  pending: '排队',
  running: '执行中',
  finishing: '收尾',
  succeeded: '成功',
  failed: '失败',
  cancelled: '已取消',
  timed_out: '超时',
  interrupted: '中断'
}

const LATENCY_LABELS: Record<(typeof LATENCY_BUCKETS)[number][0], string> = {
  latencyLt10Ms: '<10ms',
  latency10To25Ms: '10–25ms',
  latency25To50Ms: '25–50ms',
  latency50To100Ms: '50–100ms',
  latency100To250Ms: '100–250ms',
  latency250To500Ms: '250–500ms',
  latency500To1000Ms: '500–1000ms',
  latency1000To2500Ms: '1–2.5s',
  latency2500To5000Ms: '2.5–5s',
  latencyGte5000Ms: '≥5s'
}

function labelOf(labels: Record<string, string>, raw: string): string {
  return labels[raw] ?? labels[raw.toLowerCase()] ?? raw
}

function dayStamps(window: StatsWindow): number[] {
  const stamps: number[] = []
  let cursor = Math.floor(window.start.getTime() / DAY_MS) * DAY_MS
  while (cursor < window.end.getTime()) {
    stamps.push(cursor)
    cursor += DAY_MS
  }
  return stamps
}

function dailyDates(window: StatsWindow): string[] {
  return dayStamps(window).map((stamp) => new Date(stamp).toISOString().slice(0, 10))
}

function fillDailyCounts(
  window: StatsWindow,
  rows: Array<{ bucketStart: Date; count: bigint }>
): number[] {
  const indexed = new Map(
    rows.map((row) => [row.bucketStart.getTime(), Number(row.count)] as const)
  )
  return dayStamps(window).map((stamp) => indexed.get(stamp) ?? 0)
}

function buildHeatmap(rows: Array<{ dow: number; hour: number; count: bigint }>) {
  const indexed = new Map(rows.map((row) => [`${row.dow}:${row.hour}`, Number(row.count)] as const))
  const cells = WEEKDAYS.flatMap((weekday) =>
    HOUR_LABELS.map((hourLabel, hour) => ({
      x: hourLabel,
      y: weekday.label,
      value: indexed.get(`${weekday.dow}:${hour}`) ?? 0
    }))
  )
  const max = cells.reduce((peak, cell) => Math.max(peak, cell.value), 0)
  return {
    xLabels: [...HOUR_LABELS],
    yLabels: WEEKDAYS.map((weekday) => weekday.label),
    cells: cells.map((cell) => ({
      ...cell,
      intensity: heatmapIntensity(cell.value, max)
    }))
  }
}

function calendarFromBuckets(points: Array<{ bucketStart: string; total: number }>, unit: string) {
  const byDate = new Map<string, number>()
  for (const point of points) {
    const date = point.bucketStart.slice(0, 10)
    byDate.set(date, (byDate.get(date) ?? 0) + point.total)
  }
  const dates = [...byDate.keys()].sort()
  const counts = dates.map((date) => byDate.get(date) ?? 0)
  const levels = activityLevels(counts)
  return dates.map((date, index) => ({
    date,
    count: counts[index] ?? 0,
    level: levels[index] ?? 0,
    tooltip: `${date}：${counts[index] ?? 0} ${unit}`
  }))
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
    const sparklinesPromise = this.loadDailySparklines(tenantId, window)
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

    const periodMs = window.end.getTime() - window.start.getTime()
    const prevStart = new Date(window.start.getTime() - periodMs)
    const prevEnd = window.start
    const prevTimeWhere = { gte: prevStart, lt: prevEnd }

    const [prevOperations, prevLogins, prevAccess, prevAgentRuns] = await Promise.all([
      this.prisma.auditLog.count({ where: { tenantId, createdAt: prevTimeWhere } }),
      this.prisma.loginEvent.count({ where: { tenantId, createdAt: prevTimeWhere } }),
      this.prisma.apiAccessStat.aggregate({
        where: { tenantId, bucket: prevTimeWhere },
        _sum: { count: true }
      }),
      this.prisma.agentRun.count({ where: { tenantId, createdAt: prevTimeWhere } })
    ])
    const prevRequests = prevAccess._sum.count ?? 0

    const calcGrowth = (curr: number, prev: number) =>
      prev > 0 ? Number(((curr - prev) / prev).toFixed(4)) : curr > 0 ? 1 : 0

    const sparklines = await sparklinesPromise

    const comparison = {
      previousWindow: { start: prevStart.toISOString(), endExclusive: prevEnd.toISOString() },
      operations: {
        previousCount: prevOperations,
        growthRate: calcGrowth(operationCount, prevOperations)
      },
      logins: {
        previousCount: prevLogins,
        growthRate: calcGrowth(loginCount, prevLogins)
      },
      apiAccess: {
        previousRequestCount: prevRequests,
        growthRate: calcGrowth(requestCount, prevRequests)
      },
      agent: {
        previousRuns: prevAgentRuns,
        growthRate: calcGrowth(runCount, prevAgentRuns)
      }
    }

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      sparklines,
      comparison,
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
    const [byAction, byResource, byResult, byActorType, denied, failed, operationTrend] =
      await Promise.all([
        this.prisma.auditLog.groupBy({ by: ['action'], where, _count: { _all: true } }),
        this.prisma.auditLog.groupBy({ by: ['resource'], where, _count: { _all: true } }),
        this.prisma.auditLog.groupBy({ by: ['result'], where, _count: { _all: true } }),
        this.prisma.auditLog.groupBy({ by: ['actorType'], where, _count: { _all: true } }),
        this.prisma.auditLog.count({ where: { ...where, result: AuditResult.DENIED } }),
        this.prisma.auditLog.count({ where: { ...where, result: AuditResult.FAILURE } }),
        this.prisma.$queryRaw<
          Array<{
            bucketStart: Date
            successCount: bigint
            failureCount: bigint
            deniedCount: bigint
          }>
        >(Prisma.sql`
        SELECT
          date_trunc('day', "created_at") AS "bucketStart",
          COUNT(*) FILTER (WHERE "result" = 'success')::bigint AS "successCount",
          COUNT(*) FILTER (WHERE "result" = 'failure')::bigint AS "failureCount",
          COUNT(*) FILTER (WHERE "result" = 'denied')::bigint AS "deniedCount"
        FROM "audit_logs"
        WHERE "tenant_id" = ${tenantId}
          AND "created_at" >= ${window.start}
          AND "created_at" < ${window.end}
        GROUP BY 1
        ORDER BY 1
      `)
      ])

    const top = <T extends { _count: { _all: number } }>(rows: T[]) =>
      [...rows]
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, query.top)
        .map((row) => ({ ...row, count: row._count._all }))

    const total = await this.prisma.auditLog.count({ where })
    const rankedActions = top(byAction)
    const rankedResources = top(byResource)
    const rankedResults = top(byResult)
    const rankedActors = top(byActorType)
    const trendIndex = new Map(
      operationTrend.map((row) => [row.bucketStart.getTime(), row] as const)
    )
    const trend = dayStamps(window).map((stamp) => {
      const row = trendIndex.get(stamp)
      return {
        bucketStart: new Date(stamp).toISOString(),
        successCount: Number(row?.successCount ?? 0),
        failureCount: Number(row?.failureCount ?? 0),
        deniedCount: Number(row?.deniedCount ?? 0)
      }
    })

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      total,
      denied,
      failed,
      trend,
      byAction: rankedActions,
      byResource: rankedResources,
      byResult: rankedResults,
      byActorType: rankedActors,
      series: {
        actionRanking: rankedActions.map((row) => ({ label: row.action, value: row.count })),
        resourceRanking: rankedResources.map((row) => ({
          label: row.resource ?? '未分类',
          value: row.count
        })),
        resultDistribution: withShare([
          { label: '成功', value: Math.max(0, total - denied - failed) },
          { label: '失败', value: failed },
          { label: '拒绝', value: denied }
        ]),
        actorDistribution: withShare(
          rankedActors.map((row) => ({
            label: labelOf(ACTOR_LABELS, String(row.actorType)),
            value: row.count
          }))
        )
      }
    }
  }

  async logins(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const where: Prisma.LoginEventWhereInput = {
      tenantId,
      createdAt: this.timeWhere(window)
    }
    const granularity = window.days <= 2 ? 'hour' : 'day'
    const [total, successes, failures, byEvent, byOutcome, trendRaw, heatmapRaw] =
      await Promise.all([
        this.prisma.loginEvent.count({ where }),
        this.prisma.loginEvent.count({ where: { ...where, success: true } }),
        this.prisma.loginEvent.count({ where: { ...where, success: false } }),
        this.prisma.loginEvent.groupBy({ by: ['event'], where, _count: { _all: true } }),
        this.prisma.loginEvent.groupBy({ by: ['success'], where, _count: { _all: true } }),
        this.prisma.$queryRaw<
          Array<{
            bucketStart: Date
            total: bigint
            successCount: bigint
            failureCount: bigint
          }>
        >(Prisma.sql`
        SELECT
          date_trunc(${granularity}, "created_at") AS "bucketStart",
          COUNT(*)::bigint AS "total",
          COUNT(*) FILTER (WHERE "success" = true)::bigint AS "successCount",
          COUNT(*) FILTER (WHERE "success" = false)::bigint AS "failureCount"
        FROM "login_events"
        WHERE "tenant_id" = ${tenantId}
          AND "created_at" >= ${window.start}
          AND "created_at" < ${window.end}
        GROUP BY 1
        ORDER BY 1
      `),
        this.prisma.$queryRaw<Array<{ dow: number; hour: number; count: bigint }>>(Prisma.sql`
        SELECT
          EXTRACT(DOW FROM "created_at")::int AS dow,
          EXTRACT(HOUR FROM "created_at")::int AS hour,
          COUNT(*)::bigint AS count
        FROM "login_events"
        WHERE "tenant_id" = ${tenantId}
          AND "created_at" >= ${window.start}
          AND "created_at" < ${window.end}
        GROUP BY 1, 2
      `)
      ])

    const trendRows = new Map(trendRaw.map((row) => [row.bucketStart.getTime(), row] as const))
    const bucketMs = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    let bucketStartMs = Math.floor(window.start.getTime() / bucketMs) * bucketMs
    const trend: Array<{
      bucketStart: string
      total: number
      successCount: number
      failureCount: number
    }> = []

    while (bucketStartMs < window.end.getTime()) {
      const row = trendRows.get(bucketStartMs)
      trend.push({
        bucketStart: new Date(bucketStartMs).toISOString(),
        total: Number(row?.total ?? 0),
        successCount: Number(row?.successCount ?? 0),
        failureCount: Number(row?.failureCount ?? 0)
      })
      bucketStartMs += bucketMs
    }

    const eventRows = byEvent.map((row) => ({ event: row.event, count: row._count._all }))

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      trendGranularity: granularity,
      trend,
      heatmap: buildHeatmap(heatmapRaw),
      calendar: calendarFromBuckets(trend, '次登录'),
      total,
      successes,
      failures,
      successRate: ratio(successes, total),
      byEvent: eventRows,
      byOutcome: byOutcome.map((row) => ({ success: row.success, count: row._count._all })),
      series: {
        outcomeDistribution: withShare([
          { label: '成功', value: successes },
          { label: '失败', value: failures }
        ]),
        eventDistribution: withShare(
          eventRows.map((row) => ({
            label: labelOf(LOGIN_EVENT_LABELS, row.event),
            value: row.count
          }))
        )
      }
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
    const [denied, failed, rateLimited, failedLogins, topActions, topIps, auditTrend, loginTrend] =
      await Promise.all([
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
        }),
        this.prisma.$queryRaw<
          Array<{ bucketStart: Date; deniedCount: bigint; failureCount: bigint }>
        >(Prisma.sql`
        SELECT
          date_trunc('day', "created_at") AS "bucketStart",
          COUNT(*) FILTER (WHERE "result" = 'denied')::bigint AS "deniedCount",
          COUNT(*) FILTER (WHERE "result" = 'failure')::bigint AS "failureCount"
        FROM "audit_logs"
        WHERE "tenant_id" = ${tenantId}
          AND "created_at" >= ${window.start}
          AND "created_at" < ${window.end}
          AND "result" IN ('denied', 'failure')
        GROUP BY 1
      `),
        this.prisma.$queryRaw<Array<{ bucketStart: Date; count: bigint }>>(Prisma.sql`
        SELECT date_trunc('day', "created_at") AS "bucketStart", COUNT(*)::bigint AS count
        FROM "login_events"
        WHERE "tenant_id" = ${tenantId}
          AND "created_at" >= ${window.start}
          AND "created_at" < ${window.end}
          AND "success" = false
        GROUP BY 1
      `)
      ])
    const top = <T extends { _count: { _all: number } }>(rows: T[]) =>
      [...rows]
        .sort((a, b) => b._count._all - a._count._all)
        .slice(0, query.top)
        .map((row) => ({ ...row, count: row._count._all }))

    const deniedByDay = new Map(auditTrend.map((row) => [row.bucketStart.getTime(), row] as const))
    const failedLoginsByDay = new Map(
      loginTrend.map((row) => [row.bucketStart.getTime(), Number(row.count)] as const)
    )
    const trend = dayStamps(window).map((stamp) => {
      const auditRow = deniedByDay.get(stamp)
      return {
        bucketStart: new Date(stamp).toISOString(),
        denied: Number(auditRow?.deniedCount ?? 0),
        failed: Number(auditRow?.failureCount ?? 0),
        failedLogins: failedLoginsByDay.get(stamp) ?? 0
      }
    })
    const rankedActions = top(topActions)

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      denied,
      failed,
      rateLimited,
      failedLogins,
      totalSecurityEvents: denied + failed + failedLogins,
      trend,
      byAction: rankedActions,
      byIp: top(topIps),
      series: {
        actionRanking: rankedActions.map((row) => ({ label: row.action, value: row.count }))
      }
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
      topRoutes: routes,
      series: {
        latencyDistribution: withShare(
          LATENCY_BUCKETS.map(([key]) => ({
            label: LATENCY_LABELS[key],
            value: summary._sum[key] ?? 0
          }))
        ),
        callerDistribution: withShare(
          byCaller.map((row) => ({
            label: labelOf(CALLER_LABELS, String(row.callerType)),
            value: row._sum.count ?? 0
          }))
        ),
        outcomeDistribution: withShare([
          { label: '成功', value: Math.max(0, requestCount - errorCount) },
          { label: '错误', value: errorCount }
        ])
      }
    }
  }

  async agent(tenantId: string, query: AuditStatsQuery) {
    const window = this.resolveWindow(query)
    const date = { gte: window.start, lt: window.end }
    const createdAt = this.timeWhere(window)
    const [usage, byModel, runs, byRunStatus, dailyRows, byPurpose, tenantQuotas] =
      await Promise.all([
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
        }),
        this.prisma.agentUsageDaily.groupBy({
          by: ['date'],
          where: { tenantId, date },
          _sum: {
            runs: true,
            modelCalls: true,
            toolCalls: true,
            inputTokens: true,
            outputTokens: true,
            totalTokens: true,
            costMicros: true
          },
          orderBy: { date: 'asc' }
        }),
        this.prisma.agentUsageDaily.groupBy({
          by: ['purpose'],
          where: { tenantId, date },
          _sum: { modelCalls: true, totalTokens: true, costMicros: true }
        }),
        this.prisma.aiQuota.findMany({
          where: { tenantId, enabled: true, scope: AiQuotaScope.TENANT }
        })
      ])
    const totalTokens = usage._sum.totalTokens ?? 0n
    const dailyIndex = new Map(
      dailyRows.map((row) => [row.date.toISOString().slice(0, 10), row] as const)
    )
    const trend = dailyDates(window).map((day) => {
      const row = dailyIndex.get(day)
      return {
        date: day,
        runs: row?._sum.runs ?? 0,
        modelCalls: row?._sum.modelCalls ?? 0,
        toolCalls: row?._sum.toolCalls ?? 0,
        inputTokens: Number(row?._sum.inputTokens ?? 0n),
        outputTokens: Number(row?._sum.outputTokens ?? 0n),
        totalTokens: Number(row?._sum.totalTokens ?? 0n),
        costMicros: Number(row?._sum.costMicros ?? 0n)
      }
    })
    const succeeded = byRunStatus.find((row) => row.status === 'succeeded')?._count._all ?? 0
    const statusRows = byRunStatus.map((row) => ({
      status: row.status,
      count: row._count._all
    }))
    const quotas = await this.loadTenantQuotas(tenantId, tenantQuotas)

    return {
      window: { start: window.startDate, endExclusive: window.endDate, timezone: 'UTC' },
      trend,
      runs,
      modelCalls: usage._sum.modelCalls ?? 0,
      toolCalls: usage._sum.toolCalls ?? 0,
      inputTokens: Number(usage._sum.inputTokens ?? 0n),
      outputTokens: Number(usage._sum.outputTokens ?? 0n),
      totalTokens: Number(totalTokens),
      costMicros: Number(usage._sum.costMicros ?? 0n),
      averageTokensPerRun: runs ? Number(totalTokens) / runs : 0,
      successRate: ratio(succeeded, runs),
      quotas,
      byRunStatus: statusRows,
      byModel: [...byModel]
        .sort((a, b) => Number(b._sum.totalTokens ?? 0n) - Number(a._sum.totalTokens ?? 0n))
        .slice(0, query.top)
        .map((row) => ({
          model: row.model,
          modelCalls: row._sum.modelCalls ?? 0,
          totalTokens: Number(row._sum.totalTokens ?? 0n),
          costMicros: Number(row._sum.costMicros ?? 0n)
        })),
      series: {
        statusDistribution: withShare(
          statusRows.map((row) => ({
            label: labelOf(RUN_STATUS_LABELS, row.status),
            value: row.count
          }))
        ),
        purposeDistribution: withShare(
          byPurpose.map((row) => ({
            label: labelOf(PURPOSE_LABELS, String(row.purpose)),
            value: Number(row._sum.totalTokens ?? 0n)
          }))
        )
      }
    }
  }

  private async loadDailySparklines(tenantId: string, window: StatsWindow) {
    const [operations, logins, requests, agentRuns] = await Promise.all([
      this.countRowsByDay('audit_logs', tenantId, window),
      this.countRowsByDay('login_events', tenantId, window),
      this.prisma.$queryRaw<Array<{ bucketStart: Date; count: bigint }>>(Prisma.sql`
        SELECT date_trunc('day', "bucket") AS "bucketStart", SUM("count")::bigint AS count
        FROM "api_access_stats"
        WHERE "tenant_id" = ${tenantId}
          AND "bucket" >= ${window.start}
          AND "bucket" < ${window.end}
        GROUP BY 1
      `),
      this.countRowsByDay('agent_runs', tenantId, window)
    ])

    return {
      dates: dailyDates(window),
      operations: fillDailyCounts(window, operations),
      logins: fillDailyCounts(window, logins),
      requests: fillDailyCounts(window, requests),
      agentRuns: fillDailyCounts(window, agentRuns)
    }
  }

  private countRowsByDay(
    table: 'audit_logs' | 'login_events' | 'agent_runs',
    tenantId: string,
    window: StatsWindow
  ) {
    const query =
      table === 'audit_logs'
        ? Prisma.sql`
            SELECT date_trunc('day', "created_at") AS "bucketStart", COUNT(*)::bigint AS count
            FROM "audit_logs"
            WHERE "tenant_id" = ${tenantId}
              AND "created_at" >= ${window.start}
              AND "created_at" < ${window.end}
            GROUP BY 1
          `
        : table === 'login_events'
          ? Prisma.sql`
              SELECT date_trunc('day', "created_at") AS "bucketStart", COUNT(*)::bigint AS count
              FROM "login_events"
              WHERE "tenant_id" = ${tenantId}
                AND "created_at" >= ${window.start}
                AND "created_at" < ${window.end}
              GROUP BY 1
            `
          : Prisma.sql`
              SELECT date_trunc('day', "created_at") AS "bucketStart", COUNT(*)::bigint AS count
              FROM "agent_runs"
              WHERE "tenant_id" = ${tenantId}
                AND "created_at" >= ${window.start}
                AND "created_at" < ${window.end}
              GROUP BY 1
            `
    return this.prisma.$queryRaw<Array<{ bucketStart: Date; count: bigint }>>(query)
  }

  private async loadTenantQuotas(
    tenantId: string,
    quotas: Array<{
      period: AiQuotaPeriod
      metric: AiQuotaMetric
      softLimit: bigint | null
      hardLimit: bigint | null
    }>
  ) {
    return Promise.all(
      quotas.map(async (quota) => {
        const periodStart = quotaPeriodStart(quota.period)
        const usage = await this.prisma.agentUsageDaily.aggregate({
          where: { tenantId, date: { gte: periodStart } },
          _sum: { totalTokens: true, costMicros: true }
        })
        const used =
          quota.metric === AiQuotaMetric.COST
            ? Number(usage._sum.costMicros ?? 0n)
            : Number(usage._sum.totalTokens ?? 0n)
        const hardLimit = quota.hardLimit === null ? null : Number(quota.hardLimit)
        return {
          period: quota.period === AiQuotaPeriod.DAY ? ('day' as const) : ('month' as const),
          metric: quota.metric === AiQuotaMetric.COST ? ('cost' as const) : ('tokens' as const),
          used,
          softLimit: quota.softLimit === null ? null : Number(quota.softLimit),
          hardLimit,
          usageRate: hardLimit && hardLimit > 0 ? ratio(used, hardLimit) : null
        }
      })
    )
  }
}
