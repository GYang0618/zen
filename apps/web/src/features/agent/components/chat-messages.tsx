'use client'

import {
  UseAgentUpdate,
  useRenderActivityMessage,
  useRenderToolCall
} from '@copilotkit/react-core/v2'
import { A2UI_SURFACE_TOOL_NAME } from '@zen/shared'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Message,
  MessageContent,
  MessageResponse,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Shimmer
} from '@zen/ui'
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Fragment, useMemo } from 'react'

import { useChatAgent } from '../context/chat-agent-context'
import { useAgentRetry } from '../hooks/use-agent-retry'
import { isA2UIToolCall } from '../lib/a2ui-tools'
import {
  isToolCallDisplayEnabled,
  isTurnFinalDisplayToolCall,
  resolveTurnGenerativeToolCalls,
  resolveTurnToolCalls
} from '../lib/group-tool-calls'
import { formatToolTitle } from '../lib/tool-title'
import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { ChatAssistantActions } from './chat-assistant-actions'
import { ChatPendingMessage } from './chat-pending-message'
import { ChatToolCallBadge } from './chat-tool-call-badge'
import { ChatUserActions } from './chat-user-actions'
import { GroupedToolCallsView } from './grouped-tool-calls-view'

import type { Message as AGUIMessage } from '@copilotkit/react-core/v2'

type UserMessageContentPart = { type: string; text?: string }

type ChatMessageLike = AGUIMessage & {
  toolCalls?: Array<{
    id?: string
    function?: {
      name?: string
      arguments?: string
    }
  }>
  activityType?: string
}

function flattenUserMessageContent(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: UserMessageContentPart) => (part.type === 'text' ? part.text : ''))
      .filter((text): text is string => Boolean(text?.length))
      .join('\n')
  }
  return String(content)
}

function UserMessageItem({ message }: { message: ChatMessageLike }) {
  const text = useMemo(() => flattenUserMessageContent(message.content), [message.content])
  if (!text) return null

  return (
    <Message from="user" className="max-w-full">
      <MessageContent className="text-base group-[.is-user]:max-w-7/10 group-[.is-user]:rounded-2xl group-[.is-user]:rounded-tr-none group-[.is-user]:bg-primary/90 group-[.is-user]:px-3 group-[.is-user]:py-2 group-[.is-user]:text-primary-foreground/75">
        <MessageResponse>{text}</MessageResponse>
      </MessageContent>
      <ChatUserActions text={text} />
    </Message>
  )
}

interface AssistantMessageItemProps {
  message: ChatMessageLike
  messages: ChatMessageLike[]
  isRunning: boolean
  isLastAssistant: boolean
  onRetry?: () => void
}

