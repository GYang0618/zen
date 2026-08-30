import { LangGraphAgent as CopilotkitLangGraphAgent } from '@copilotkit/runtime/langgraph'
import { DEFAULT_AGENT_GRAPH_ID, DEFAULT_AGENT_RUN_BUDGET } from '@zen/shared'

import {
  chunkHasAssistantDelta,
  emitPendingToolCalls,
  extractToolCallFromToolStart,
  extractToolCallsFromModelEnd,
  LANGGRAPH_EVENT,
  resolveReasoningContent,
  runWithoutReasoningProcess
} from './langgraph-tool-call-stream'

import type {
  DefaultAgentRuntimeHooks,
  RuntimeEvent,
  RuntimeRunInput
} from './default-agent-runtime.types'
import type {
  LangGraphStreamEvent,
  ReasoningProcessHolder,
  ToolCallStreamSink
} from './langgraph-tool-call-stream'

interface RunControl {
  register: (runId: string, abort: () => void) => void
  unregister: (runId: string, abort: () => void) => void
}

interface AguiMessage {
  role: string
}

const LEGACY_INTERRUPT_EVENT_NAME = 'on_interrupt'
const INTERRUPT_ID_FIELD = '__zenInterruptId'

/**
 * CopilotKit LangGraphAgent 扩展：
 * - 解析 Qwen reasoning_content
 * - 在模型结束 / 工具开始时补发工具调用事件，避免批量工具卡到全部完成才出卡片
 */
export class LangGraphAgent extends CopilotkitLangGraphAgent {
  private runtimeHooks?: DefaultAgentRuntimeHooks
  private runControl?: RunControl

  setRuntimeHooks(hooks: DefaultAgentRuntimeHooks): this {
    this.runtimeHooks = hooks
    return this
  }

  setRunControl(runControl: RunControl): this {
    this.runControl = runControl
    return this
  }

  override clone(): this {
    const cloned = super.clone() as this
    cloned.runtimeHooks = this.runtimeHooks
    cloned.runControl = this.runControl
    return cloned
  }

  dispatchEvent(event: Parameters<CopilotkitLangGraphAgent['dispatchEvent']>[0]): boolean {
    if (this.graphId !== DEFAULT_AGENT_GRAPH_ID) return super.dispatchEvent(event)

    const record = asRecord(event)
    if (record?.type !== 'CUSTOM' || record.name !== LEGACY_INTERRUPT_EVENT_NAME) {
      return super.dispatchEvent(event)
    }
    const rawEvent = asRecord(record.rawEvent)
    const value = parseRecord(record.value)
    const interruptId = typeof rawEvent?.id === 'string' ? rawEvent.id : undefined
    if (!value || !interruptId) return super.dispatchEvent(event)

    return super.dispatchEvent({
      ...event,
      value: JSON.stringify({ ...value, [INTERRUPT_ID_FIELD]: interruptId })
    })
  }

