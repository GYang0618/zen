'use client'

import { randomUUID, useCopilotKit } from '@copilotkit/react-core/v2'
import { toast } from '@zen/ui'
import { useCallback, useRef } from 'react'

import { useChatAgentContext } from '../context/chat-agent-context'
import { useAgentChatInputStore } from '../stores/agent-chat-input'

export function useSendAgentUserMessage() {
  const ctx = useChatAgentContext()
  const { copilotkit } = useCopilotKit()
  const markThreadRunning = useAgentChatInputStore((state) => state.markThreadRunning)
  const requestHistoryRefresh = useAgentChatInputStore((state) => state.requestHistoryRefresh)
  const ctxRef = useRef(ctx)
  const copilotkitRef = useRef(copilotkit)
  const sendingRef = useRef(false)
  ctxRef.current = ctx
  copilotkitRef.current = copilotkit

  const send = useCallback(
    (text: string) => {
      const current = ctxRef.current
      const content = text.trim()
      if (!current || !content) return
      if (sendingRef.current || current.agent.isRunning) {
        toast.add({ title: '智能体正在回复，请稍后再操作', type: 'info' })
        return
      }

      const threadId = current.activeThreadId || current.agent.threadId
      sendingRef.current = true
      current.agent.addMessage({
        id: randomUUID(),
        role: 'user',
        content
      })
      if (threadId) markThreadRunning(threadId, true)

      void copilotkitRef.current
        .runAgent({ agent: current.agent })
        .then(() => {
          requestHistoryRefresh()
        })
        .catch((error: unknown) => {
          if (threadId) markThreadRunning(threadId, false)
          console.error('AgentChat: delegated list action failed', error)
          toast.add({ title: '发送操作消息失败', type: 'error' })
        })
        .finally(() => {
          sendingRef.current = false
        })
    },
    [markThreadRunning, requestHistoryRefresh]
  )

  return ctx ? send : null
}
