import type { LangGraphAgent, ProcessedEvents } from '@ag-ui/langgraph'

const CHAT_MODEL_STREAM = 'on_chat_model_stream'

interface ToolCallChunk {
  id?: string
  name?: string
  args?: string
}

interface ChatModelStreamEvent {
  event?: string
  metadata?: Record<string, unknown>
  data?: {
    chunk?: {
      id?: string
      tool_call_chunks?: ToolCallChunk[]
      response_metadata?: { finish_reason?: string | null }
    }
  }
}

interface OpeningToolCall {
  toolCallId: string
  toolCallName: string
  args?: string
}

function isChatModelStream(event: unknown): event is ChatModelStreamEvent {
  if (!event || typeof event !== 'object') return false
  return (event as ChatModelStreamEvent).event === CHAT_MODEL_STREAM
}

function readOpeningToolChunk(event: ChatModelStreamEvent): OpeningToolCall | undefined {
  const chunk = event.data?.chunk?.tool_call_chunks?.[0]
  const toolCallId = chunk?.id
  const toolCallName = chunk?.name
  if (!toolCallId || !toolCallName) return undefined
  const args = typeof chunk.args === 'string' && chunk.args.length > 0 ? chunk.args : undefined
  return { toolCallId, toolCallName, args }
}

/**
 * 正文还开着时，`@ag-ui/langgraph` 会把第一个带工具名的 chunk 只用来结束正文，
 * 然后直接 break。工具名因此到不了 TOOL_CALL_START，后续参数增量也对不上调用，
 * 直到工具结束才一次性补发。同一 chunk 上先结束正文，再开始工具流。
 */
export function bridgeOpenTextToToolCall(agent: LangGraphAgent, event: unknown): boolean {
  if (!isChatModelStream(event)) return false
  if (event.data?.chunk?.response_metadata?.finish_reason) return false
  if (event.metadata?.['emit-tool-calls'] === false) return false

  const runId = agent.activeRun?.id
  if (!runId) return false
  const current = agent.getMessageInProgress(runId)
  if (!current?.id || current.toolCallId) return false

  const opening = readOpeningToolChunk(event)
  if (!opening) return false

  startToolAfterText(agent, runId, current.id, opening, event)
  return true
}

function startToolAfterText(
  agent: LangGraphAgent,
  runId: string,
  messageId: string,
  opening: OpeningToolCall,
  rawEvent: unknown
): void {
  agent.dispatchEvent(textMessageEnd(messageId, rawEvent))
  agent.messagesInProcess[runId] = null
  agent.dispatchEvent(toolCallStart(opening.toolCallId, opening.toolCallName, messageId, rawEvent))
  agent.emittedToolCallStartIds.add(opening.toolCallId)
  agent.setMessageInProgress(runId, {
    id: messageId,
    toolCallId: opening.toolCallId,
    toolCallName: opening.toolCallName
  })
  if (agent.activeRun) agent.activeRun.hasFunctionStreaming = true
  if (!opening.args) return
  agent.dispatchEvent(toolCallArgs(opening.toolCallId, opening.args, rawEvent))
}

/** EventType 定义在传递依赖里，按 AG-UI 协议字面量收口。 */
function textMessageEnd(messageId: string, rawEvent: unknown): ProcessedEvents {
  return { type: 'TEXT_MESSAGE_END', messageId, rawEvent } as ProcessedEvents
}

function toolCallStart(
  toolCallId: string,
  toolCallName: string,
  parentMessageId: string,
  rawEvent: unknown
): ProcessedEvents {
  return {
    type: 'TOOL_CALL_START',
    toolCallId,
    toolCallName,
    parentMessageId,
    rawEvent
  } as ProcessedEvents
}

function toolCallArgs(toolCallId: string, delta: string, rawEvent: unknown): ProcessedEvents {
  return { type: 'TOOL_CALL_ARGS', toolCallId, delta, rawEvent } as ProcessedEvents
}