  run(input: Parameters<CopilotkitLangGraphAgent['run']>[0]) {
    const runtimeInput = filterLangGraphInputMessages(input)
    const stream = super.run(runtimeInput)

    // LangGraph Platform 的 runs.stream 请求不会替运行本身设置超时；Default
    // Agent 需要在连接长期无响应时主动取消，避免一直占用前端 Run。
    if (this.graphId !== DEFAULT_AGENT_GRAPH_ID) {
      return stream
    }

    return stream.lift({
      call: (subscriber, source) => {
        let settled = false
        let subscription: ReturnType<typeof source.subscribe> | undefined
        let persistence = Promise.resolve()
        let persistenceError: unknown
        let modelCalls = 0
        let totalTokens = 0
        let failures = 0
        let timeout: ReturnType<typeof setTimeout> | undefined
        const runtimeInputForHooks = runtimeInput as RuntimeRunInput
        const abortCurrentRun = () => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          unregisterRun()
          this.abortRun()
          subscription?.unsubscribe()
          subscriber.error(new Error('Default Agent run cancelled'))
        }
        const unregisterRun = () =>
          this.runControl?.unregister(runtimeInputForHooks.runId, abortCurrentRun)
        const enqueuePersistence = (
          task: () => Promise<void> | void,
          reportFailure = true
        ) => {
          persistence = persistence.then(async () => {
            if (persistenceError) return
            try {
              await task()
            } catch (error) {
              persistenceError = error
              if (!reportFailure) return
              if (!settled) {
                settled = true
                unregisterRun()
                clearTimeout(timeout)
                this.abortRun()
                subscription?.unsubscribe()
              }
              try {
                await this.runtimeHooks?.onError(runtimeInputForHooks, error)
              } catch {
                // 保留首个持久化错误，后续恢复失败由运维对账 Lease。
              }
              subscriber.error(error)
            }
          })
        }
        const afterPersistence = (onSuccess: () => void) => {
          void persistence.then(() => {
            if (persistenceError) {
              subscriber.error(persistenceError)
              return
            }
            onSuccess()
          })
        }
        timeout = setTimeout(() => {
          if (settled) return

          settled = true
          unregisterRun()
          this.abortRun()
          subscription?.unsubscribe()
          const error = new Error('Default Agent run timed out')
          enqueuePersistence(() => this.runtimeHooks?.onError(runtimeInputForHooks, error), false)
          afterPersistence(() => subscriber.error(error))
        }, DEFAULT_AGENT_RUN_BUDGET.timeoutMs)
        this.runControl?.register(runtimeInputForHooks.runId, abortCurrentRun)

        const subscribe = () => {
          subscription = source.subscribe({
            next: (event) => {
              const budgetError = updateRunBudget(event as RuntimeEvent, {
                modelCalls,
                totalTokens,
                failures
              })
              modelCalls = budgetError.usage.modelCalls
              totalTokens = budgetError.usage.totalTokens
              failures = budgetError.usage.failures
              if (budgetError.error) {
                settled = true
                unregisterRun()
                clearTimeout(timeout)
                this.abortRun()
                subscription?.unsubscribe()
                enqueuePersistence(
                  () => this.runtimeHooks?.onError(runtimeInputForHooks, budgetError.error),
                  false
                )
                afterPersistence(() => subscriber.error(budgetError.error))
                return
              }
              enqueuePersistence(() =>
                this.runtimeHooks?.onEvent(runtimeInputForHooks, event as RuntimeEvent)
              )
              subscriber.next(event)
            },
            error: (error) => {
              if (settled) return
              settled = true
              unregisterRun()
              clearTimeout(timeout)
              enqueuePersistence(() => this.runtimeHooks?.onError(runtimeInputForHooks, error), false)
              afterPersistence(() => subscriber.error(error))
            },
            complete: () => {
              if (settled) return
              settled = true
              unregisterRun()
              clearTimeout(timeout)
              enqueuePersistence(() => this.runtimeHooks?.onComplete(runtimeInputForHooks))
              afterPersistence(() => subscriber.complete())
            }
          })
        }

        void Promise.resolve(this.runtimeHooks?.onStart(runtimeInputForHooks)).then(
          subscribe,
          (error) => {
            settled = true
            unregisterRun()
            clearTimeout(timeout)
            subscriber.error(error)
          }
        )

        return () => {
          // HTTP/浏览器订阅结束只停止向该客户端推送。source 使用独立订阅继续排空，
          // 使 Run、事件和 Checkpoint 能在断线后继续持久化；显式取消由 RunControl 处理。
        }
      }
    }) as typeof stream
  }

  handleSingleEvent(event: unknown): void {
    const streamEvent = event as LangGraphStreamEvent

    if (streamEvent.event === LANGGRAPH_EVENT.ON_CHAT_MODEL_STREAM) {
      const reasoningData = resolveReasoningContent(streamEvent.data)
      if (reasoningData) {
        this.handleReasoningEvent(reasoningData)
        if (!chunkHasAssistantDelta(streamEvent.data)) {
          return
        }

        runWithoutReasoningProcess(this.asReasoningHolder(), () => {
          super.handleSingleEvent(event)
        })
        return
      }
    }

    super.handleSingleEvent(event)

    if (streamEvent.event === LANGGRAPH_EVENT.ON_CHAT_MODEL_END) {
      emitPendingToolCalls(
        this.asToolCallStreamSink(),
        extractToolCallsFromModelEnd(streamEvent.data),
        event
      )
      return
    }

    if (streamEvent.event === LANGGRAPH_EVENT.ON_TOOL_START) {
      const toolCall = extractToolCallFromToolStart(streamEvent)
      if (toolCall) {
        emitPendingToolCalls(this.asToolCallStreamSink(), [toolCall], event)
      }
    }
  }

  private asToolCallStreamSink(): ToolCallStreamSink {
    return this as unknown as ToolCallStreamSink
  }

  private asReasoningHolder(): ReasoningProcessHolder {
    return this as unknown as ReasoningProcessHolder
  }
}

