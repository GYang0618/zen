import { A2UI_SURFACE_TOOL_NAME } from '@zen/shared'
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
import { formatToolTitle } from '../lib/tool-title'
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
  /**
   * 文案已出、A2UI toolCall 尚未落到消息上时的占位标题。
   * 有真实 toolCalls 时忽略。
   */
  pendingTitle?: string
}

const A2UI_PENDING_BADGE_ID = '__a2ui-pending__'

function buildGeneratingDescription(title: string): string {
  return `正在生成【${title}】中...`
}

export function ChatToolCallBadge({ toolCalls, messages, pendingTitle }: ChatToolCallBadgeProps) {
  const openToolCall = useAgentGenerativePanelStore((state) => state.openToolCall)
  const activeToolCallId = useAgentGenerativePanelStore((state) => state.activeToolCallId)
  const isPanelOpen = useAgentGenerativePanelStore((state) => state.isOpen)

  const resolvedPendingTitle = pendingTitle?.trim()
  const showPendingOnly = toolCalls.length === 0 && Boolean(resolvedPendingTitle)

  if (toolCalls.length === 0 && !showPendingOnly) return null

  return (
    <ItemGroup className="my-1.5 gap-2">
      {showPendingOnly ? (
        <A2uiBadgeItem
          key={A2UI_PENDING_BADGE_ID}
          title={resolvedPendingTitle ?? formatToolTitle(A2UI_SURFACE_TOOL_NAME)}
          hasResult={false}
          isActive={false}
          onOpen={() => undefined}
        />
      ) : (
        toolCalls.map((toolCall) => {
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

          return (
            <A2uiBadgeItem
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
        })
      )}
    </ItemGroup>
  )
}

interface A2uiBadgeItemProps {
  title: string
  hasResult: boolean
  isActive: boolean
  onOpen: () => void
}

function A2uiBadgeItem({ title, hasResult, isActive, onOpen }: A2uiBadgeItemProps) {
  const description = hasResult ? '结果已生成，可在右侧面板查看' : buildGeneratingDescription(title)

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
