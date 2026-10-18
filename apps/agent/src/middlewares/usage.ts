import {
  AGENT_RUN_ID_CONFIGURABLE_KEY,
  AGENT_TENANT_ID_CONFIGURABLE_KEY,
  AGENT_THREAD_ID_CONFIGURABLE_KEY,
  AGENT_TRACE_ID_CONFIGURABLE_KEY,
  AGENT_USER_ID_CONFIGURABLE_KEY,
  DEFAULT_AGENT_RUN_BUDGET
} from '@zen/shared'
import { createMiddleware } from 'langchain'

import { reportUsage } from '@/api/usage-reporter'

const runCallCounters = new Map<string, number>()
const runTokenAccumulators = new Map<string, number>()

function nextCallIndex(runId?: string): number {
  if (!runId) return 0
  const current = runCallCounters.get(runId) ?? 0
  runCallCounters.set(runId, current + 1)
  return current
}

function accumulateTokens(runId: string | undefined, tokens: number): number {
  if (!runId) return tokens
  const current = (runTokenAccumulators.get(runId) ?? 0) + tokens
  runTokenAccumulators.set(runId, current)
  return current
}

interface ModelCallUsageMetadata {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  output_token_details?: {
    reasoning?: number
  }
  input_token_details?: {
    cache_read?: number
  }
}

interface ModelCallResponseMetadata {
  model_name?: string
}

interface ModelResponseMessage {
  content?: unknown
  usage_metadata?: ModelCallUsageMetadata
  response_metadata?: ModelCallResponseMetadata
}

interface ModelCallable {
  model?: string
  modelName?: string
}

function resolveModelCallContext(runtime: unknown): {
  tenantId?: string
  userId?: string
  threadId?: string
  runId?: string
  traceId?: string
} {
  if (!runtime || typeof runtime !== 'object') return {}
  const r = runtime as Record<string, unknown>
  const ctx = (r.context && typeof r.context === 'object' ? r.context : {}) as Record<
    string,
    unknown
  >
  const cfg = (
    r.configurable && typeof r.configurable === 'object' ? r.configurable : {}
  ) as Record<string, unknown>

  const tenantId =
    (typeof ctx[AGENT_TENANT_ID_CONFIGURABLE_KEY] === 'string' &&
      ctx[AGENT_TENANT_ID_CONFIGURABLE_KEY]) ||
    (typeof cfg[AGENT_TENANT_ID_CONFIGURABLE_KEY] === 'string' &&
      cfg[AGENT_TENANT_ID_CONFIGURABLE_KEY]) ||
    (typeof ctx.tenantId === 'string' && ctx.tenantId) ||
    (typeof cfg.tenantId === 'string' && cfg.tenantId) ||
    undefined

  const userId =
    (typeof ctx[AGENT_USER_ID_CONFIGURABLE_KEY] === 'string' &&
      ctx[AGENT_USER_ID_CONFIGURABLE_KEY]) ||
    (typeof cfg[AGENT_USER_ID_CONFIGURABLE_KEY] === 'string' &&
      cfg[AGENT_USER_ID_CONFIGURABLE_KEY]) ||
    (typeof ctx.userId === 'string' && ctx.userId) ||
    (typeof cfg.userId === 'string' && cfg.userId) ||
    undefined

  const threadId =
    (typeof ctx[AGENT_THREAD_ID_CONFIGURABLE_KEY] === 'string' &&
      ctx[AGENT_THREAD_ID_CONFIGURABLE_KEY]) ||
    (typeof cfg[AGENT_THREAD_ID_CONFIGURABLE_KEY] === 'string' &&
      cfg[AGENT_THREAD_ID_CONFIGURABLE_KEY]) ||
    (typeof ctx.threadId === 'string' && ctx.threadId) ||
    (typeof cfg.thread_id === 'string' && cfg.thread_id) ||
    (typeof cfg.threadId === 'string' && cfg.threadId) ||
    undefined

  const runId =
    (typeof ctx[AGENT_RUN_ID_CONFIGURABLE_KEY] === 'string' &&
      ctx[AGENT_RUN_ID_CONFIGURABLE_KEY]) ||
    (typeof cfg[AGENT_RUN_ID_CONFIGURABLE_KEY] === 'string' &&
      cfg[AGENT_RUN_ID_CONFIGURABLE_KEY]) ||
    (typeof ctx.runId === 'string' && ctx.runId) ||
    (typeof cfg.run_id === 'string' && cfg.run_id) ||
    (typeof cfg.runId === 'string' && cfg.runId) ||
    (typeof r.runId === 'string' && r.runId) ||
    undefined

  const traceId =
    (typeof ctx[AGENT_TRACE_ID_CONFIGURABLE_KEY] === 'string' &&
      ctx[AGENT_TRACE_ID_CONFIGURABLE_KEY]) ||
    (typeof cfg[AGENT_TRACE_ID_CONFIGURABLE_KEY] === 'string' &&
      cfg[AGENT_TRACE_ID_CONFIGURABLE_KEY]) ||
    (typeof ctx.traceId === 'string' && ctx.traceId) ||
    undefined

  return { tenantId, userId, threadId, runId, traceId }
}

