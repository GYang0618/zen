import { formatToolTitle } from './lib/tool-title'

export type ChatRunState =
  | 'idle'
  | 'composing'
  | 'submitting'
  | 'streaming'
  | 'tool-running'
  | 'waiting-approval'
  | 'reconnecting'
  | 'stopping'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type AgentDetailedPhase =
  | 'idle'
  | 'submitting'
  | 'waiting-schedule'
  | 'reasoning'
  | 'tool-running'
  | 'waiting-approval'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'reconnecting'

export interface AgentDetailedStatus {
  phase: AgentDetailedPhase
  label: string
  activeToolName?: string
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null) {
    const message = (error as Record<string, unknown>).message
    if (typeof message === 'string') return message
  }
  return ''
}

export function isRunCancellation(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined
  if (record?.name === 'AbortError') return true
  return /(?:run\s+)?cancelled|canceled|aborted/i.test(readErrorMessage(error))
}

/** LangGraph HITL 会把 GraphInterrupt 写成 RUN_ERROR message=`interrupt`，不能当成失败。 */
export function isRunInterrupt(error: unknown): boolean {
  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : undefined
  if (record?.name === 'GraphInterrupt' || record?.type === 'INTERRUPT') return true
  return /^interrupt$/i.test(readErrorMessage(error).trim())
}

export function deriveChatRunState(input: {
  online: boolean
  isRunning: boolean
  recovered: boolean
  persistedStatus?: string
}): ChatRunState {
  if (!input.online) return 'reconnecting'
  if (input.isRunning) return 'streaming'
  if (input.persistedStatus === 'interrupted') return 'waiting-approval'
  if (input.persistedStatus === 'failed' || input.persistedStatus === 'timed_out') return 'failed'
  if (input.persistedStatus === 'cancelled') return 'cancelled'
  if (input.persistedStatus === 'succeeded' || input.recovered) return 'completed'
  return 'idle'
}

interface MessageLike {
  role: string
  content?: unknown
  toolCallId?: string
  toolCalls?: Array<{
    id?: string
    function?: {
      name?: string
      arguments?: string
    }
  }>
}

export function deriveDetailedAgentStatus(input: {
  online: boolean
  isRunning: boolean
  awaitingApproval?: boolean
  runError?: string | null
  messages?: MessageLike[]
  isSubmitting?: boolean
}): AgentDetailedStatus {
  const { online, isRunning, awaitingApproval, runError, messages = [], isSubmitting } = input

  if (!online) {
    return { phase: 'reconnecting', label: '网络已断开，正在重连...' }
  }

  if (runError) {
    return { phase: 'failed', label: '生成遇到问题' }
  }

  if (awaitingApproval) {
    return { phase: 'waiting-approval', label: '等待操作确认...' }
  }

  if (isRunning) {
    // 检查是否有尚未完成的 toolCall
    const assistantMessages = messages.filter((m) => m.role === 'assistant')
    const completedToolCallIds = new Set(
      messages.filter((m) => m.role === 'tool' && m.toolCallId).map((m) => m.toolCallId as string)
    )

    let activeToolName: string | undefined
    for (let i = assistantMessages.length - 1; i >= 0; i -= 1) {
      const toolCalls = assistantMessages[i]?.toolCalls ?? []
      const pendingCall = toolCalls.find((call) => call.id && !completedToolCallIds.has(call.id))
      if (pendingCall?.function?.name) {
        activeToolName = pendingCall.function.name
        break
      }
    }

    if (activeToolName) {
      return {
        phase: 'tool-running',
        label: `正在调用 ${formatToolTitle(activeToolName)}...`,
        activeToolName
      }
    }

    // 检查最新消息是否为 reasoning
    const lastMsg = messages.at(-1)
    if (lastMsg?.role === 'reasoning') {
      return { phase: 'reasoning', label: '思考中...' }
    }

    // 检查是否有正在流式吐字的正文
    const lastAssistant = assistantMessages.at(-1)
    if (
      typeof lastAssistant?.content === 'string' &&
      lastAssistant.content.trim().length > 0 &&
      lastMsg?.role === 'assistant'
    ) {
      return { phase: 'streaming', label: '正在回复...' }
    }

    // 否则处于首字前的等待调度态
    return { phase: 'waiting-schedule', label: '正在思考...' }
  }

  if (isSubmitting) {
    return { phase: 'submitting', label: '发送中...' }
  }

  return { phase: 'idle', label: '就绪' }
}
