import { useRenderToolCall } from '@copilotkit/react-core/v2'

import type { ToolCallLike } from '../lib/group-tool-calls'

interface ToolResultMessage {
  role: string
  toolCallId?: string
  content?: unknown
}

interface GroupedToolCallsViewProps {
  toolCalls: ToolCallLike[]
  messages: ToolResultMessage[]
}

interface CopilotKitToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

function isValidToolCall(toolCall: ToolCallLike): toolCall is CopilotKitToolCall {
  return Boolean(toolCall.id && toolCall.function?.name)
}

export function GroupedToolCallsView({ toolCalls, messages }: GroupedToolCallsViewProps) {
  const renderToolCall = useRenderToolCall()
  const validToolCalls = toolCalls.filter(isValidToolCall)

  if (validToolCalls.length === 0) return null

  return (
    <>
      {validToolCalls.map((toolCall) => {
        const toolMessage = messages.find((message) => {
          if (message.role !== 'tool') return false
          const candidate = message as { toolCallId?: string; tool_call_id?: string }
          return candidate.toolCallId === toolCall.id || candidate.tool_call_id === toolCall.id
        })
        return (
          <div key={toolCall.id} className="my-2 w-full">
            {renderToolCall({
              toolCall: toolCall as never,
              toolMessage: toolMessage as never
            })}
          </div>
        )
      })}
    </>
  )
}
