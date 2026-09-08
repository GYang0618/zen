'use client'

import { useCopilotKit } from '@copilotkit/react-core/v2'
import { useEffect, useReducer } from 'react'

import { snapshotMessages } from '../display-messages'

import type { DisplayMessageLike } from '../display-messages'

interface AgentLike {
  messages: DisplayMessageLike[]
  isRunning: boolean
  subscribe?: (handlers: {
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

interface CopilotKitWithAgentSubscription {
  subscribeToAgentWithOptions?: (
    targetAgent: unknown,
    targetHandlers: Record<string, () => void>,
    options?: { throttleMs?: number }
  ) => { unsubscribe: () => void }
}

/**
 * CopilotKit 流式更新会原地改 `agent.messages`。
 * 订阅后每次渲染都返回最新快照，避免 React Compiler 按引用跳过思考/回复的中间帧。
 */
export function useLiveAgentMessages<TMessage extends DisplayMessageLike>(
  agent: AgentLike & { messages: TMessage[] }
): LiveAgentMessages<TMessage> {
  const { copilotkit } = useCopilotKit()
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    const sync = () => forceUpdate()
    const handlers = {
      onMessagesChanged: sync,
      onRunInitialized: sync,
      onRunFinalized: sync,
      onRunFailed: sync,
      onStateChanged: sync
    }

    const copilotkitWithSub = copilotkit as unknown as CopilotKitWithAgentSubscription

    let subscription: { unsubscribe: () => void } | undefined
    if (typeof copilotkitWithSub.subscribeToAgentWithOptions === 'function') {
      subscription = copilotkitWithSub.subscribeToAgentWithOptions(agent, handlers, {
        throttleMs: 0
      })
    } else if (typeof agent.subscribe === 'function') {
      subscription = agent.subscribe(handlers)
    }

    return () => {
      subscription?.unsubscribe()
    }
  }, [agent, copilotkit])

  return {
    messages: snapshotMessages(agent.messages),
    isRunning: agent.isRunning
  }
}
