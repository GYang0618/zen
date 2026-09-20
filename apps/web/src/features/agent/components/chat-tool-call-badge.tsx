import {
  Avatar,
  AvatarFallback,
  cn,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@zen/ui'
import { ChevronRight, Loader2, Sparkles } from 'lucide-react'

import { resolveA2uiToolCallTitle } from '../a2ui/resolve-a2ui-title'
import { parseToolCallArguments } from '../lib/group-tool-calls'
import { useAgentGenerativePanelStore } from '../stores/agent-generative-panel'

import type { ToolCallLike } from '../lib/group-tool-calls'

interface ToolResultMessage {
  role: string
  toolCallId?: string
  content?: unknown
}

interface ChatToolCallBadgeProps {
  toolCalls: ToolCallLike[]
  messages: ToolResultMessage[]
}

export function ChatToolCallBadge({ toolCalls, messages }: ChatToolCallBadgeProps) {
  const openToolCall = useAgentGenerativePanelStore((state) => state.openToolCall)
  const activeToolCallId = useAgentGenerativePanelStore((state) => state.activeToolCallId)
  const isPanelOpen = useAgentGenerativePanelStore((state) => state.isOpen)

  if (toolCalls.length === 0) return null

  return (
    <ItemGroup className="my-1.5 gap-2">
      {toolCalls.map((toolCall) => {
        const id = toolCall.id
        if (!id) return null

        const title = resolveA2uiToolCallTitle(toolCall)
        const args = parseToolCallArguments(toolCall)
        const hasCompleteArgs = Array.isArray(args?.components) && args.components.length > 0
        const hasResult =
          hasCompleteArgs ||
          messages.some((msg) => {
            if (msg.role !== 'tool' || msg.content === undefined) return false
            const anyMsg = msg as { toolCallId?: string; tool_call_id?: string }
            return anyMsg.toolCallId === id || anyMsg.tool_call_id === id
          })
        const isActive = isPanelOpen && activeToolCallId === id
        const description = hasResult ? '结果已生成，可在右侧面板查看' : '正在生成中，请稍候...'

        return (
          <Item
            key={id}
            render={<button type="button" disabled={!hasResult} />}
            variant={isActive ? 'muted' : 'outline'}
            onClick={() => {
              if (!hasResult) return
              openToolCall(id)
            }}
            className={cn(
              'text-left hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-60',
              isActive && 'border-primary/40'
            )}
          >
            <ItemMedia variant="icon">
              <Avatar className="size-10">
                <AvatarFallback>
                  {hasResult ? (
                    <Sparkles className="size-4.5 text-primary" aria-hidden />
                  ) : (
                    <Loader2 className="size-4.5 animate-spin text-primary" aria-hidden />
                  )}
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="min-w-0">
                <span className="truncate">{title}</span>
              </ItemTitle>
              <ItemDescription>
                <span className={cn(!hasResult && 'shimmer')}>{description}</span>
              </ItemDescription>
            </ItemContent>

            <ItemActions>
              <ChevronRight className="size-4" />
            </ItemActions>
          </Item>
        )
      })}
    </ItemGroup>
  )
}
