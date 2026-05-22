import { LangGraphAgent as CopilotkitLangGraphAgent } from '@copilotkit/runtime/langgraph'

const ON_CHAT_MODEL_STREAM = 'on_chat_model_stream'

interface LangGraphStreamEvent {
  event?: string
  data?: unknown
}

interface ReasoningChunk {
  chunk?: {
    additional_kwargs?: {
      reasoning_content?: string | null
    }
  }
}

interface AguiMessage {
  role: string
}

export class LangGraphAgent extends CopilotkitLangGraphAgent {
  run(input: Parameters<CopilotkitLangGraphAgent['run']>[0]) {
    return super.run(filterLangGraphInputMessages(input))
  }

  handleSingleEvent(event: unknown): void {
    const streamEvent = event as LangGraphStreamEvent
    if (streamEvent.event === ON_CHAT_MODEL_STREAM) {
      const reasoningData = resolveReasoningContent(streamEvent.data)
      if (reasoningData) {
        this.handleReasoningEvent(reasoningData)
        return
      }
    }

    super.handleSingleEvent(event)
  }
}

function resolveReasoningContent(
  data: unknown
): { text: string; type: 'text'; index: number } | null {
  const reasoningContent = (data as ReasoningChunk)?.chunk?.additional_kwargs?.reasoning_content

  if (typeof reasoningContent !== 'string' || reasoningContent.length === 0) {
    return null
  }

  return {
    text: reasoningContent,
    type: 'text',
    index: 0
  }
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
