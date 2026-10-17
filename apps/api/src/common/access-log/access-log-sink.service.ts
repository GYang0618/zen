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
  latencies: number[]
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
    if (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS') return true
    if (status >= 400) return true
    if (hasAgent) return true
    if (latencyMs >= 1000) return true
    // 普通 GET 采样
    return Math.random() < DEFAULT_SAMPLE_RATE
  }

  record(raw: RawAccessRecord): void {
    const callerType = this.resolveCallerType(raw.callerType)
    const tenantId = raw.tenantId ?? DEFAULT_TENANT_ID
    const now = new Date()

    // 1. 聚合统计：在采样前累计全部请求，保证数字准确
    const bucketDate = new Date(Math.floor(now.getTime() / 60_000) * 60_000)
    const bucketKey = `${tenantId}|${bucketDate.toISOString()}|${raw.method.toUpperCase()}|${raw.route}|${callerType}`
    let bucket = this.minuteBuckets.get(bucketKey)
    if (!bucket) {
      bucket = { count: 0, errorCount: 0, latencies: [] }
      this.minuteBuckets.set(bucketKey, bucket)
    }
    bucket.count++
    if (raw.status >= 400) {
      bucket.errorCount++
    }
    if (bucket.latencies.length < 200) {
      bucket.latencies.push(raw.latencyMs)
    }

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

        // 计算 p95 耗时
        val.latencies.sort((a, b) => a - b)
        const p95Idx = Math.floor(val.latencies.length * 0.95)
        const p95Ms = val.latencies[p95Idx] ?? (val.latencies[0] || 0)

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
            p95Ms: Math.max(p95Ms, 0)
          },
          create: {
            tenantId,
            bucket,
            method,
            route,
            callerType,
            count: val.count,
            errorCount: val.errorCount,
            p95Ms
          }
        })
      }
    } catch (err) {
      this.logger.error({ err }, '更新 API 访问聚合统计失败')
    } finally {
      this.isFlushingStats = false
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.logTimer) clearInterval(this.logTimer)
    if (this.statTimer) clearInterval(this.statTimer)
    await this.flushLogs()
    await this.flushStats()
  }
}
