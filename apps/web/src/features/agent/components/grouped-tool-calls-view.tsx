import { useRenderToolCall } from '@copilotkit/react-core/v2'

import { isToolCallDisplayHidden, parseToolCallArguments } from '../lib/group-tool-calls'
import { DefaultToolCard } from '../renderers/default'

import type { ToolCallLike } from '../lib/group-tool-calls'

interface ToolResultMessage {
  role: string
  toolCallId?: string
  content?: unknown
}

interface GroupedToolCallsViewProps {
  toolCalls: ToolCallLike[]
  messages: ToolResultMessage[]
  /** work：轨迹中的调用步骤。surface：专属结果界面。 */
  placement?: 'work' | 'surface'
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

function readResultText(content: unknown): string | undefined {
  if (typeof content === 'string') return content
  if (content === undefined || content === null) return undefined
  try {
    return JSON.stringify(content)
  } catch {
    return undefined
  }
}

function findToolMessage(toolCallId: string, messages: ToolResultMessage[]) {
  return messages.find((message) => {
    if (message.role !== 'tool') return false
    const candidate = message as { toolCallId?: string; tool_call_id?: string }
    return candidate.toolCallId === toolCallId || candidate.tool_call_id === toolCallId
  })
}

/** 工作轨迹里的调用步骤。专属结果界面由回合末单独渲染。 */
function EvidenceToolCard({
  toolCall,
  toolMessage
}: {
  toolCall: CopilotKitToolCall
  toolMessage: ToolResultMessage | undefined
}) {
  const hasResult = toolMessage !== undefined
  const parameters = parseToolCallArguments(toolCall) ?? toolCall.function.arguments
  const status = hasResult
    ? 'complete'
    : parseToolCallArguments(toolCall)
      ? 'executing'
      : 'inProgress'

  return (
    <DefaultToolCard
      name={toolCall.function.name}
      toolCallId={toolCall.id}
      parameters={parameters}
      status={status}
      result={readResultText(toolMessage?.content)}
    />
  )
}

export function GroupedToolCallsView({
  toolCalls,
  messages,
  placement = 'surface'
}: GroupedToolCallsViewProps) {
  const renderToolCall = useRenderToolCall()
  const validToolCalls = toolCalls.filter(isValidToolCall)

  if (validToolCalls.length === 0) return null

  return (
    <>
      {validToolCalls.map((toolCall) => {
        const toolMessage = findToolMessage(toolCall.id, messages)
        const showStep = placement === 'work' || isToolCallDisplayHidden(toolCall)
        return (
          <div key={toolCall.id} className="w-full">
            {showStep ? (
              <EvidenceToolCard toolCall={toolCall} toolMessage={toolMessage} />
            ) : (
              renderToolCall({
                toolCall: toolCall as never,
                toolMessage: toolMessage as never
              })
            )}
          </div>
        )
      })}
    </>
  )
}
