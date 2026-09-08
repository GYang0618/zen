'use client'

import { UseAgentUpdate, useAgent, useRenderActivityMessage } from '@copilotkit/react-core/v2'
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
import { Fragment, useMemo, useRef } from 'react'

import { hasDedicatedResultUi, sanitizeReasoningContent } from '@/components/ai/tool-display'

import { DisplayMessageCache } from '../display-messages'
import { useAgentRetry } from '../hooks/use-agent-retry'
import { useLiveAgentMessages } from '../hooks/use-live-agent-messages'
import { getToolCallName, resolveAssistantToolCalls } from '../lib/group-tool-calls'
import { GroupedToolCallsView } from './grouped-tool-calls-view'

import type { AssistantToolMessageLike } from '../lib/group-tool-calls'

type UserMessageContentPart = { type: string; text?: string }

type CopilotkitUserMessage = {
  id: string
  role: 'user'
  content?: string | UserMessageContentPart[]
}

type CopilotkitAssistantMessage = {
  id: string
  role: 'assistant'
  content?: string
  toolCalls?: Array<{
    id?: string
    function?: {
      name?: string
      arguments?: string
    }
  }>
}

type CopilotkitReasoningMessage = {
  id: string
  role: 'reasoning'
  content?: string
}

type CopilotkitActivityMessage = {
  id: string
  role: 'activity'
  activityType: string
  content: Record<string, unknown>
}

type CopilotkitToolMessage = {
  id: string
  role: 'tool'
  toolCallId?: string
  content?: unknown
  toolCalls?: unknown
}

type CopilotkitMessage =
  | CopilotkitUserMessage
  | CopilotkitAssistantMessage
  | CopilotkitReasoningMessage
  | CopilotkitActivityMessage
  | CopilotkitToolMessage

function flattenUserMessageContent(content: CopilotkitUserMessage['content']): string {
  if (!content) return ''
  if (typeof content === 'string') return content

  return content
    .map((part: UserMessageContentPart) => (part.type === 'text' ? part.text : ''))
    .filter((text): text is string => Boolean(text?.length))
    .join('\n')
}

interface UserMessageProps {
  message: CopilotkitUserMessage
}

function UserMessage({ message }: UserMessageProps) {
  const text = useMemo(() => flattenUserMessageContent(message.content), [message.content])

  if (!text) return null

  return (
    <Message from="user">
      <MessageContent>
        <MessageResponse>{text}</MessageResponse>
      </MessageContent>
    </Message>
  )
}

interface AssistantMessageProps {
  message: CopilotkitAssistantMessage
  content: string
  messages: CopilotkitMessage[]
  toolGroupingMessages: AssistantToolMessageLike[]
  isRunning: boolean
}

function AssistantMessage({
  message,
  content,
  messages,
  toolGroupingMessages,
  isRunning
}: AssistantMessageProps) {
  'use no memo'
  const hasContent = Boolean(content.trim())
  const isLatestAssistant = messages.at(-1)?.id === message.id
  const isStreaming = Boolean(isRunning && isLatestAssistant)
  const { hidden, toolCalls } = resolveAssistantToolCalls(toolGroupingMessages, message.id)
  const resultToolCalls = toolCalls.filter((toolCall) =>
    hasDedicatedResultUi(getToolCallName(toolCall))
  )

  if (hidden && !hasContent) return null
  if (!hasContent && resultToolCalls.length === 0) return null

  return (
    <>
      {hasContent && (
        <Message from="assistant">
          <MessageContent className="transition-all duration-300">
            <MessageResponse isAnimating={isStreaming}>{content}</MessageResponse>
          </MessageContent>
        </Message>
      )}
      {!hidden && resultToolCalls.length > 0 && (
        <GroupedToolCallsView toolCalls={resultToolCalls} messages={messages} />
      )}
    </>
  )
}

interface ReasoningMessageProps {
  message: CopilotkitReasoningMessage
  content: string
  messages: CopilotkitMessage[]
  isRunning: boolean
}

