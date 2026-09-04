import { useRenderToolCall } from '@copilotkit/react-core/v2'
import { Fragment } from 'react'

import { hasDedicatedResultUi } from '@/components/ai/tool-display'

import { getToolCallName } from '../lib/group-tool-calls'

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

function isDedicatedResultToolCall(toolCall: ToolCallLike): toolCall is CopilotKitToolCall {
  return Boolean(toolCall.id && hasDedicatedResultUi(getToolCallName(toolCall)))
}

export function GroupedToolCallsView({ toolCalls, messages }: GroupedToolCallsViewProps) {
  const renderToolCall = useRenderToolCall()
  const dedicatedToolCalls = toolCalls.filter(isDedicatedResultToolCall)

  if (dedicatedToolCalls.length === 0) return null

  return (
    <>
      {dedicatedToolCalls.map((toolCall) => {
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
