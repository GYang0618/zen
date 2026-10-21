import { Inject, Injectable, Logger } from '@nestjs/common'
import { ApiCallerType } from '@prisma/client'
import { DEFAULT_TENANT_ID } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'

import type { OnApplicationShutdown } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

export type RawAccessRecord = {
  method: string
  route: string
  status: number
  latencyMs: number
  title: string
  callerType: 'user' | 'agent' | 'anonymous' | 'api_key' | 'system' | ApiCallerType
  userId?: string | null
  tenantId?: string | null
  traceId: string
  agentRunId?: string | null
  agentToolName?: string | null
  apiKeyId?: string | null
  ip?: string | null
  userAgent?: string | null
}

const BATCH_SIZE = 200
const FLUSH_INTERVAL_MS = 1000
const STATS_FLUSH_INTERVAL_MS = 10_000
const DEFAULT_SAMPLE_RATE = 0.1

type MinuteBucketKey = string
type MinuteBucketVal = {
  count: number
  errorCount: number
  latencySumMs: bigint
  latencyLt10Ms: number
  latency10To25Ms: number
  latency25To50Ms: number
  latency50To100Ms: number
  latency100To250Ms: number
  latency250To500Ms: number
  latency500To1000Ms: number
  latency1000To2500Ms: number
  latency2500To5000Ms: number
  latencyGte5000Ms: number
}

@Injectable()
export class AccessLogSink implements OnApplicationShutdown {
  private readonly logger = new Logger(AccessLogSink.name)
  private queue: Prisma.ApiAccessLogCreateManyInput[] = []
  private logTimer: NodeJS.Timeout | null = null
  private statTimer: NodeJS.Timeout | null = null
  private isFlushingLogs = false
  private isFlushingStats = false

