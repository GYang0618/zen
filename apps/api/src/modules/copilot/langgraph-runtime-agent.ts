import { LangGraphAgent as CopilotkitLangGraphAgent } from '@copilotkit/runtime/langgraph'

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
  LangGraphStreamEvent,
  ReasoningProcessHolder,
  ToolCallStreamSink
} from './langgraph-tool-call-stream'

interface AguiMessage {
  role: string
}

/**
 * CopilotKit LangGraphAgent 扩展：
 * - 解析 Qwen reasoning_content
 * - 在模型结束 / 工具开始时补发工具调用事件，避免批量工具卡到全部完成才出卡片
 */
export class LangGraphAgent extends CopilotkitLangGraphAgent {
  run(input: Parameters<CopilotkitLangGraphAgent['run']>[0]) {
    return super.run(filterLangGraphInputMessages(input))
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
