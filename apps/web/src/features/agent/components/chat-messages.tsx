'use client'

import {
  UseAgentUpdate,
  useRenderActivityMessage,
  useRenderToolCall
} from '@copilotkit/react-core/v2'
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
  ReasoningTrigger
} from '@zen/ui'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Fragment, useMemo } from 'react'

import { useChatAgent } from '../context/chat-agent-context'
import { useAgentRetry } from '../hooks/use-agent-retry'
import { isA2UIToolCall } from '../lib/a2ui-tools'
import { ChatAssistantActions } from './chat-assistant-actions'
import { ChatPendingMessage } from './chat-pending-message'
import { ChatToolCallBadge } from './chat-tool-call-badge'
import { ChatUserActions } from './chat-user-actions'

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
  const content = typeof message.content === 'string' ? message.content : ''
  const isStreaming = isRunning && isLastAssistant
  const hasContent = Boolean(content.trim())
  const toolCalls = Array.isArray(message.toolCalls) ? message.toolCalls : []
  const a2uiToolCalls = useMemo(() => toolCalls.filter((tc) => isA2UIToolCall(tc)), [toolCalls])
  const standardToolCalls = useMemo(
    () => toolCalls.filter((tc) => !isA2UIToolCall(tc)),
    [toolCalls]
  )

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
        {a2uiToolCalls.length > 0 && (
          <ChatToolCallBadge toolCalls={a2uiToolCalls as never} messages={messages as never} />
        )}
        {standardToolCalls.map((tc) => {
          const toolMessage = messages.find(
            (m) => m.role === 'tool' && (m as { toolCallId?: string }).toolCallId === tc.id
          )
          return (
            <div key={tc.id} className="my-2 w-full">
              {renderToolCall({
                toolCall: tc as never,
                toolMessage: toolMessage as never
              })}
            </div>
          )
        })}
      </MessageContent>
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

  const lastMessage = messages.at(-1)
  const isWaitingForPostToolAssistant =
    agent.isRunning && lastMessage !== undefined && lastMessage.role === 'tool'

  const showPendingPlaceholder =
    agent.isRunning && (!hasActiveAssistantOutput || isWaitingForPostToolAssistant)
  const pendingLabel = isWaitingForPostToolAssistant ? '正在分析数据并生成摘要...' : '工作中...'
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
      {showPendingPlaceholder && <ChatPendingMessage label={pendingLabel} />}
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
