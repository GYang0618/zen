import { randomUUID, UseAgentUpdate, useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAgentChatInputStore } from '../stores/agent-chat-input'

interface UseAgentThreadSyncOptions {
  agentId?: string
  threadId?: string
}

export function useAgentThreadSync({
  agentId = 'default',
  threadId
}: UseAgentThreadSyncOptions = {}) {
  const [freshThreadId, setFreshThreadId] = useState(() => randomUUID())
  const [lastConnectedThreadId, setLastConnectedThreadId] = useState<string | null>(() =>
    threadId ? null : freshThreadId
  )
  const newThreadNonce = useAgentChatInputStore((state) => state.newThreadNonce)
  const markThreadRunning = useAgentChatInputStore((state) => state.markThreadRunning)

  const hasExplicitThreadId = Boolean(threadId)
  const activeThreadId = threadId ?? freshThreadId
  const localAgentId = 'chat-active'

  const { agent, isReady } = useAgent({
    agentId: localAgentId,
    runtimeAgentId: agentId,
    threadId: activeThreadId,
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const { copilotkit } = useCopilotKit()

  const previousThreadIdRef = useRef<string | null>(null)

  const isConnecting = hasExplicitThreadId && lastConnectedThreadId !== activeThreadId

  const startNewThread = useCallback(() => {
    const nextId = randomUUID()
    setFreshThreadId(nextId)
    setLastConnectedThreadId(nextId)
  }, [])

  // 当外部显式触发新建对话事件时执行重置
  const prevNonceRef = useRef(newThreadNonce)
  useEffect(() => {
    if (newThreadNonce > prevNonceRef.current) {
      prevNonceRef.current = newThreadNonce
      startNewThread()
    }
  }, [newThreadNonce, startNewThread])

  // 监听并上报当前 Agent 的运行状态到全局 runningThreadIds
  useEffect(() => {
    if (agent.isRunning) {
      markThreadRunning(activeThreadId, true)
    }
    const sub = agent.subscribe({
      onRunInitialized: () => {
        markThreadRunning(activeThreadId, true)
      },
      onRunFinalized: () => {
        markThreadRunning(activeThreadId, false)
      },
      onRunFailed: () => {
        markThreadRunning(activeThreadId, false)
      }
    })
    return () => sub.unsubscribe()
  }, [agent, activeThreadId, markThreadRunning])

  useEffect(() => {
    agent.threadId = activeThreadId

    // 如果是新建对话（非历史会话）
    if (!hasExplicitThreadId) {
      if (previousThreadIdRef.current !== activeThreadId) {
        previousThreadIdRef.current = activeThreadId
        if (agent.messages.length > 0) {
          agent.setMessages([])
        }
      }
      return
    }

    // 如果当前会话已连接成功，无需重复连接
    if (lastConnectedThreadId === activeThreadId) {
      return
    }

    previousThreadIdRef.current = activeThreadId

    // 如果是历史会话，连接并拉取服务端历史消息
    let detached = false
    const controller = new AbortController()
    if ('abortController' in agent) {
      ;(agent as { abortController?: AbortController }).abortController = controller
    }

    const connect = async () => {
      try {
        await copilotkit.connectAgent({ agent })
      } catch (error) {
        if (detached) return
        console.error('useAgentThreadSync: connectAgent failed', error)
      } finally {
        if (!detached) {
          const schedule =
            typeof requestAnimationFrame === 'function'
              ? requestAnimationFrame
              : (cb: () => void) => setTimeout(cb, 16)
          schedule(() => {
            if (!detached) {
              setLastConnectedThreadId(activeThreadId)
            }
          })
        }
      }
    }

    void connect()

    return () => {
      detached = true
      controller.abort()
      if (typeof agent.detachActiveRun === 'function') {
        agent.detachActiveRun().catch(() => {})
      }
    }
  }, [activeThreadId, hasExplicitThreadId, agent, copilotkit, lastConnectedThreadId])

  return {
    activeThreadId,
    localAgentId,
    hasExplicitThreadId,
    isConnecting,
    startNewThread,
    agent,
    isReady
  }
}