  // 内存分钟聚合桶：Key = `${tenantId}|${bucketIso}|${method}|${route}|${callerType}`
  private minuteBuckets = new Map<MinuteBucketKey, MinuteBucketVal>()

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    this.logTimer = setInterval(() => void this.flushLogs(), FLUSH_INTERVAL_MS)
    this.statTimer = setInterval(() => void this.flushStats(), STATS_FLUSH_INTERVAL_MS)
  }

  private resolveCallerType(caller: RawAccessRecord['callerType']): ApiCallerType {
    const upper = String(caller).toUpperCase()
    if (upper === 'AGENT') return ApiCallerType.AGENT
    if (upper === 'API_KEY') return ApiCallerType.API_KEY
    if (upper === 'ANONYMOUS') return ApiCallerType.ANONYMOUS
    return ApiCallerType.USER
  }

  private shouldSample(
    method: string,
    status: number,
    latencyMs: number,
    hasAgent: boolean
  ): boolean {
    const m = method.toUpperCase()
    // 写操作、失败、Agent 调用、慢请求全量入库
    if (m !== 'GET' && m !== 'HEAD') return true
    if (status >= 400) return true
    if (hasAgent) return true
    if (latencyMs >= 1000) return true
    // 普通 GET 采样
    return Math.random() < DEFAULT_SAMPLE_RATE
  }

  record(raw: RawAccessRecord): void {
    if (raw.method.toUpperCase() === 'OPTIONS') return

    const callerType = this.resolveCallerType(raw.callerType)
    const tenantId = raw.tenantId ?? DEFAULT_TENANT_ID
    const now = new Date()

    // 1. 聚合统计：在采样前累计全部请求，保证数字准确
    const bucketDate = new Date(Math.floor(now.getTime() / 60_000) * 60_000)
    const bucketKey = `${tenantId}|${bucketDate.toISOString()}|${raw.method.toUpperCase()}|${raw.route}|${callerType}`
    let bucket = this.minuteBuckets.get(bucketKey)
    if (!bucket) {
      bucket = {
        count: 0,
        errorCount: 0,
        latencySumMs: 0n,
        latencyLt10Ms: 0,
        latency10To25Ms: 0,
        latency25To50Ms: 0,
        latency50To100Ms: 0,
        latency100To250Ms: 0,
        latency250To500Ms: 0,
        latency500To1000Ms: 0,
        latency1000To2500Ms: 0,
        latency2500To5000Ms: 0,
        latencyGte5000Ms: 0
      }
      this.minuteBuckets.set(bucketKey, bucket)
    }
    bucket.count++
    if (raw.status >= 400) {
      bucket.errorCount++
    }
    const latencyMs = Number.isFinite(raw.latencyMs) ? Math.max(0, Math.trunc(raw.latencyMs)) : 0
    bucket.latencySumMs += BigInt(latencyMs)
    if (latencyMs < 10) bucket.latencyLt10Ms++
    else if (latencyMs < 25) bucket.latency10To25Ms++
    else if (latencyMs < 50) bucket.latency25To50Ms++
    else if (latencyMs < 100) bucket.latency50To100Ms++
    else if (latencyMs < 250) bucket.latency100To250Ms++
    else if (latencyMs < 500) bucket.latency250To500Ms++
    else if (latencyMs < 1000) bucket.latency500To1000Ms++
    else if (latencyMs < 2500) bucket.latency1000To2500Ms++
    else if (latencyMs < 5000) bucket.latency2500To5000Ms++
    else bucket.latencyGte5000Ms++

    // 2. 采样入库详细日志
    const sampled = this.shouldSample(
      raw.method,
      raw.status,
      raw.latencyMs,
      Boolean(raw.agentRunId)
    )
    if (!sampled) return

    this.queue.push({
      tenantId,
      userId: raw.userId ?? null,
      callerType,
      apiKeyId: raw.apiKeyId ?? null,
      agentRunId: raw.agentRunId ?? null,
      agentToolName: raw.agentToolName ?? null,
      method: raw.method.toUpperCase(),
      route: raw.route,
      title: raw.title,
      status: raw.status,
      latencyMs: raw.latencyMs,
      ip: raw.ip ?? null,
      userAgent: raw.userAgent ?? null,
      traceId: raw.traceId,
      sampled: true,
      createdAt: now
    })

    if (this.queue.length >= BATCH_SIZE) {
      void this.flushLogs()
    }
  }

  async flushLogs(): Promise<void> {
    if (this.isFlushingLogs || this.queue.length === 0) return
    this.isFlushingLogs = true
    const batch = this.queue.splice(0, BATCH_SIZE)

    try {
      await this.prisma.apiAccessLog.createMany({ data: batch })
    } catch (err) {
      this.logger.error({ err, count: batch.length }, '写入 API 访问日志失败')
    } finally {
      this.isFlushingLogs = false
      if (this.queue.length >= BATCH_SIZE) {
        void this.flushLogs()
      }
    }
  }

  async flushStats(): Promise<void> {
    if (this.isFlushingStats || this.minuteBuckets.size === 0) return
    this.isFlushingStats = true

    const entries = Array.from(this.minuteBuckets.entries())
    this.minuteBuckets.clear()

    try {
      for (const [key, val] of entries) {
        const [tenantId, bucketIso, method, route, callerTypeStr] = key.split('|')
        const bucket = new Date(bucketIso)
        const callerType = callerTypeStr as ApiCallerType

        const p95Ms = this.estimateP95(val)

        await this.prisma.apiAccessStat.upsert({
          where: {
            tenantId_bucket_method_route_callerType: {
              tenantId,
              bucket,
              method,
              route,
              callerType
            }
          },
          update: {
            count: { increment: val.count },
            errorCount: { increment: val.errorCount },
            p95Ms,
            latencySumMs: { increment: val.latencySumMs },
            latencyLt10Ms: { increment: val.latencyLt10Ms },
            latency10To25Ms: { increment: val.latency10To25Ms },
            latency25To50Ms: { increment: val.latency25To50Ms },
            latency50To100Ms: { increment: val.latency50To100Ms },
            latency100To250Ms: { increment: val.latency100To250Ms },
            latency250To500Ms: { increment: val.latency250To500Ms },
            latency500To1000Ms: { increment: val.latency500To1000Ms },
            latency1000To2500Ms: { increment: val.latency1000To2500Ms },
            latency2500To5000Ms: { increment: val.latency2500To5000Ms },
            latencyGte5000Ms: { increment: val.latencyGte5000Ms }
          },
          create: {
            tenantId,
            bucket,
            method,
            route,
            callerType,
            count: val.count,
            errorCount: val.errorCount,
            p95Ms,
            latencySumMs: val.latencySumMs,
            latencyLt10Ms: val.latencyLt10Ms,
            latency10To25Ms: val.latency10To25Ms,
            latency25To50Ms: val.latency25To50Ms,
            latency50To100Ms: val.latency50To100Ms,
            latency100To250Ms: val.latency100To250Ms,
            latency250To500Ms: val.latency250To500Ms,
            latency500To1000Ms: val.latency500To1000Ms,
            latency1000To2500Ms: val.latency1000To2500Ms,
            latency2500To5000Ms: val.latency2500To5000Ms,
            latencyGte5000Ms: val.latencyGte5000Ms
          }
        })
      }
    } catch (err) {
      this.logger.error({ err }, '更新 API 访问聚合统计失败')
    } finally {
      this.isFlushingStats = false
    }
  }

  private estimateP95(bucket: MinuteBucketVal): number {
    const target = Math.ceil(bucket.count * 0.95)
    const bounds: Array<[number, number]> = [
      [bucket.latencyLt10Ms, 10],
      [bucket.latency10To25Ms, 25],
      [bucket.latency25To50Ms, 50],
      [bucket.latency50To100Ms, 100],
      [bucket.latency100To250Ms, 250],
      [bucket.latency250To500Ms, 500],
      [bucket.latency500To1000Ms, 1000],
      [bucket.latency1000To2500Ms, 2500],
      [bucket.latency2500To5000Ms, 5000],
      [bucket.latencyGte5000Ms, 5000]
    ]
    let cumulative = 0
    for (const [count, upperBound] of bounds) {
      cumulative += count
      if (cumulative >= target) return upperBound
    }
    return 0
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.logTimer) clearInterval(this.logTimer)
    if (this.statTimer) clearInterval(this.statTimer)
    await this.flushLogs()
    await this.flushStats()
  }
}
