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
import { ChevronRight, Sparkles } from 'lucide-react'

import { resolveA2uiToolCallTitle } from '../a2ui/resolve-a2ui-title'
import { parseToolCallArguments } from '../lib/group-tool-calls'
import { useAgentCanvasStore } from '../stores/agent-canvas'

import type { ToolCallLike } from '../lib/group-tool-calls'

interface ToolResultMessage {
  role: string
  toolCallId?: string
  content?: unknown
}

interface ChatCanvasBadgeProps {
  toolCalls: ToolCallLike[]
  messages: ToolResultMessage[]
}

export function ChatCanvasBadge({ toolCalls, messages }: ChatCanvasBadgeProps) {
  const openToolCall = useAgentCanvasStore((state) => state.openToolCall)
  const activeToolCallId = useAgentCanvasStore((state) => state.activeToolCallId)
  const isCanvasOpen = useAgentCanvasStore((state) => state.isOpen)

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
        const isActive = isCanvasOpen && activeToolCallId === id

        return (
          <CanvasBadgeItem
            key={id}
            title={title}
            hasResult={hasResult}
            isActive={isActive}
            onOpen={() => {
              if (!hasResult) return
              openToolCall(id)
            }}
          />
        )
      })}
    </ItemGroup>
  )
}

interface CanvasBadgeItemProps {
  title: string
  hasResult: boolean
  isActive: boolean
  onOpen: () => void
}

function CanvasBadgeItem({ title, hasResult, isActive, onOpen }: CanvasBadgeItemProps) {
  const description = hasResult ? '结果已生成，可在右侧画布查看' : `正在生成${title}中...`

  return (
    <Item
      render={<button type="button" disabled={!hasResult} />}
      variant={isActive ? 'muted' : 'outline'}
      onClick={onOpen}
      className={cn(
        'text-left hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-60',
        isActive && 'border-primary/40'
      )}
    >
      <ItemMedia variant="icon">
        <Avatar className="size-10">
          <AvatarFallback>
            <Sparkles
              className={cn('size-4.5 text-primary', !hasResult && 'shimmer')}
              aria-hidden
            />
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
}
