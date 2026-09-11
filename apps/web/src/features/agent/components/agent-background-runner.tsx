import { UseAgentUpdate, useAgent } from '@copilotkit/react-core/v2'
import { useEffect } from 'react'

import { useAgentChatInputStore } from '../stores/agent-chat-input'

interface BackgroundThreadKeeperProps {
  threadId: string
  agentId?: string
}

function BackgroundThreadKeeper({ threadId, agentId = 'default' }: BackgroundThreadKeeperProps) {
  const markThreadRunning = useAgentChatInputStore((state) => state.markThreadRunning)
  const localAgentId = `chat-thread-${threadId}`

  const { agent } = useAgent({
    agentId: localAgentId,
    runtimeAgentId: agentId,
    threadId,
    updates: [UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })

  useEffect(() => {
    if (!agent.isRunning) {
      markThreadRunning(threadId, false)
    }

    const sub = agent.subscribe({
      onRunFinalized: () => {
        markThreadRunning(threadId, false)
      },
      onRunFailed: () => {
        markThreadRunning(threadId, false)
      }
    })

    return () => sub.unsubscribe()
  }, [agent, threadId, markThreadRunning])

  return null
}

export function AgentBackgroundRunner({
  activeThreadId,
  agentId = 'default'
}: {
  activeThreadId: string
  agentId?: string
}) {
  const runningThreadIds = useAgentChatInputStore((state) => state.runningThreadIds)

  const backgroundThreadIds = Array.from(runningThreadIds).filter(
    (threadId) => threadId !== activeThreadId
  )

  if (backgroundThreadIds.length === 0) return null

  return (
    <>
      {backgroundThreadIds.map((threadId) => (
        <BackgroundThreadKeeper key={threadId} threadId={threadId} agentId={agentId} />
      ))}
    </>
  )
}
