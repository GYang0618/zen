'use client'

import { UseAgentUpdate, useAgent, useRenderToolCall } from '@copilotkit/react-core/v2'
import { Badge, Button } from '@zen/ui'
import { CheckCircle2, Loader2, PanelRightClose, Sparkles } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { useLiveAgentMessages } from '../hooks/use-live-agent-messages'
import { formatToolTitle } from '../lib/tool-title'
import { useAgentGenerativePanelStore } from '../stores/agent-generative-panel'

interface CopilotKitToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

interface ToolMessageLike {
  id: string
  role: string
  toolCallId?: string
  content?: unknown
}

function isValidToolCall(toolCall: unknown): toolCall is CopilotKitToolCall {
  if (!toolCall || typeof toolCall !== 'object') return false
  const tc = toolCall as Record<string, unknown>
  const fn = tc.function as Record<string, unknown> | undefined
  return typeof tc.id === 'string' && typeof fn?.name === 'string'
}

export function ChatGenerativePanel() {
  const { agent } = useAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const { messages, isRunning } = useLiveAgentMessages(agent)
  const renderToolCall = useRenderToolCall()

  const activeToolCallId = useAgentGenerativePanelStore((state) => state.activeToolCallId)
  const setActiveToolCallId = useAgentGenerativePanelStore((state) => state.setActiveToolCallId)
  const close = useAgentGenerativePanelStore((state) => state.close)

  // 提取对话中所有 Assistant 消息下的有效 ToolCall
  const allToolCalls = useMemo(() => {
    const list: CopilotKitToolCall[] = []
    for (const message of messages) {
      if (
        message.role === 'assistant' &&
        Array.isArray((message as { toolCalls?: unknown[] }).toolCalls)
      ) {
        for (const tc of (message as { toolCalls: unknown[] }).toolCalls) {
          if (isValidToolCall(tc)) {
            list.push(tc)
          }
        }
      }
    }
    return list
  }, [messages])

  // 当前选中的 ToolCall：优先选 activeToolCallId，否则默认选最新一个
  const activeToolCall = useMemo(() => {
    if (activeToolCallId) {
      const found = allToolCalls.find((tc) => tc.id === activeToolCallId)
      if (found) return found
    }
    return allToolCalls.at(-1)
  }, [allToolCalls, activeToolCallId])

  // 当有新 ToolCall 出现时，若未指定或原选中失效，同步最新 ID
  useEffect(() => {
    if (activeToolCall && activeToolCall.id !== activeToolCallId) {
      setActiveToolCallId(activeToolCall.id)
    }
  }, [activeToolCall, activeToolCallId, setActiveToolCallId])

  const toolMessages = useMemo(() => {
    return (messages as unknown as ToolMessageLike[]).filter((m) => m.role === 'tool')
  }, [messages])

  const activeToolMessage = useMemo(() => {
    if (!activeToolCall) return undefined
    return toolMessages.find((m) => m.toolCallId === activeToolCall.id)
  }, [toolMessages, activeToolCall])

  const isExecuting = Boolean(
    activeToolCall && (!activeToolMessage || activeToolMessage.content === undefined) && isRunning
  )

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* 头部工具栏 */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <span className="truncate text-sm font-semibold">生成式工作区</span>
          {activeToolCall && (
            <Badge variant="outline" className="text-xs font-normal">
              {formatToolTitle(activeToolCall.function.name)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeToolCall && (
            <Badge
              variant={isExecuting ? 'secondary' : 'outline'}
              className="gap-1 text-xs font-normal"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="size-3 animate-spin text-primary" />
                  执行中
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  已就绪
                </>
              )}
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={close}
            title="收起工作区"
          >
            <PanelRightClose className="size-4" />
            <span className="sr-only">收起工作区</span>
          </Button>
        </div>
      </div>

      {/* 多工具结果切换标签栏 */}
      {allToolCalls.length > 1 && (
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-muted/30 px-4 py-1.5 scrollbar-none">
          <span className="shrink-0 text-xs text-muted-foreground">历史生成：</span>
          {allToolCalls.map((tc, idx) => {
            const isCurrent = activeToolCall?.id === tc.id
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => setActiveToolCallId(tc.id)}
                className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${
                  isCurrent
                    ? 'bg-background text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                #{idx + 1} {formatToolTitle(tc.function.name)}
              </button>
            )
          })}
        </div>
      )}

      {/* 主体渲染区 */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {activeToolCall ? (
          <div key={activeToolCall.id} className="min-w-0">
            {renderToolCall({
              toolCall: activeToolCall as never,
              toolMessage: activeToolMessage as never
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">暂无生成式内容</h3>
            <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
              当智能体执行生成式工具（如查询用户列表、分析图表等）时，将在此处实时呈现交互界面和结构化结果。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