function ReasoningMessage({ message, content, messages, isRunning }: ReasoningMessageProps) {
  'use no memo'
  const isLatest = messages.at(-1)?.id === message.id
  const isStreaming = Boolean(isRunning && isLatest)
  const hasContent = Boolean(content.length)

  // 既无内容又非当前流式活跃的空 reasoning 不展示
  if (!hasContent && !isStreaming) return null

  return (
    <Reasoning className="w-full" isStreaming={isStreaming}>
      <ReasoningTrigger />
      {hasContent && <ReasoningContent>{sanitizeReasoningContent(content)}</ReasoningContent>}
    </Reasoning>
  )
}

function deduplicateMessages(messages: CopilotkitMessage[]): CopilotkitMessage[] {
  const merged = new Map<string, CopilotkitMessage>()

  for (const message of messages) {
    const existing = merged.get(message.id)
    if (existing && message.role === 'assistant' && existing.role === 'assistant') {
      merged.set(message.id, {
        ...existing,
        ...message,
        content: message.content || existing.content,
        toolCalls: message.toolCalls ?? existing.toolCalls
      })
    } else {
      merged.set(message.id, message)
    }
  }

  return [...merged.values()]
}

/**
 * Agent 在 RUN_ERROR / 空 MESSAGES_SNAPSHOT 时可能清掉乐观添加的用户消息；
 * 本地缓存已展示过的 user 消息，并在 agent 状态中缺失时合并回列表。
 */
function useDisplayMessages(messages: CopilotkitMessage[], threadId: string): CopilotkitMessage[] {
  const cacheRef = useRef(new DisplayMessageCache<CopilotkitMessage>())

  return useMemo(() => {
    const deduped = deduplicateMessages(messages)
    return cacheRef.current.merge(threadId, deduped)
  }, [messages, threadId])
}

export function ChatMessages({ threadId }: { threadId: string }) {
  'use no memo'
  const { agent } = useAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const { renderActivityMessage } = useRenderActivityMessage()
  const { messages: liveMessages, isRunning } = useLiveAgentMessages(agent)
  const messages = liveMessages as CopilotkitMessage[]
  const { runError, retryLastRun, failedUserMessage } = useAgentRetry()

  const displayMessages = useDisplayMessages(
    failedUserMessage ? [failedUserMessage as CopilotkitMessage, ...messages] : messages,
    threadId
  )
  const toolGroupingMessages = useMemo(
    () =>
      displayMessages.map((message) => ({
        id: message.id,
        role: message.role,
        ...(message.role === 'assistant'
          ? { content: message.content, toolCalls: message.toolCalls }
          : {})
      })),
    [displayMessages]
  )
  const canRetry = displayMessages.some((message) => message.role === 'user')

  const handleRetry = () => {
    void retryLastRun(displayMessages)
  }

  if (displayMessages.length === 0) {
    if (runError) {
      return (
        <div className="flex flex-col gap-4">
          <ChatRunError
            message={runError}
            onRetry={handleRetry}
            disabled={isRunning || !canRetry}
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {displayMessages.map((message) => {
        if (message.role === 'tool') return null

        return (
          <Fragment key={message.id}>
            {message.role === 'user' && <UserMessage message={message as CopilotkitUserMessage} />}
            {message.role === 'assistant' && (
              <AssistantMessage
                message={message as CopilotkitAssistantMessage}
                content={typeof message.content === 'string' ? message.content : ''}
                messages={displayMessages}
                toolGroupingMessages={toolGroupingMessages}
                isRunning={isRunning}
              />
            )}
            {message.role === 'reasoning' && (
              <ReasoningMessage
                message={message as CopilotkitReasoningMessage}
                content={typeof message.content === 'string' ? message.content : ''}
                messages={displayMessages}
                isRunning={isRunning}
              />
            )}
            {message.role === 'activity' && renderActivityMessage(message)}
          </Fragment>
        )
      })}
      {runError && (
        <ChatRunError message={runError} onRetry={handleRetry} disabled={isRunning || !canRetry} />
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
