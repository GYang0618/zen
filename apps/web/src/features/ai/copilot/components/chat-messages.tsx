'use client'

import {
  CopilotChatToolCallsView,
  useAgent,
  useRenderActivityMessage
} from '@copilotkit/react-core/v2'
import {
  Alert,
  AlertTitle,
  Message,
  MessageContent,
  MessageResponse,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger
} from '@zen/ui'
import { AlertCircle } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

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
  toolCalls?: unknown[]
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

type CopilotkitMessage =
  | CopilotkitUserMessage
  | CopilotkitAssistantMessage
  | CopilotkitReasoningMessage
  | CopilotkitActivityMessage
  | { id: string; role: 'tool'; content?: unknown; toolCalls?: unknown }

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
  messages: CopilotkitMessage[]
  isRunning: boolean
}

function AssistantMessage({ message, messages, isRunning }: AssistantMessageProps) {
  const hasContent = Boolean(message.content?.trim())
  const isLatestAssistant = messages[messages.length - 1]?.id === message.id
  const isStreaming = Boolean(isRunning && isLatestAssistant)

  if (!hasContent && !message.toolCalls?.length) return null

  return (
    <>
      {hasContent && (
        <Message from="assistant">
          <MessageContent className="transition-all duration-300">
            <MessageResponse isAnimating={isStreaming}>{message.content ?? ''}</MessageResponse>
          </MessageContent>
        </Message>
      )}
      <CopilotChatToolCallsView
        message={message as never}
        messages={messages as never}
      />
    </>
  )
}

interface ReasoningMessageProps {
  message: CopilotkitReasoningMessage
  messages: CopilotkitMessage[]
  isRunning: boolean
}

function ReasoningMessage({ message, messages, isRunning }: ReasoningMessageProps) {
  const isLatest = messages[messages.length - 1]?.id === message.id
  const isStreaming = Boolean(isRunning && isLatest)
  const hasContent = Boolean(message.content?.length)

  if (!hasContent && !isStreaming) return null

  return (
    <Reasoning className="w-full" isStreaming={isStreaming}>
      <ReasoningTrigger />
      <ReasoningContent>{message.content ?? ''}</ReasoningContent>
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
function useDisplayMessages(messages: CopilotkitMessage[]): CopilotkitMessage[] {
  const orderRef = useRef<string[]>([])
  const persistedUsersRef = useRef<Map<string, CopilotkitUserMessage>>(new Map())

  return useMemo(() => {
    const deduped = deduplicateMessages(messages)
    const byId = new Map<string, CopilotkitMessage>()

    for (const message of deduped) {
      byId.set(message.id, message)
      if (!orderRef.current.includes(message.id)) {
        orderRef.current.push(message.id)
      }
      if (message.role === 'user') {
        persistedUsersRef.current.set(message.id, message as CopilotkitUserMessage)
      }
    }

    for (const [id, userMessage] of persistedUsersRef.current) {
      if (!byId.has(id)) {
        byId.set(id, userMessage)
        if (!orderRef.current.includes(id)) {
          orderRef.current.push(id)
        }
      }
    }

    return orderRef.current
      .map((id) => byId.get(id))
      .filter((message): message is CopilotkitMessage => message !== undefined)
  }, [messages])
}

export function ChatMessages() {
  const { agent } = useAgent()
  const { renderActivityMessage } = useRenderActivityMessage()
  const { messages: agentMessages, isRunning } = agent
  const messages = agentMessages as CopilotkitMessage[]
  const [runError, setRunError] = useState<string | null>(null)

  const displayMessages = useDisplayMessages(messages)

  useEffect(() => {
    const subscription = agent.subscribe({
      onRunInitialized: () => setRunError(null),
      onRunFailed: () => {
        setRunError('请求失败，请稍后重试')
      },
      onRunErrorEvent: () => {
        setRunError('请求失败，请稍后重试')
      }
    })

    return () => subscription.unsubscribe()
  }, [agent])

  if (displayMessages.length === 0) {
    if (runError) {
      return (
        <div className="flex flex-col gap-4">
          <Message from="assistant">
            <MessageContent>
              <Alert variant="destructive" className="max-w-max">
                <AlertCircle />
                <AlertTitle>{runError}</AlertTitle>
              </Alert>
            </MessageContent>
          </Message>
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
            {message.role === 'user' && (
              <UserMessage message={message as CopilotkitUserMessage} />
            )}
            {message.role === 'assistant' && (
              <AssistantMessage
                message={message as CopilotkitAssistantMessage}
                messages={displayMessages}
                isRunning={isRunning}
              />
            )}
            {message.role === 'reasoning' && (
              <ReasoningMessage
                message={message as CopilotkitReasoningMessage}
                messages={displayMessages}
                isRunning={isRunning}
              />
            )}
            {message.role === 'activity' && renderActivityMessage(message)}
          </Fragment>
        )
      })}
      {runError && (
        <Message from="assistant">
          <MessageContent>
            <Alert variant="destructive" className="max-w-max">
              <AlertCircle />
              <AlertTitle>{runError}</AlertTitle>
            </Alert>
          </MessageContent>
        </Message>
      )}
    </div>
  )
}
