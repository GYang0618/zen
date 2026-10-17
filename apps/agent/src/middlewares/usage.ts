import { DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'
import { createMiddleware } from 'langchain'

import { resolveToolExecutionContext } from '@/api/tool-execution-context'
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
  usage_metadata?: ModelCallUsageMetadata
  response_metadata?: ModelCallResponseMetadata
}

interface ModelCallable {
  model?: string
}

export function createUsageMiddleware(purpose: 'chat' | 'summarization' = 'chat') {
  return createMiddleware({
    name: 'usageLedger',
    wrapModelCall: async (request, handler) => {
      const started = Date.now()
      const resolved = resolveToolExecutionContext(
        request.runtime as unknown as Parameters<typeof resolveToolExecutionContext>[0]
      )
      const ctx = 'context' in resolved ? resolved.context : undefined
      const runId = ctx?.runId
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
          responseMsg?.response_metadata?.model_name ?? modelObj?.model ?? 'deepseek-flash'

        const inputTokens = usage?.input_tokens ?? 0
        const outputTokens = usage?.output_tokens ?? 0
        const reasoningTokens = usage?.output_token_details?.reasoning ?? 0
        const cachedInputTokens = usage?.input_token_details?.cache_read ?? 0
        const totalTokens = usage?.total_tokens ?? inputTokens + outputTokens

        accumulateTokens(runId, totalTokens)

        reportUsage({
          tenantId: ctx?.tenantId,
          userId: ctx?.userId,
          runId: ctx?.runId,
          threadId: ctx?.threadId,
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
          estimated: !usage,
          latencyMs: Date.now() - started,
          traceId: ctx?.traceId
        })

        return res
      } catch (error) {
        reportUsage({
          tenantId: ctx?.tenantId,
          userId: ctx?.userId,
          runId: ctx?.runId,
          threadId: ctx?.threadId,
          callIndex,
          purpose,
          provider: 'openai',
          model: (request.model as unknown as ModelCallable | undefined)?.model ?? 'deepseek-flash',
          status: 'failed',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimated: true,
          errorCode: String((error as Error)?.name || 'UNKNOWN'),
          latencyMs: Date.now() - started,
          traceId: ctx?.traceId
        })
        throw error
      }
    }
  })
}
