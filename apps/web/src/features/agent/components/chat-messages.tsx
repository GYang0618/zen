'use client'

import { UseAgentUpdate, useRenderActivityMessage } from '@copilotkit/react-core/v2'
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
import { useCanvasGenerationPending } from '../hooks/use-canvas-generation-pending'
import { A2UI_ACTIVITY_TYPE, isA2UIToolCall, turnHasInProgressA2uiActivity } from '../lib/a2ui-tools'
import {
  getInlineStandardToolCalls,
  groupMessagesIntoTurns,
  turnHasFoldableWork
} from '../lib/group-chat-turns'
import {
  isToolCallDisplayEnabled,
  resolveTurnGenerativeToolCalls,
  resolveTurnToolCalls
} from '../lib/group-tool-calls'
import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { ChatAssistantActions } from './chat-assistant-actions'
import { ChatCanvasBadge, ChatCanvasGeneratingBadge } from './chat-canvas-badge'
import { ChatPendingMessage } from './chat-pending-message'
import { ChatUserActions } from './chat-user-actions'
import { ChatWorkTrace } from './chat-work-trace'
import { GroupedToolCallsView } from './grouped-tool-calls-view'

import type { Message as AGUIMessage } from '@copilotkit/react-core/v2'
import type { ChatTurnMessageLike } from '../lib/group-chat-turns'

type UserMessageContentPart = { type: string; text?: string }

export type ChatMessageLike = AGUIMessage &
  ChatTurnMessageLike & {
    toolCalls?: ChatTurnMessageLike['toolCalls']
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

export function UserMessageItem({ message }: { message: ChatMessageLike }) {
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

export interface AssistantMessageItemProps {
  message: ChatMessageLike
  messages: ChatMessageLike[]
  isRunning: boolean
  isLastAssistant: boolean
  includeInlineTools?: boolean
  showWorkingPlaceholder?: boolean
  onRetry?: () => void
}

export function AssistantMessageItem({
  message,
  messages,
  isRunning,
  isLastAssistant,
  includeInlineTools = true,
  showWorkingPlaceholder = false,
  onRetry
}: AssistantMessageItemProps) {
  const isStopped = useAgentChatInputStore((state) =>
    message.id ? state.stoppedMessageIds.has(message.id) : false
  )
  const content = typeof message.content === 'string' ? message.content : ''
  const isStreaming = isRunning && isLastAssistant
  const hasContent = Boolean(content.trim())
  const toolCalls = Array.isArray(message.toolCalls) ? message.toolCalls : []
  const inlineStandardToolCalls = useMemo(
    () => (includeInlineTools ? getInlineStandardToolCalls(toolCalls) : []),
    [includeInlineTools, toolCalls]
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
  const waitingForCanvas =
    isRunning && isLastAssistant && hasContent && !showA2uiSlot && !showGenerativeSlot
  const canvasActivityPending = Boolean(
    message.id && turnHasInProgressA2uiActivity(messages, message.id)
  )
  const canvasTextSettled = useCanvasGenerationPending(content, waitingForCanvas)
  const showCanvasPending = waitingForCanvas && (canvasActivityPending || canvasTextSettled)

  const hasInlineTools = inlineStandardToolCalls.length > 0
  const showStreamingPlaceholder = Boolean(!hasContent && isStreaming && showWorkingPlaceholder)
  if (
    !hasContent &&
    !hasInlineTools &&
    !showA2uiSlot &&
    !showGenerativeSlot &&
    !showStreamingPlaceholder &&
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
        {hasInlineTools && (
          <GroupedToolCallsView toolCalls={inlineStandardToolCalls} messages={messages as never} />
        )}
        {showStreamingPlaceholder && (
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
      {showCanvasPending && <ChatCanvasGeneratingBadge />}
      {showA2uiSlot && turnA2uiTools && (
        <ChatCanvasBadge toolCalls={turnA2uiTools.toolCalls} messages={messages as never} />
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

export function ReasoningMessageItem({
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
    <Reasoning className="mb-0 w-full" isStreaming={isStreaming}>
      <ReasoningTrigger />
      {hasContent && <ReasoningContent>{content}</ReasoningContent>}
    </Reasoning>
  )
}

function FoldedTurnMessages({
  messages,
  foldedMessages,
  isRunning,
  isLastTurn
}: {
  messages: ChatMessageLike[]
  foldedMessages: ChatMessageLike[]
  isRunning: boolean
  isLastTurn: boolean
}) {
  const { renderActivityMessage } = useRenderActivityMessage()
  const lastMessageId = messages.at(-1)?.id

  return (
    <>
      {foldedMessages.map((message, idx) => (
        <Fragment key={message.id ?? `folded-${idx}`}>
          {message.role === 'assistant' && (
            <AssistantMessageItem
              message={message}
              messages={messages}
              isRunning={isRunning}
              isLastAssistant={false}
              includeInlineTools
            />
          )}
          {message.role === 'reasoning' && (
            <ReasoningMessageItem
              message={message}
              isRunning={isRunning}
              isLatest={isLastTurn && message.id === lastMessageId}
            />
          )}
          {message.role === 'activity' &&
            message.activityType !== A2UI_ACTIVITY_TYPE &&
            renderActivityMessage(message as never)}
        </Fragment>
      ))}
    </>
  )
}

export function ChatMessages() {
  const { agent } = useChatAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const { runError, retryLastRun, failedUserMessage } = useAgentRetry()

  const rawMessages = agent.messages as ChatMessageLike[]
  const messages = useMemo(() => {
    if (failedUserMessage && !rawMessages.some((m) => m.id === failedUserMessage.id)) {
      return [failedUserMessage as ChatMessageLike, ...rawMessages]
    }
    return rawMessages
  }, [failedUserMessage, rawMessages])

  const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages])
  const lastUserIndex = messages.findLastIndex((m) => m.role === 'user')
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
      {turns.map((turn, turnIndex) => {
        const isLastTurn = turnIndex === turns.length - 1
        const hasWork = turnHasFoldableWork(turn)
        const finalInlineTools = getInlineStandardToolCalls(turn.finalAssistant?.toolCalls)

        return (
          <Fragment key={turn.key}>
            {turn.user && <UserMessageItem message={turn.user} />}
            {hasWork && (
              <ChatWorkTrace turnKey={turn.key} isWorking={isLastTurn && agent.isRunning}>
                <FoldedTurnMessages
                  messages={messages}
                  foldedMessages={turn.foldedMessages}
                  isRunning={agent.isRunning}
                  isLastTurn={isLastTurn}
                />
                {finalInlineTools.length > 0 && (
                  <GroupedToolCallsView toolCalls={finalInlineTools} messages={messages as never} />
                )}
              </ChatWorkTrace>
            )}
            {turn.finalAssistant && (
              <AssistantMessageItem
                message={turn.finalAssistant}
                messages={messages}
                isRunning={agent.isRunning}
                isLastAssistant={isLastTurn}
                includeInlineTools={false}
                showWorkingPlaceholder={!hasWork}
                onRetry={handleRetry}
              />
            )}
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
