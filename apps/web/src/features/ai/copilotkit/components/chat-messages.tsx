'use client'

import {
  CopilotChatToolCallsView,
  useAgent,
  useRenderActivityMessage
} from '@copilotkit/react-core/v2'
import {
  GradientText,
  Message,
  MessageContent,
  MessageResponse,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger
} from '@zen/ui'
import { Fragment, useMemo } from 'react'

import { useAuthStore } from '@/stores'

import type {
  Message as AgMessage,
  AssistantMessage,
  ReasoningMessage,
  UserMessage
} from '@copilotkit/react-core/v2'

function flattenUserMessageContent(content: UserMessage['content']): string {
  if (!content) return ''
  if (typeof content === 'string') return content

  return content
    .map((part) => (part.type === 'text' ? part.text : ''))
    .filter((text) => text.length > 0)
    .join('\n')
}

interface ZenUserMessageProps {
  message: UserMessage
}

function ZenUserMessage({ message }: ZenUserMessageProps) {
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

interface ZenAssistantMessageProps {
  message: AssistantMessage
  messages: AgMessage[]
  isRunning: boolean
}

function ZenAssistantMessage({ message, messages, isRunning }: ZenAssistantMessageProps) {
  const hasContent = Boolean(message.content?.trim())
  const isLatestAssistant = messages[messages.length - 1]?.id === message.id
  const isStreaming = Boolean(isRunning && isLatestAssistant)

  if (!hasContent && !message.toolCalls?.length) return null

  return (
    <>
      {hasContent && (
        <Message from="assistant">
          <MessageContent>
            <MessageResponse isAnimating={isStreaming}>{message.content ?? ''}</MessageResponse>
          </MessageContent>
        </Message>
      )}
      <CopilotChatToolCallsView message={message} messages={messages} />
    </>
  )
}

interface ZenReasoningMessageProps {
  message: ReasoningMessage
  messages: AgMessage[]
  isRunning: boolean
}

function ZenReasoningMessage({ message, messages, isRunning }: ZenReasoningMessageProps) {
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

function deduplicateMessages(messages: AgMessage[]): AgMessage[] {
  const merged = new Map<string, AgMessage>()

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

export default function ChatMessages() {
  const { agent } = useAgent()
  const { renderActivityMessage } = useRenderActivityMessage()
  const user = useAuthStore((state) => state.user)
  const { messages, isRunning } = agent

  const displayMessages = useMemo(() => deduplicateMessages(messages), [messages])

  if (displayMessages.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <span className="text-center text-4xl font-bold leading-normal">
          <GradientText text={`${user?.nickname || user?.username}，你好！`} />
          <br />
          <GradientText text="有什么可以帮你的吗？" />
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {displayMessages.map((message) => {
        if (message.role === 'tool') return null

        return (
          <Fragment key={message.id}>
            {message.role === 'user' && <ZenUserMessage message={message} />}
            {message.role === 'assistant' && (
              <ZenAssistantMessage
                message={message}
                messages={displayMessages}
                isRunning={isRunning}
              />
            )}
            {message.role === 'reasoning' && (
              <ZenReasoningMessage
                message={message}
                messages={displayMessages}
                isRunning={isRunning}
              />
            )}
            {message.role === 'activity' && renderActivityMessage(message)}
          </Fragment>
        )
      })}
    </div>
  )
}
