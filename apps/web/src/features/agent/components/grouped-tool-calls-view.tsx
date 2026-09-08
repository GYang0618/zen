import { useRenderToolCall } from '@copilotkit/react-core/v2'
import { Fragment } from 'react'

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
        const toolMessage = messages.find(
          (message) => message.role === 'tool' && message.toolCallId === toolCall.id
        )
        return (
          <Fragment key={toolCall.id}>
            {renderToolCall({
              toolCall: toolCall as never,
              toolMessage: toolMessage as never
            })}
          </Fragment>
        )
      })}
    </>
  )
}
