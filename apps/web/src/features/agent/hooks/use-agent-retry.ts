'use client'

import { useCopilotKit } from '@copilotkit/react-core/v2'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import { useChatAgent } from '../context/chat-agent-context'
import { buildRetryMessages } from '../lib/messages'

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return ''
}

function isRunCancellation(error: unknown): boolean {
  const message = readErrorMessage(error).toLowerCase()
  return message.includes('cancel') || message.includes('abort')
}

function isRunInterrupt(error: unknown): boolean {
  const message = readErrorMessage(error).toLowerCase()
  return message.includes('interrupt')
}

export function classifyRunError(error: unknown): { title: string; detail?: string } {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : ''

  const lower = raw.toLowerCase()

  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('timed_out')) {
    return { title: '智能体响应超时', detail: '模型生成或接口处理超时，请点击重试' }
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('too many requests')
  ) {
    return { title: '请求过于频繁', detail: '触发访问频次限制，请稍候片刻再重试' }
  }
  if (lower.includes('token') && lower.includes('budget')) {
    return { title: 'Token 消耗超限', detail: '单次运行消耗的 Token 超出安全预算上限' }
  }
  if (lower.includes('failure') && lower.includes('budget')) {
    return { title: '连续重试熔断', detail: '底层工具执行连续失败超出容错上限，已自动终止' }
  }
  if (lower.includes('recursion') || lower.includes('recursion_limit')) {
    return { title: '执行步数超限', detail: '智能体调用递归步数超出上限，请精简提问' }
  }
  if (lower.includes('401') || lower.includes('unauthorized')) {
    return { title: '认证状态失效', detail: '用户登录凭据已过期，请刷新或重新登录' }
  }
  if (lower.includes('403') || lower.includes('forbidden')) {
    return { title: '无权限操作', detail: '当前账号未被授予执行此项任务所需的系统权限' }
  }
  if (
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('connection') ||
    lower.includes('econnrefused')
  ) {
    return { title: '网络连接异常', detail: '无法连接到智能体服务，请检查网络后重试' }
  }

  if (import.meta.env.DEV && raw.trim()) {
    return { title: '执行遇到异常', detail: raw }
  }

  return { title: '执行遇到异常', detail: raw.trim() || undefined }
}

function formatRunError(error: unknown): string {
  const { title, detail } = classifyRunError(error)
  return detail && detail !== title ? `${title}：${detail}` : title
}

export function useAgentRetry() {
  const { agent } = useChatAgent()
  const { copilotkit } = useCopilotKit()
  const [runError, setRunError] = useState<string | null>(null)
  type UserMessage = Extract<(typeof agent.messages)[number], { role: 'user' }>
  const lastUserMessageRef = useRef<{ threadId?: string; message: UserMessage } | undefined>(
    undefined
  )
  const [failedUserMessage, setFailedUserMessage] = useState<UserMessage | null>(null)

  const restoreFailedUserMessage = useEffectEvent(() => {
    const record = lastUserMessageRef.current
    if (!record || record.threadId !== agent.threadId) return
    const message = record.message
    // Run error events can be delivered before the corresponding empty
    // MESSAGES_SNAPSHOT is applied. Defer the restore until that state update
    // has settled, then avoid duplicating a message that survived it.
    setTimeout(() => {
      if (agent.threadId !== record.threadId) return
      if (!agent.messages.some((item) => item.id === message.id)) {
        agent.addMessage(message)
      }
    }, 0)
  })

  useEffect(() => {
    const subscription = agent.subscribe({
      onNewMessage: ({ message }) => {
        if (message.role === 'user') {
          lastUserMessageRef.current = {
            threadId: agent.threadId,
            message: message as UserMessage
          }
        }
      },
      onRunInitialized: () => setRunError(null),
      onRunFailed: ({ error }) => {
        if (isRunCancellation(error) || isRunInterrupt(error)) {
          setFailedUserMessage(null)
          setRunError(null)
          return
        }
        if (lastUserMessageRef.current?.threadId === agent.threadId) {
          setFailedUserMessage(lastUserMessageRef.current.message)
        } else {
          setFailedUserMessage(null)
        }
        restoreFailedUserMessage()
        setRunError(formatRunError(error))
      },
      onRunErrorEvent: ({ event }) => {
        if (isRunCancellation(event.message) || isRunInterrupt(event.message)) {
          setFailedUserMessage(null)
          setRunError(null)
          return
        }
        if (lastUserMessageRef.current?.threadId === agent.threadId) {
          setFailedUserMessage(lastUserMessageRef.current.message)
        } else {
          setFailedUserMessage(null)
        }
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
        console.error('AgentChat: retry runAgent failed', error)
      }
    },
    [agent, copilotkit]
  )

  return { runError, retryLastRun, failedUserMessage }
}
