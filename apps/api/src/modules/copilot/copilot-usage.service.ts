import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  AgentCallPurpose,
  AgentCallStatus,
  AiQuotaMetric,
  AiQuotaPeriod,
  AiQuotaScope
} from '@prisma/client'
import { createAuditDiff, DEFAULT_TENANT_ID, formatCostMicros, formatTokens } from '@zen/shared'

import { AuditService } from '../../common/auth/audit.service.js'
import { PrismaService } from '../../infra/prisma/index.js'

export type UsageReportItem = {
  tenantId?: string
  userId?: string
  runId?: string | null
  threadId?: string | null
  callIndex: number
  purpose: 'chat' | 'summarization' | 'title' | 'fallback' | AgentCallPurpose
  provider: string
  model: string
  status: 'succeeded' | 'failed' | 'aborted' | AgentCallStatus
  inputTokens: number
  outputTokens: number
  reasoningTokens?: number
  cachedInputTokens?: number
  totalTokens?: number
  estimated?: boolean
  latencyMs?: number
  firstTokenMs?: number
  errorCode?: string
  traceId?: string
}

const DEFAULT_INPUT_PRICE_PER_MTOK = 500_000n // ¥0.5 / MTok
const DEFAULT_CACHED_PRICE_PER_MTOK = 100_000n // ¥0.1 / MTok
const DEFAULT_OUTPUT_PRICE_PER_MTOK = 2_000_000n // ¥2.0 / MTok

@Injectable()
export class CopilotUsageService {
  private readonly logger = new Logger(CopilotUsageService.name)
  private readonly quotaNotices = new Set<string>()

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  private mapPurpose(p: UsageReportItem['purpose']): AgentCallPurpose {
    const s = String(p).toUpperCase()
    if (s === 'SUMMARIZATION') return AgentCallPurpose.SUMMARIZATION
    if (s === 'TITLE') return AgentCallPurpose.TITLE
    if (s === 'FALLBACK') return AgentCallPurpose.FALLBACK
    return AgentCallPurpose.CHAT
  }

  private mapStatus(s: UsageReportItem['status']): AgentCallStatus {
    const str = String(s).toUpperCase()
    if (str === 'FAILED') return AgentCallStatus.FAILED
    if (str === 'ABORTED') return AgentCallStatus.ABORTED
    return AgentCallStatus.SUCCEEDED
  }

  private calculateCostMicros(
    inputTokens: number,
    cachedInputTokens: number,
    outputTokens: number,
    reasoningTokens: number,
    price?: {
      inputPerMTok: bigint
      cachedInputPerMTok: bigint | null
      outputPerMTok: bigint
      reasoningPerMTok: bigint | null
    } | null
  ): bigint {
    const inPrice = price?.inputPerMTok ?? DEFAULT_INPUT_PRICE_PER_MTOK
    const cachedPrice = price?.cachedInputPerMTok ?? DEFAULT_CACHED_PRICE_PER_MTOK
    const outPrice = price?.outputPerMTok ?? DEFAULT_OUTPUT_PRICE_PER_MTOK
    const reasoningPrice = price?.reasoningPerMTok ?? outPrice

    const uncachedIn = Math.max(0, inputTokens - cachedInputTokens)
    const uncachedCost = (BigInt(uncachedIn) * inPrice) / 1_000_000n
    const cachedCost = (BigInt(cachedInputTokens) * cachedPrice) / 1_000_000n
    const outputCost = (BigInt(outputTokens) * outPrice) / 1_000_000n
    const reasoningCost = (BigInt(reasoningTokens) * reasoningPrice) / 1_000_000n

    return uncachedCost + cachedCost + outputCost + reasoningCost
  }