function AssistantMessageItem({
  message,
  messages,
  isRunning,
  isLastAssistant,
  onRetry
}: AssistantMessageItemProps) {
  const renderToolCall = useRenderToolCall()
  const isStopped = useAgentChatInputStore((state) =>
    message.id ? state.stoppedMessageIds.has(message.id) : false
  )
  const content = typeof message.content === 'string' ? message.content : ''
  const isStreaming = isRunning && isLastAssistant
  const hasContent = Boolean(content.trim())
  const toolCalls = Array.isArray(message.toolCalls) ? message.toolCalls : []
  // meta.display === true → 末尾槽；display === false → 不展示；其余内联默认卡片
  const inlineStandardToolCalls = useMemo(
    () =>
      toolCalls.filter(
        (tc) =>
          !isA2UIToolCall(tc) && !isTurnFinalDisplayToolCall(tc) && isToolCallDisplayEnabled(tc)
      ),
    [toolCalls]
  )
  const turnA2uiTools = useMemo(
    () =>
      message.id
        ? resolveTurnToolCalls(
            messages,
            message.id,
            (tc) => isA2UIToolCall(tc) && isToolCallDisplayEnabled(tc)
          )
        : null,
    [message.id, messages]
  )
  const turnGenerativeTools = useMemo(
    () => (message.id ? resolveTurnGenerativeToolCalls(messages, message.id) : null),
    [message.id, messages]
  )
  const showA2uiSlot = Boolean(turnA2uiTools?.shouldRender && turnA2uiTools.toolCalls.length > 0)
  const showGenerativeSlot = Boolean(
    turnGenerativeTools?.shouldRender && turnGenerativeTools.toolCalls.length > 0
  )
  // 本轮已有检索类工具结果、当前助手文案已出但 A2UI 尚未落地时，用同一徽章展示生成中占位，避免空窗「卡住」感
  const turnHasPriorToolActivity = useMemo(() => {
    if (!message.id) return false
    const messageIndex = messages.findIndex((item) => item.id === message.id)
    if (messageIndex <= 0) return false

    let turnStart = 0
    for (let index = messageIndex; index >= 0; index -= 1) {
      if (messages[index]?.role === 'user') {
        turnStart = index + 1
        break
      }
    }

    return messages.slice(turnStart, messageIndex).some((item) => {
      if (item.role === 'tool') return true
      if (item.role !== 'assistant') return false
      return Array.isArray(item.toolCalls) && item.toolCalls.length > 0
    })
  }, [message.id, messages])

  const showA2uiPending =
    isLastAssistant &&
    isRunning &&
    hasContent &&
    !showA2uiSlot &&
    toolCalls.length === 0 &&
    !showGenerativeSlot &&
    turnHasPriorToolActivity

  const hasInlineTools = inlineStandardToolCalls.length > 0
  if (
    !hasContent &&
    !hasInlineTools &&
    !showA2uiSlot &&
    !showA2uiPending &&
    !showGenerativeSlot &&
    !isStreaming &&
    !isStopped
  ) {
    return null
  }

  return (
    <Message from="assistant" className="max-w-full">
      <MessageContent className="w-full text-base transition-all duration-300 group-[.is-assistant]:w-full">
        {hasContent && (
          <MessageResponse
            animated
            isAnimating={isStreaming}
            caret={isStreaming ? 'block' : undefined}
          >
            {content}
          </MessageResponse>
        )}
        {inlineStandardToolCalls.map((tc) => {
          const toolMessage = messages.find((m) => {
            if (m.role !== 'tool') return false
            const candidate = m as { toolCallId?: string; tool_call_id?: string }
            return candidate.toolCallId === tc.id || candidate.tool_call_id === tc.id
          })
          return (
            <div key={tc.id} className="my-2 w-full">
              {renderToolCall({
                toolCall: tc as never,
                toolMessage: toolMessage as never
              })}
            </div>
          )
        })}
        {!hasContent && isStreaming && (
          <div className="my-1.5 flex items-center gap-2 py-0.5 text-muted-foreground">
            <Sparkles className="size-3.5 animate-pulse text-primary/70" />
            <Shimmer duration={1.5} className="text-xs font-normal text-muted-foreground">
              工作中...
            </Shimmer>
          </div>
        )}
        {isStopped && !isRunning && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground/75">
            <span className="inline-block size-1.5 rounded-full bg-muted-foreground/50" />
            <span>已停止生成</span>
          </div>
        )}
      </MessageContent>
      {showA2uiSlot && turnA2uiTools && (
        <ChatToolCallBadge toolCalls={turnA2uiTools.toolCalls} messages={messages as never} />
      )}
      {showA2uiPending && (
        <ChatToolCallBadge
          toolCalls={[]}
          messages={messages as never}
          pendingTitle={formatToolTitle(A2UI_SURFACE_TOOL_NAME)}
        />
      )}
      {showGenerativeSlot && turnGenerativeTools && (
        <div className="w-full">
          <GroupedToolCallsView
            toolCalls={turnGenerativeTools.toolCalls}
            messages={messages as never}
          />
        </div>
      )}
      {isLastAssistant && !isRunning && onRetry && (
        <ChatAssistantActions content={content} onRetry={onRetry} isRunning={isRunning} />
      )}
    </Message>
  )
}

function ReasoningMessageItem({
  message,
  isRunning,
  isLatest
}: {
  message: ChatMessageLike
  isRunning: boolean
  isLatest: boolean
}) {
  const content = typeof message.content === 'string' ? message.content : ''
  const isStreaming = Boolean(isRunning && isLatest)
  const hasContent = Boolean(content.length)

  if (!hasContent && !isStreaming) return null

  return (
    <Reasoning className="w-full" isStreaming={isStreaming}>
      <ReasoningTrigger />
      {hasContent && <ReasoningContent>{content}</ReasoningContent>}
    </Reasoning>
  )
}

