import { LangGraphAgent } from '@ag-ui/langgraph'
import {
  ACCESS_TOKEN_CONFIGURABLE_KEY,
  AGENT_LOCALE_CONFIGURABLE_KEY,
  AGENT_MEMORY_CONFIGURABLE_KEY,
  AGENT_MODEL_METADATA_CONFIGURABLE_KEY,
  AGENT_PERMISSIONS_CONFIGURABLE_KEY,
  AGENT_RUN_ID_CONFIGURABLE_KEY,
  AGENT_TENANT_ID_CONFIGURABLE_KEY,
  AGENT_THREAD_ID_CONFIGURABLE_KEY,
  AGENT_USER_ID_CONFIGURABLE_KEY,
  DEFAULT_AGENT_GRAPH_ID,
  DEFAULT_AGENT_RUN_BUDGET,
  DEFAULT_AGENT_VERSIONS,
  PAGE_AGENT_GRAPH_ID
} from '@zen/shared'

import { bridgeOpenTextToToolCall } from './bridge-text-to-tool-call.js'

import type { ProcessedEvents } from '@ag-ui/langgraph'
import type { AuthContext } from '@zen/shared'

const agents = {
  default: { graphId: DEFAULT_AGENT_GRAPH_ID },
  page: { graphId: PAGE_AGENT_GRAPH_ID }
} as const

function userStopped(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError')
}

/**
 * 适配器自带的 abortRun 会拿 CopilotKit 的 runId 去取消 LangGraph。
 * 真正的服务端 run id 要等流事件才写回，而且取消一旦记下就不再重试，流也不会主动断开。
 * 这里改成：立刻中止这条流的请求，并按 thread 取消仍在跑的 LangGraph run。
 */
class StreamingLangGraphAgent extends LangGraphAgent {
  private stoppedByUser = false
  private streamAbort: AbortController | undefined

  override abortRun(): void {
    this.stoppedByUser = true
    this.streamAbort?.abort(userStopped())
    this.closeRun()
    this.cancelActiveThreadRuns()
  }

  override runAgentStream(
    ...args: Parameters<LangGraphAgent['runAgentStream']>
  ): ReturnType<LangGraphAgent['runAgentStream']> {
    if (!this.stoppedByUser) return super.runAgentStream(...args)
    this.closeSubscriber(args[1])
    return Promise.resolve()
  }

  override prepareStream(
    ...args: Parameters<LangGraphAgent['prepareStream']>
  ): ReturnType<LangGraphAgent['prepareStream']> {
    if (this.stoppedByUser) return Promise.reject(userStopped())
    return super.prepareStream(this.withStopSignal(args[0]), args[1])
  }

  override prepareRegenerateStream(
    ...args: Parameters<LangGraphAgent['prepareRegenerateStream']>
  ): ReturnType<LangGraphAgent['prepareRegenerateStream']> {
    if (this.stoppedByUser) return Promise.reject(userStopped())
    return super.prepareRegenerateStream(this.withStopSignal(args[0]), args[1])
  }

  override dispatchEvent(event: ProcessedEvents): boolean {
    if (this.stoppedByUser) return false
    if (typeof event.timestamp !== 'number') event.timestamp = Date.now()
    return super.dispatchEvent(event)
  }

  override handleSingleEvent(event: unknown): void {
    if (this.stoppedByUser) return
    if (bridgeOpenTextToToolCall(this, event)) return
    super.handleSingleEvent(event)
  }

  private withStopSignal<T extends Parameters<LangGraphAgent['prepareStream']>[0]>(input: T): T {
    const abort = new AbortController()
    this.streamAbort = abort
    return {
      ...input,
      forwardedProps: {
        ...input.forwardedProps,
        signal: abort.signal,
        onDisconnect: 'cancel'
      }
    }
  }

  private closeRun(): void {
    this.closeSubscriber(this.subscriber)
  }

  private closeSubscriber(
    subscriber: { closed: boolean; error: (error: unknown) => void } | undefined
  ): void {
    if (!subscriber || subscriber.closed) return
    subscriber.error(userStopped())
  }

  private cancelActiveThreadRuns(): void {
    const threadId = this.activeRun?.threadId || this.threadId
    if (!threadId) return
    void this.client.runs
      .cancelMany({ threadId, status: 'all', action: 'interrupt' })
      .catch(() => undefined)
  }
}

export const defaultAgent = ({
  deploymentUrl,
  accessToken,
  auth,
  locale = 'zh-CN',
  threadId,
  runId,
  memory
}: {
  deploymentUrl: string
  accessToken?: string
  auth?: Pick<AuthContext, 'tenantId' | 'userId' | 'permissions'>
  locale?: string
  threadId?: string
  runId?: string
  memory?: string
}) => {
  const configurable = {
    ...(accessToken ? { [ACCESS_TOKEN_CONFIGURABLE_KEY]: accessToken } : {}),
    ...(auth?.tenantId ? { [AGENT_TENANT_ID_CONFIGURABLE_KEY]: auth.tenantId } : {}),
    ...(auth?.userId ? { [AGENT_USER_ID_CONFIGURABLE_KEY]: auth.userId } : {}),
    ...(threadId ? { [AGENT_THREAD_ID_CONFIGURABLE_KEY]: threadId } : {}),
    ...(runId ? { [AGENT_RUN_ID_CONFIGURABLE_KEY]: runId } : {}),
    [AGENT_LOCALE_CONFIGURABLE_KEY]: locale,
    [AGENT_PERMISSIONS_CONFIGURABLE_KEY]: auth?.permissions ?? [],
    [AGENT_MODEL_METADATA_CONFIGURABLE_KEY]: {
      provider: 'qwen',
      model: DEFAULT_AGENT_VERSIONS.model,
      promptVersion: DEFAULT_AGENT_VERSIONS.prompt,
      toolSchemaVersion: DEFAULT_AGENT_VERSIONS.toolSchema
    },
    ...(memory ? { [AGENT_MEMORY_CONFIGURABLE_KEY]: memory } : {})
  }

  return new StreamingLangGraphAgent({
    deploymentUrl,
    graphId: agents.default.graphId,
    emitInterruptOutcome: true,
    ...(accessToken ? { propertyHeaders: { Authorization: `Bearer ${accessToken}` } } : {}),
    assistantConfig: {
      recursion_limit: DEFAULT_AGENT_RUN_BUDGET.recursionLimit,
      ...(Object.keys(configurable).length ? { configurable } : {})
    }
  })
}

export const pageAgent = ({
  deploymentUrl,
  accessToken
}: {
  deploymentUrl: string
  accessToken?: string
}) =>
  new StreamingLangGraphAgent({
    deploymentUrl,
    graphId: agents.page.graphId,
    emitInterruptOutcome: true,
    ...(accessToken ? { propertyHeaders: { Authorization: `Bearer ${accessToken}` } } : {})
  })
