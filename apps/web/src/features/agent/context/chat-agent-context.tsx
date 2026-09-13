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

export function useOptionalChatAgent(options?: UseChatAgentOptions) {
  const ctx = useContext(ChatAgentContext)
  const [, setTick] = useState(0)

  const agent = ctx?.agent
  const isReady = ctx?.isReady ?? false
  const activeThreadId = ctx?.activeThreadId ?? ''

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
          if (active) setTick((t) => (t + 1) % 1_000_000)
        })
      }
    }

    const forceUpdate =
      throttleMs > 0
        ? (() => {
            let lastCall = 0
            let timer: ReturnType<typeof setTimeout> | undefined
            return () => {
              const now = Date.now()
              const remaining = throttleMs - (now - lastCall)
              if (remaining <= 0) {
                lastCall = now
                batchedForceUpdate()
              } else if (!timer) {
                timer = setTimeout(() => {
                  timer = undefined
                  lastCall = Date.now()
                  batchedForceUpdate()
                }, remaining)
              }
            }
          })()
        : batchedForceUpdate

    const subscription = agent.subscribe({
      onMessagesChanged: updateFlags.includes(UseAgentUpdate.OnMessagesChanged)
        ? forceUpdate
        : undefined,
      onStateChanged: updateFlags.includes(UseAgentUpdate.OnStateChanged) ? forceUpdate : undefined,
      ...(updateFlags.includes(UseAgentUpdate.OnRunStatusChanged)
        ? {
            onRunInitialized: forceUpdate,
            onRunFinalized: forceUpdate,
            onRunFailed: forceUpdate,
            onRunErrorEvent: forceUpdate
          }
        : {})
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [agent, updateFlags, throttleMs])

  return { agent, isReady, activeThreadId }
}

export function useChatAgent(options?: UseChatAgentOptions) {
  const ctx = useContext(ChatAgentContext)

  if (!ctx) {
    throw new Error('useChatAgent must be used within a ChatAgentProvider')
  }

  const { copilotkit } = useCopilotKit()
  const result = useOptionalChatAgent(options)
  return {
    agent: ctx.agent,
    isReady: result.isReady,
    activeThreadId: result.activeThreadId,
    copilotkit
  }
}