  async recordUsage(items: UsageReportItem[]): Promise<{ count: number; failedIndexes: number[] }> {
    if (!items || items.length === 0) return { count: 0, failedIndexes: [] }

    const failedIndexes: number[] = []
    let count = 0
    for (const [index, item] of items.entries()) {
      try {
        const tenantId = item.tenantId ?? DEFAULT_TENANT_ID
        const userId = item.userId ?? 'system'
        const purpose = this.mapPurpose(item.purpose)
        const status = this.mapStatus(item.status)

        const inputTokens = item.inputTokens ?? 0
        const outputTokens = item.outputTokens ?? 0
        const reasoningTokens = item.reasoningTokens ?? 0
        const cachedInputTokens = item.cachedInputTokens ?? 0
        const totalTokens = item.totalTokens ?? inputTokens + outputTokens

        if (item.runId) {
          const run = await this.prisma.agentRun.findUnique({
            where: { id: item.runId },
            select: { tenantId: true, userId: true }
          })
          if (!run || run.tenantId !== tenantId || run.userId !== userId) {
            throw new Error(`AgentRun ${item.runId} 不属于当前租户或用户`)
          }
          const duplicate = await this.prisma.agentModelCall.findUnique({
            where: { runId_callIndex: { runId: item.runId, callIndex: item.callIndex } }
          })
          if (duplicate) {
            count++
            continue
          }
        }

        // 查找对应模型价格版本
        const price = await this.prisma.aiModelPrice.findFirst({
          where: {
            provider: item.provider,
            model: item.model,
            effectiveFrom: { lte: new Date() },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }]
          },
          orderBy: { effectiveFrom: 'desc' }
        })

        const costMicros = this.calculateCostMicros(
          inputTokens,
          cachedInputTokens,
          outputTokens,
          reasoningTokens,
          price
        )

        // 1. 写入单次 LLM 调用
        await this.prisma.agentModelCall.create({
          data: {
            tenantId,
            userId,
            runId: item.runId ?? null,
            threadId: item.threadId ?? null,
            callIndex: item.callIndex,
            purpose,
            provider: item.provider,
            model: item.model,
            status,
            inputTokens,
            outputTokens,
            reasoningTokens,
            cachedInputTokens,
            totalTokens,
            estimated: item.estimated ?? false,
            priceId: price?.id ?? null,
            priceSnapshot: price
              ? {
                  inputPerMTok: price.inputPerMTok.toString(),
                  cachedInputPerMTok: price.cachedInputPerMTok?.toString() ?? null,
                  outputPerMTok: price.outputPerMTok.toString(),
                  reasoningPerMTok: price.reasoningPerMTok?.toString() ?? null
                }
              : undefined,
            costMicros,
            latencyMs: item.latencyMs ?? null,
            firstTokenMs: item.firstTokenMs ?? null,
            errorCode: item.errorCode ?? null,
            traceId: item.traceId ?? null
          }
        })

        // 2. 如果存在 runId，累加至 AgentRun
        if (item.runId) {
          await this.prisma.agentRun.updateMany({
            where: { id: item.runId },
            data: {
              model: item.model,
              provider: item.provider,
              inputTokens: { increment: inputTokens },
              outputTokens: { increment: outputTokens },
              reasoningTokens: { increment: reasoningTokens },
              cachedInputTokens: { increment: cachedInputTokens },
              totalTokens: { increment: totalTokens },
              costMicros: { increment: costMicros },
              modelCalls: { increment: 1 },
              stepCount: { increment: 1 }
            }
          })
        }

        // 3. 累加日聚合
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        await this.prisma.agentUsageDaily.upsert({
          where: {
            tenantId_date_userId_model_purpose: {
              tenantId,
              date: today,
              userId,
              model: item.model,
              purpose
            }
          },
          update: {
            modelCalls: { increment: 1 },
            inputTokens: { increment: BigInt(inputTokens) },
            outputTokens: { increment: BigInt(outputTokens) },
            reasoningTokens: { increment: BigInt(reasoningTokens) },
            cachedInputTokens: { increment: BigInt(cachedInputTokens) },
            totalTokens: { increment: BigInt(totalTokens) },
            costMicros: { increment: costMicros }
          },
          create: {
            tenantId,
            date: today,
            userId,
            model: item.model,
            purpose,
            modelCalls: 1,
            inputTokens: BigInt(inputTokens),
            outputTokens: BigInt(outputTokens),
            reasoningTokens: BigInt(reasoningTokens),
            cachedInputTokens: BigInt(cachedInputTokens),
            totalTokens: BigInt(totalTokens),
            costMicros
          }
        })

        // 4. 大额 Run 审计检查（单次累计超过 100k tokens 触发）
        if (totalTokens >= 100_000) {
          this.auditService.enqueue({
            tenantId,
            actorId: userId,
            action: 'agent.run.large_usage',
            resource: 'agent_run',
            resourceId: item.runId ?? undefined,
            diff: createAuditDiff({
              summary: `单次模型调用消耗 ${formatTokens(totalTokens)} tokens，产生大额消耗预警`,
              meta: { totalTokens, model: item.model, costMicros: costMicros.toString() }
            })
          })
        }
        count++
      } catch (err) {
        this.logger.error({ err, item }, '写入 Agent 模型调用用量失败')
        failedIndexes.push(index)
      }
    }

    return { count, failedIndexes }
  }

  /**
   * 预检 AI 配额是否超额（租户级与用户级）
   */
  async checkQuota(
    tenantId: string,
    userId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const quotas = await this.prisma.aiQuota.findMany({
      where: {
        tenantId,
        enabled: true,
        OR: [
          { scope: AiQuotaScope.TENANT },
          { scope: AiQuotaScope.USER, subjectId: userId },
          { scope: AiQuotaScope.ORGANIZATION }
        ]
      }
    })

    for (const quota of quotas) {
      const periodStart = this.periodStart(quota.period)
      const userIds = await this.resolveQuotaUsers(quota.scope, quota.subjectId, userId)
      if (userIds !== null && userIds.length === 0) continue

      const usage = await this.prisma.agentUsageDaily.aggregate({
        where: {
          tenantId,
          ...(userIds ? { userId: { in: userIds } } : {}),
          date: { gte: periodStart }
        },
        _sum: { totalTokens: true, costMicros: true }
      })
      const used =
        quota.metric === AiQuotaMetric.COST
          ? (usage._sum.costMicros ?? 0n)
          : (usage._sum.totalTokens ?? 0n)
      const metricName = quota.metric === AiQuotaMetric.COST ? '成本' : 'Token'
      const usedText =
        quota.metric === AiQuotaMetric.COST ? formatCostMicros(used) : formatTokens(used)

      if (quota.hardLimit !== null && used >= quota.hardLimit) {
        const periodLabel = quota.period === AiQuotaPeriod.DAY ? '今日' : '本月'
        this.enqueueQuotaNotice(
          `exceeded:${quota.id}:${periodStart.toISOString()}`,
          tenantId,
          userId,
          'agent.quota.exceeded',
          `${periodLabel} AI ${metricName}配额已用尽（已用 ${usedText} / 上限 ${quota.metric === AiQuotaMetric.COST ? formatCostMicros(quota.hardLimit) : formatTokens(quota.hardLimit)}），新请求已被拒绝`,
          'DENIED'
        )
        return { allowed: false, reason: `${periodLabel} AI ${metricName}配额已用完，请联系管理员` }
      }

      if (quota.softLimit !== null && used >= quota.softLimit) {
        this.enqueueQuotaNotice(
          `warned:${quota.id}:${periodStart.toISOString()}`,
          tenantId,
          userId,
          'agent.quota.warned',
          `AI ${metricName}用量已达到软上限（已用 ${usedText} / 预警线 ${quota.metric === AiQuotaMetric.COST ? formatCostMicros(quota.softLimit) : formatTokens(quota.softLimit)}）`,
          'SUCCESS'
        )
      }
    }

    return { allowed: true }
  }

  private periodStart(period: AiQuotaPeriod): Date {
    const now = new Date()
    if (period === AiQuotaPeriod.DAY) {
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    }
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  }

  private async resolveQuotaUsers(
    scope: AiQuotaScope,
    subjectId: string | null,
    userId: string
  ): Promise<string[] | null> {
    if (scope === AiQuotaScope.USER) return subjectId === userId ? [userId] : []
    if (scope === AiQuotaScope.TENANT) {
      return null
    }
    if (!subjectId) return []
    const members = await this.prisma.userOrganization.findMany({
      where: { organizationId: subjectId },
      select: { userId: true }
    })
    return members.map((member) => member.userId)
  }

  private enqueueQuotaNotice(
    key: string,
    tenantId: string,
    actorId: string,
    action: 'agent.quota.warned' | 'agent.quota.exceeded',
    summary: string,
    result: 'SUCCESS' | 'DENIED'
  ) {
    if (this.quotaNotices.has(key)) return
    this.quotaNotices.add(key)
    this.auditService.enqueue({
      tenantId,
      actorId,
      action,
      resource: 'ai_quota',
      result,
      diff: createAuditDiff({ summary })
    })
  }
}
