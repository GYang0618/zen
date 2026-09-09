import { ChevronRight, Loader2, Sparkles } from 'lucide-react'

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
}

export function ChatToolCallBadge({ toolCalls, messages }: ChatToolCallBadgeProps) {
  const openToolCall = useAgentGenerativePanelStore((state) => state.openToolCall)
  const activeToolCallId = useAgentGenerativePanelStore((state) => state.activeToolCallId)
  const isPanelOpen = useAgentGenerativePanelStore((state) => state.isOpen)

  if (toolCalls.length === 0) return null

  return (
    <div className="my-1.5 flex flex-wrap items-center gap-2">
      {toolCalls.map((toolCall) => {
        const id = toolCall.id
        if (!id) return null

        const name = toolCall.function?.name ?? ''
        const title = formatToolTitle(name)
        const hasResult = messages.some(
          (msg) => msg.role === 'tool' && msg.toolCallId === id && msg.content !== undefined
        )
        const isActive = isPanelOpen && activeToolCallId === id

        return (
          <button
            key={id}
            type="button"
            onClick={() => openToolCall(id)}
            className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${
              isActive
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border bg-muted/50 text-foreground hover:bg-muted'
            }`}
          >
            {hasResult ? (
              <Sparkles className="size-3 text-primary shrink-0" />
            ) : (
              <Loader2 className="size-3 animate-spin text-primary shrink-0" />
            )}
            <span className="max-w-[160px] truncate">{title}</span>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
              {hasResult ? '在右侧查看' : '生成中...'}
            </span>
            <ChevronRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        )
      })}
    </div>
  )
}