type RunBudgetUsage = { modelCalls: number; totalTokens: number; failures: number }

function updateRunBudget(
  event: RuntimeEvent,
  usage: RunBudgetUsage
): { usage: RunBudgetUsage; error?: Error } {
  const next = { ...usage }
  if (event.type === 'RAW') {
    const raw = asRecord(event.event) ?? asRecord(event.rawEvent) ?? asRecord(event)
    if (raw?.event === 'on_chat_model_end') {
      next.modelCalls += 1
      next.totalTokens += findRawTokenUsage(raw)
    }
  }
  if (event.type === 'TOOL_CALL_RESULT') {
    const result = parseRecord(event.content ?? event.result)
    if (result?.success === false) next.failures += 1
  }
  const exceeded =
    next.modelCalls > DEFAULT_AGENT_RUN_BUDGET.maxModelCalls ||
    next.totalTokens > DEFAULT_AGENT_RUN_BUDGET.maxTotalTokens ||
    next.failures > DEFAULT_AGENT_RUN_BUDGET.maxFailures
  return {
    usage: next,
    ...(exceeded ? { error: new Error('Default Agent run budget exceeded') } : {})
  }
}

function findRawTokenUsage(value: unknown, depth = 0): number {
  if (depth > 5) return 0
  const record = asRecord(value)
  if (!record) return 0
  const usage =
    asRecord(record.usage) ?? asRecord(record.usage_metadata) ?? asRecord(record.tokenUsage)
  if (usage) {
    const input = Number(usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokens ?? 0)
    const output = Number(
      usage.output_tokens ?? usage.completion_tokens ?? usage.completionTokens ?? 0
    )
    return (Number.isFinite(input) ? input : 0) + (Number.isFinite(output) ? output : 0)
  }
  for (const child of Object.values(record)) {
    const tokens = findRawTokenUsage(child, depth + 1)
    if (tokens) return tokens
  }
  return 0
}

/** 仅用于 UI 展示，不应写入 LangGraph 会话状态或回传给模型 */
const EXCLUDED_AGUI_MESSAGE_ROLES = new Set(['reasoning', 'activity'])

/**
 * CopilotKit 会把 `reasoning` / `activity` 留在消息历史里；回传到 LangGraph 时
 * `aguiMessagesToLangChain` 不支持这些 role，会导致第二轮起 `RUN_ERROR`。
 */
function filterLangGraphInputMessages<T extends { messages: AguiMessage[] }>(input: T): T {
  return {
    ...input,
    messages: input.messages.filter((message) => !EXCLUDED_AGUI_MESSAGE_ROLES.has(message.role))
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function parseRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'string') return asRecord(value)
  try {
    return asRecord(JSON.parse(value))
  } catch {
    return undefined
  }
}
