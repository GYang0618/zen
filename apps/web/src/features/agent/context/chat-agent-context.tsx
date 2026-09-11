import { UseAgentUpdate, useCopilotKit } from '@copilotkit/react-core/v2'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { AbstractAgent } from '@copilotkit/react-core/v2'

export interface ChatAgentContextValue {
  agent: AbstractAgent
  isReady: boolean
  activeThreadId: string
}

const ChatAgentContext = createContext<ChatAgentContextValue | null>(null)

export function ChatAgentProvider({
  agent,
  isReady,
  activeThreadId,
  children
}: {
  agent: AbstractAgent
  isReady: boolean
  activeThreadId: string
  children: React.ReactNode
}) {
  return (
    <ChatAgentContext.Provider value={{ agent, isReady, activeThreadId }}>
      {children}
    </ChatAgentContext.Provider>
  )
}

const ALL_UPDATES = [
  UseAgentUpdate.OnMessagesChanged,
  UseAgentUpdate.OnStateChanged,
  UseAgentUpdate.OnRunStatusChanged
]

export interface UseChatAgentOptions {
  updates?: UseAgentUpdate[]
  throttleMs?: number
}

export function useChatAgent(options?: UseChatAgentOptions) {
  const ctx = useContext(ChatAgentContext)
  const { copilotkit } = useCopilotKit()
  const [, setTick] = useState(0)

  if (!ctx) {
    throw new Error('useChatAgent must be used within a ChatAgentProvider')
  }

  const { agent, isReady, activeThreadId } = ctx
  const updatesKey = options?.updates ? JSON.stringify(options.updates) : ''
  const updateFlags = useMemo(() => {
    if (!updatesKey) return ALL_UPDATES
    return options?.updates ?? ALL_UPDATES
  }, [options?.updates, updatesKey])
  const throttleMs = options?.throttleMs ?? 0

  useEffect(() => {
    if (!agent || updateFlags.length === 0) return

    let active = true
    let batchScheduled = false

    const batchedForceUpdate = () => {
      if (!active) return
      if (!batchScheduled) {
        batchScheduled = true
        queueMicrotask(() => {
          batchScheduled = false
          if (active) {
            setTick((t) => t + 1)
          }
        })
      }
    }

    const handlers: Record<string, () => void> = {}

    if (updateFlags.includes(UseAgentUpdate.OnMessagesChanged)) {
      handlers.onMessagesChanged = batchedForceUpdate
    }
    if (updateFlags.includes(UseAgentUpdate.OnStateChanged)) {
      handlers.onStateChanged = batchedForceUpdate
    }
    if (updateFlags.includes(UseAgentUpdate.OnRunStatusChanged)) {
      handlers.onRunInitialized = batchedForceUpdate
      handlers.onRunFinalized = batchedForceUpdate
      handlers.onRunFailed = batchedForceUpdate
      handlers.onRunErrorEvent = batchedForceUpdate
    }

    const sub = copilotkit.subscribeToAgentWithOptions(agent, handlers, { throttleMs })
    return () => {
      active = false
      sub.unsubscribe()
    }
  }, [agent, copilotkit, throttleMs, updateFlags])

  return { agent, isReady, activeThreadId }
}