export function ChatMessages() {
  const { agent } = useChatAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const { renderActivityMessage } = useRenderActivityMessage()
  const { runError, retryLastRun, failedUserMessage } = useAgentRetry()

  const rawMessages = agent.messages as ChatMessageLike[]
  const messages = useMemo(() => {
    if (failedUserMessage && !rawMessages.some((m) => m.id === failedUserMessage.id)) {
      return [failedUserMessage as ChatMessageLike, ...rawMessages]
    }
    return rawMessages
  }, [failedUserMessage, rawMessages])

  const lastUserIndex = messages.findLastIndex((m) => m.role === 'user')
  const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant')
  const isLastAssistantTurn = lastAssistantIndex !== -1 && lastAssistantIndex > lastUserIndex
  const lastAssistantId = isLastAssistantTurn ? messages[lastAssistantIndex]?.id : undefined

  const messagesAfterUser = lastUserIndex >= 0 ? messages.slice(lastUserIndex + 1) : []
  const hasActiveAssistantOutput = messagesAfterUser.some((message) => {
    if (message.role === 'assistant') {
      const hasText = typeof message.content === 'string' && message.content.trim().length > 0
      const hasTools = Array.isArray(message.toolCalls) && message.toolCalls.length > 0
      return hasText || hasTools
    }
    if (message.role === 'reasoning') {
      return typeof message.content === 'string' && message.content.length > 0
    }
    return message.role === 'activity'
  })

  // 仅在用户发送消息后、尚未产生任何输出（首字/思考流/工具调用）前展示极简微脉冲占位态
  const showPendingPlaceholder = agent.isRunning && !hasActiveAssistantOutput
  const canRetry = messages.some((m) => m.role === 'user')

  const handleRetry = () => {
    void retryLastRun(messages)
  }

  if (messages.length === 0) {
    if (runError) {
      return (
        <div className="flex flex-col gap-4">
          <ChatRunError
            message={runError}
            onRetry={handleRetry}
            disabled={agent.isRunning || !canRetry}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, idx) => {
        if (message.role === 'tool') return null

        return (
          <Fragment key={message.id ?? `msg-${idx}`}>
            {message.role === 'user' && <UserMessageItem message={message} />}
            {message.role === 'assistant' && (
              <AssistantMessageItem
                message={message}
                messages={messages}
                isRunning={agent.isRunning}
                isLastAssistant={message.id === lastAssistantId}
                onRetry={handleRetry}
              />
            )}
            {message.role === 'reasoning' && (
              <ReasoningMessageItem
                message={message}
                isRunning={agent.isRunning}
                isLatest={idx === messages.length - 1}
              />
            )}
            {message.role === 'activity' &&
              (message as { activityType?: string }).activityType !== 'a2ui-surface' &&
              renderActivityMessage(message as never)}
          </Fragment>
        )
      })}
      {showPendingPlaceholder && <ChatPendingMessage />}
      {runError && (
        <ChatRunError
          message={runError}
          onRetry={handleRetry}
          disabled={agent.isRunning || !canRetry}
        />
      )}
    </div>
  )
}

interface ChatRunErrorProps {
  message: string
  onRetry: () => void
  disabled: boolean
}

function ChatRunError({ message, onRetry, disabled }: ChatRunErrorProps) {
  const [title, ...rest] = message.split('：')
  const detail = rest.join('：')

  return (
    <Message from="assistant">
      <MessageContent>
        <div className="flex flex-col items-start gap-2">
          <Alert variant="destructive" className="max-w-max">
            <AlertCircle />
            <AlertTitle>{title}</AlertTitle>
            {detail ? <AlertDescription>{detail}</AlertDescription> : null}
          </Alert>
          <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={disabled}>
            <RefreshCw data-icon="inline-start" />
            重试
          </Button>
        </div>
      </MessageContent>
    </Message>
  )
}
