'use client'

import { useEffect, useState } from 'react'

import { snapshotMessages } from '../display-messages'

import type { DisplayMessageLike } from '../display-messages'

interface AgentLike {
  messages: DisplayMessageLike[]
  isRunning: boolean
  subscribe: (handlers: {
    onMessagesChanged?: () => void
    onRunInitialized?: () => void
    onRunFinalized?: () => void
    onRunFailed?: () => void
    onStateChanged?: () => void
  }) => { unsubscribe: () => void }
}

interface LiveAgentMessages<TMessage extends DisplayMessageLike> {
  messages: TMessage[]
  isRunning: boolean
}

function readLiveAgentMessages<TMessage extends DisplayMessageLike>(
  agent: AgentLike & { messages: TMessage[] }
): LiveAgentMessages<TMessage> {
  return {
    messages: snapshotMessages(agent.messages),
    isRunning: agent.isRunning
  }
}

/**
 * CopilotKit 流式更新会原地改 `agent.messages`。
 * 订阅后写入新快照，避免 React Compiler 按引用跳过思考/回复的中间帧。
 */
export function useLiveAgentMessages<TMessage extends DisplayMessageLike>(
  agent: AgentLike & { messages: TMessage[] }
): LiveAgentMessages<TMessage> {
  const [live, setLive] = useState(() => readLiveAgentMessages(agent))

  useEffect(() => {
    const sync = () => setLive(readLiveAgentMessages(agent))
    sync()
    const subscription = agent.subscribe({
      onMessagesChanged: sync,
      onRunInitialized: sync,
      onRunFinalized: sync,
      onRunFailed: sync,
      onStateChanged: sync
    })
    return () => subscription.unsubscribe()
  }, [agent])

  return {
    messages: live.messages,
    isRunning: agent.isRunning
  }
}
