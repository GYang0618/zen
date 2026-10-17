import { Inject, Injectable, Logger } from '@nestjs/common'
import { AuditActorType, AuditResult } from '@prisma/client'
import { DEFAULT_TENANT_ID, maskSecrets } from '@zen/shared'

import { PrismaService } from '../../infra/prisma/index.js'
import { getRequestAuditContext, setRequestAuditContext } from './request-audit-context.js'

import type { OnApplicationShutdown } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

export type WriteAuditInput = {
  tenantId?: string
  actorId?: string
  actorType?: 'USER' | 'AGENT' | 'SYSTEM' | AuditActorType
  actorName?: string
  action: string
  resource?: string
  resourceId?: string
  resourceName?: string
  result?: 'SUCCESS' | 'FAILURE' | 'DENIED' | AuditResult
  errorCode?: string
  endpoint?: string
  ip?: string
  userAgent?: string
  traceId?: string
  agentRunId?: string
  agentToolName?: string
  agentApprovalId?: string
  /** 结构化变更快照；写入前脱敏并序列化以兼容 Prisma InputJsonValue */
  diff?: unknown
}

export type EnqueueAuditInput = WriteAuditInput & {
  diffFactory?: () => unknown | Promise<unknown>
}

const BATCH_SIZE = 100
const FLUSH_INTERVAL_MS = 500
const MAX_RETRY = 3

@Injectable()
export class AuditService implements OnApplicationShutdown {
  private readonly logger = new Logger(AuditService.name)
  private queue: WriteAuditInput[] = []
  private timer: NodeJS.Timeout | null = null
  private isFlushing = false

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    this.startFlushTimer()
  }

  private startFlushTimer() {
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      void this.flush()
    }, FLUSH_INTERVAL_MS)
  }

  private resolveActorType(
    explicitType?: WriteAuditInput['actorType'],
    contextType?: string
  ): AuditActorType {
    if (explicitType) {
      const upper = String(explicitType).toUpperCase()
      if (upper === 'AGENT') return AuditActorType.AGENT
      if (upper === 'SYSTEM') return AuditActorType.SYSTEM
      return AuditActorType.USER
    }
    if (contextType === 'agent') return AuditActorType.AGENT
    if (contextType === 'system') return AuditActorType.SYSTEM
    return AuditActorType.USER
  }

  private resolveResult(explicitResult?: WriteAuditInput['result']): AuditResult {
    if (!explicitResult) return AuditResult.SUCCESS
    const upper = String(explicitResult).toUpperCase()
    if (upper === 'FAILURE') return AuditResult.FAILURE
    if (upper === 'DENIED') return AuditResult.DENIED
    return AuditResult.SUCCESS
  }

  private prepareData(input: WriteAuditInput): Prisma.AuditLogCreateManyInput {
    const ctx = getRequestAuditContext()
    const rawDiff = input.diff !== undefined ? maskSecrets(input.diff) : undefined
    const diff =
      rawDiff === undefined
        ? undefined
        : (JSON.parse(JSON.stringify(rawDiff)) as Prisma.InputJsonValue)

    return {
      tenantId: input.tenantId ?? ctx?.tenantId ?? DEFAULT_TENANT_ID,
      actorId: input.actorId ?? ctx?.actorId ?? null,
      actorType: this.resolveActorType(input.actorType, ctx?.actorType),
      actorName: input.actorName ?? ctx?.actorName ?? null,
      action: input.action,
      resource: input.resource ?? null,
      resourceId: input.resourceId ?? null,
      resourceName: input.resourceName ?? null,
      result: this.resolveResult(input.result),
      errorCode: input.errorCode ?? null,
      endpoint: input.endpoint ?? null,
      ip: input.ip ?? ctx?.ip ?? null,
      userAgent: input.userAgent ?? ctx?.userAgent ?? null,
      traceId: input.traceId ?? ctx?.traceId ?? null,
      agentRunId: input.agentRunId ?? ctx?.agentRunId ?? null,
      agentToolName: input.agentToolName ?? ctx?.agentToolName ?? null,
      agentApprovalId: input.agentApprovalId ?? ctx?.agentApprovalId ?? null,
      diff
    }
  }

  /**
   * 同步写入操作审计，支持通过 options.tx 参与外部事务
   */
  async write(input: WriteAuditInput, options?: { tx?: Prisma.TransactionClient }) {
    setRequestAuditContext({ audited: true })
    const client = options?.tx ?? this.prisma
    const data = this.prepareData(input)
    return client.auditLog.create({ data })
  }

  /**
   * 异步压入缓冲队列，由定时器批量入库
   */
  enqueue(input: EnqueueAuditInput): void {
    setRequestAuditContext({ audited: true })
    const ctx = getRequestAuditContext()

    // 预先捕获当前的请求上下文值，避免异步执行时丢失 ALS
    const snapshot: WriteAuditInput = {
      tenantId: input.tenantId ?? ctx?.tenantId,
      actorId: input.actorId ?? ctx?.actorId,
      actorType: input.actorType ?? (ctx?.actorType as WriteAuditInput['actorType']),
      actorName: input.actorName ?? ctx?.actorName,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      resourceName: input.resourceName,
      result: input.result,
      errorCode: input.errorCode,
      endpoint: input.endpoint,
      ip: input.ip ?? ctx?.ip,
      userAgent: input.userAgent ?? ctx?.userAgent,
      traceId: input.traceId ?? ctx?.traceId,
      agentRunId: input.agentRunId ?? ctx?.agentRunId,
      agentToolName: input.agentToolName ?? ctx?.agentToolName,
      agentApprovalId: input.agentApprovalId ?? ctx?.agentApprovalId,
      diff: input.diff
    }

    if (input.diffFactory) {
      Promise.resolve()
        .then(() => input.diffFactory!())
        .then((computedDiff) => {
          snapshot.diff = computedDiff
          this.queue.push(snapshot)
          if (this.queue.length >= BATCH_SIZE) {
            void this.flush()
          }
        })
        .catch((err) => {
          this.logger.error({ err }, '计算审计 diffFactory 失败')
          this.queue.push(snapshot)
        })
    } else {
      this.queue.push(snapshot)
      if (this.queue.length >= BATCH_SIZE) {
        void this.flush()
      }
    }
  }

  /**
   * 清空缓冲区并批量写入数据库
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return
    this.isFlushing = true
    const batch = this.queue.splice(0, BATCH_SIZE)

    try {
      const items = batch.map((item) => this.prepareData(item))
      let attempts = 0
      while (attempts < MAX_RETRY) {
        try {
          await this.prisma.auditLog.createMany({ data: items })
          break
        } catch (err) {
          attempts++
          if (attempts >= MAX_RETRY) {
            this.logger.error(
              { err, count: items.length },
              '批量写入操作审计日志失败，已达最大重试次数'
            )
          } else {
            await new Promise((resolve) => setTimeout(resolve, 200 * attempts))
          }
        }
      }
    } finally {
      this.isFlushing = false
      if (this.queue.length >= BATCH_SIZE) {
        void this.flush()
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    while (this.queue.length > 0) {
      await this.flush()
    }
  }
}