function estimateTokens(text: string): number {
  if (!text) return 0
  // 中文约 1.5 字符/token，英文约 4 字符/token，保守取平均 1 字符 ≈ 0.7 token
  return Math.max(1, Math.ceil(text.length * 0.7))
}

export function createUsageMiddleware(purpose: 'chat' | 'summarization' = 'chat') {
  return createMiddleware({
    name: 'usageLedger',
    wrapModelCall: async (request, handler) => {
      const started = Date.now()
      const ctx = resolveModelCallContext(request.runtime)
      const runId = ctx.runId
      const callIndex = nextCallIndex(runId)

      // 预算执行：如果任务已累计超过单次任务预算（256,000），拒绝并抛出异常
      const currentAccum = runTokenAccumulators.get(runId ?? '') ?? 0
      if (currentAccum >= DEFAULT_AGENT_RUN_BUDGET.maxTotalTokens) {
        throw new Error(
          `Agent 单次任务已消耗 ${currentAccum} tokens，达到单次最大预算 ${DEFAULT_AGENT_RUN_BUDGET.maxTotalTokens}`
        )
      }

      try {
        const res = await handler(request)
        const msg = Array.isArray(res) ? res[res.length - 1] : res
        const responseMsg = msg as unknown as ModelResponseMessage | undefined
        const modelObj = request.model as unknown as ModelCallable | undefined
        const usage = responseMsg?.usage_metadata
        const modelName =
          responseMsg?.response_metadata?.model_name ??
          modelObj?.modelName ??
          modelObj?.model ??
          'deepseek-flash'

        let inputTokens = usage?.input_tokens ?? 0
        let outputTokens = usage?.output_tokens ?? 0
        const reasoningTokens = usage?.output_token_details?.reasoning ?? 0
        const cachedInputTokens = usage?.input_token_details?.cache_read ?? 0
        const isEstimated = !usage || (inputTokens === 0 && outputTokens === 0)

        if (isEstimated) {
          const inputCharCount = request.messages.reduce((acc, m) => {
            const contentStr = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
            return acc + (contentStr?.length ?? 0)
          }, 0)
          const outputCharCount =
            typeof responseMsg?.content === 'string'
              ? responseMsg.content.length
              : JSON.stringify(responseMsg?.content ?? '').length

          inputTokens = estimateTokens(inputCharCount > 0 ? ' '.repeat(inputCharCount) : 'default')
          outputTokens = estimateTokens(
            outputCharCount > 0 ? ' '.repeat(outputCharCount) : 'default'
          )
        }

        const totalTokens = usage?.total_tokens ?? inputTokens + outputTokens

        accumulateTokens(runId, totalTokens)

        reportUsage({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          runId: ctx.runId,
          threadId: ctx.threadId,
          callIndex,
          purpose,
          provider: 'openai',
          model: modelName,
          status: 'succeeded',
          inputTokens,
          outputTokens,
          reasoningTokens,
          cachedInputTokens,
          totalTokens,
          estimated: isEstimated,
          latencyMs: Date.now() - started,
          traceId: ctx.traceId
        })

        return res
      } catch (error) {
        reportUsage({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          runId: ctx.runId,
          threadId: ctx.threadId,
          callIndex,
          purpose,
          provider: 'openai',
          model:
            (request.model as unknown as ModelCallable | undefined)?.modelName ??
            (request.model as unknown as ModelCallable | undefined)?.model ??
            'deepseek-flash',
          status: 'failed',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimated: true,
          errorCode: String((error as Error)?.name || 'UNKNOWN'),
          latencyMs: Date.now() - started,
          traceId: ctx.traceId
        })
        throw error
      }
    }
  })
}
