'use client'

import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { useCallback, useEffect, useState } from 'react'

import { buildRetryMessages } from '../lib/messages'

const RUN_ERROR_MESSAGE = '请求失败'

export function useAgentRetry() {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()
  const [runError, setRunError] = useState<string | null>(null)

  useEffect(() => {
    const subscription = agent.subscribe({
      onRunInitialized: () => setRunError(null),
      onRunFailed: () => {
        setRunError(RUN_ERROR_MESSAGE)
      },
      onRunErrorEvent: () => {
        setRunError(RUN_ERROR_MESSAGE)
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

  return { runError, retryLastRun }
}
