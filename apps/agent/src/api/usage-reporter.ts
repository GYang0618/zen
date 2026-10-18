import { configs } from '../configs/env'

export type UsageReportPayload = {
  tenantId?: string
  userId?: string
  runId?: string | null
  threadId?: string | null
  callIndex: number
  purpose: 'chat' | 'summarization' | 'title' | 'fallback'
  provider: string
  model: string
  status: 'succeeded' | 'failed' | 'aborted'
  inputTokens: number
  outputTokens: number
  reasoningTokens?: number
  cachedInputTokens?: number
  totalTokens?: number
  estimated?: boolean
  latencyMs?: number
  errorCode?: string
  traceId?: string
}

type QueuedUsage = UsageReportPayload & { attempts: number }

const queue: QueuedUsage[] = []
let timer: NodeJS.Timeout | null = null
let isFlushing = false

const BATCH_SIZE = 20
const FLUSH_INTERVAL_MS = 1000
const MAX_RETRIES = 5

function ensureTimer() {
  if (timer) return
  timer = setInterval(() => {
    void flushUsageQueue()
  }, FLUSH_INTERVAL_MS)
}

export function reportUsage(item: UsageReportPayload): void {
  queue.push({ ...item, attempts: 0 })
  ensureTimer()
  if (queue.length >= BATCH_SIZE) {
    void flushUsageQueue()
  }
}

export async function flushUsageQueue(): Promise<void> {
  if (isFlushing || queue.length === 0) return
  isFlushing = true
  const batch = queue.splice(0, BATCH_SIZE)

  try {
    const baseUrl = configs.apiBaseUrl.replace(/\/$/, '')
    const prefix = baseUrl.endsWith('/api') ? '' : '/api'
    const url = `${baseUrl}${prefix}/copilot/runtime/usage`
    const headers: Record<string, string> = {
      'content-type': 'application/json'
    }
    if (configs.agentInternalToken) {
      headers['x-agent-internal-token'] = configs.agentInternalToken
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items: batch.map(({ attempts: _attempts, ...item }) => item)
      })
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const result = (await res.json()) as { failedIndexes?: number[] }
    const failedIndexes = new Set(result.failedIndexes ?? [])
    if (failedIndexes.size > 0) {
      const retryable = batch
        .filter((_, index) => failedIndexes.has(index))
        .filter((item) => item.attempts < MAX_RETRIES)
        .map((item) => ({ ...item, attempts: item.attempts + 1 }))
      if (retryable.length > 0) queue.unshift(...retryable)
    }
  } catch (err) {
    console.warn('[UsageReporter] 上报用量请求异常:', err)
    const retryable = batch
      .filter((item) => item.attempts < MAX_RETRIES)
      .map((item) => ({ ...item, attempts: item.attempts + 1 }))
    if (retryable.length > 0) {
      queue.unshift(...retryable)
      const maxAttempt = Math.max(...retryable.map((item) => item.attempts))
      setTimeout(() => void flushUsageQueue(), Math.min(30_000, 500 * 2 ** maxAttempt))
    }
  } finally {
    isFlushing = false
    if (queue.length >= BATCH_SIZE) {
      void flushUsageQueue()
    }
  }
}

// 进程关闭前尝试冲刷
process.on('beforeExit', () => {
  void flushUsageQueue()
})
