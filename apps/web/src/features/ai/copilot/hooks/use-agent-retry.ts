'use client'

import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { useCallback, useEffect, useRef, useState } from 'react'

import { buildRetryMessages } from '../lib/messages'
import { isRunCancellation } from '../run-state'

const RUN_ERROR_MESSAGE = '请求失败'

function formatRunError(error: unknown): string {
  if (import.meta.env.DEV && error instanceof Error && error.message.trim()) {
    return `${RUN_ERROR_MESSAGE}：${error.message}`
  }
  return RUN_ERROR_MESSAGE
}

export function useAgentRetry() {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()
  const [runError, setRunError] = useState<string | null>(null)
  type UserMessage = Extract<(typeof agent.messages)[number], { role: 'user' }>
  const lastUserMessageRef = useRef<UserMessage | undefined>(undefined)
  const [failedUserMessage, setFailedUserMessage] = useState<UserMessage | null>(null)

  const restoreFailedUserMessage = () => {
    const message = lastUserMessageRef.current
    if (!message) return
    // Run error events can be delivered before the corresponding empty
    // MESSAGES_SNAPSHOT is applied. Defer the restore until that state update
    // has settled, then avoid duplicating a message that survived it.
    setTimeout(() => {
      if (!agent.messages.some((item) => item.id === message.id)) {
        agent.addMessage(message)
      }
    }, 0)
  }

  useEffect(() => {
    const subscription = agent.subscribe({
      onNewMessage: ({ message }) => {
        if (message.role === 'user') {
          lastUserMessageRef.current = message as UserMessage
        }
      },
      onRunInitialized: () => setRunError(null),
      onRunFailed: ({ error }) => {
        if (isRunCancellation(error)) {
          setFailedUserMessage(null)
          setRunError(null)
          return
        }
        setFailedUserMessage(lastUserMessageRef.current ?? null)
        restoreFailedUserMessage()
        setRunError(formatRunError(error))
      },
      onRunErrorEvent: ({ event }) => {
        if (isRunCancellation(event.message)) {
          setFailedUserMessage(null)
          setRunError(null)
          return
        }
        setFailedUserMessage(lastUserMessageRef.current ?? null)
        restoreFailedUserMessage()
        setRunError(formatRunError(new Error(event.message)))
      }
    })

    return () => subscription.unsubscribe()
  }, [agent])

  const retryLastRun = useCallback(
    async (messages: Array<{ role: string }>) => {
      if (agent.isRunning) return

      const nextMessages = buildRetryMessages(messages)
      if (nextMessages.length === 0) return

      setRunError(null)
      agent.setMessages(nextMessages as typeof agent.messages)

      try {
        await copilotkit.runAgent({ agent })
      } catch (error) {
        console.error('CopilotChat: retry runAgent failed', error)
      }
    },
    [agent, copilotkit]
  )

  return { runError, retryLastRun, failedUserMessage }
}
