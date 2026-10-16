import { A2UI_ACTIVITY_TYPE, isA2UIToolCall, isInProgressA2uiActivity } from './a2ui-tools'
import { isChatSurfaceToolCall, isTurnFinalDisplayToolCall } from './group-tool-calls'

import type { ToolCallLike } from './group-tool-calls'

export interface ChatTurnMessageLike {
  id?: string
  role: string
  content?: unknown
  toolCalls?: ToolCallLike[]
  activityType?: string
  metadata?: unknown
}

export interface ChatTurn<T extends ChatTurnMessageLike = ChatTurnMessageLike> {
  key: string
  user?: T
  /** 最终回复之前的工作消息，保持事件顺序。 */
  foldedBefore: T[]
  /** 最终回复之后仍属于工作区的消息（例如正文之后又开始的思考）。 */
  foldedAfter: T[]
  foldedMessages: T[]
  finalAssistant?: T
}

/**
 * 工作轨迹里的工具步骤。
 * `meta.display === false` 只表示不渲染专属结果界面，调用本身仍要留在轨迹里。
 */
export function isInlineStandardToolCall(toolCall: ToolCallLike): boolean {
  return (
    !isA2UIToolCall(toolCall) &&
    !isTurnFinalDisplayToolCall(toolCall) &&
    !isChatSurfaceToolCall(toolCall)
  )
}

export function getInlineStandardToolCalls(toolCalls: ToolCallLike[] | undefined): ToolCallLike[] {
  if (!toolCalls?.length) return []
  return toolCalls.filter(isInlineStandardToolCall)
}

function isA2uiActivity(message: ChatTurnMessageLike): boolean {
  return message.role === 'activity' && message.activityType === A2UI_ACTIVITY_TYPE
}

function hasVisibleText(message: ChatTurnMessageLike): boolean {
  return typeof message.content === 'string' && message.content.trim().length > 0
}

function hasToolCalls(message: ChatTurnMessageLike): boolean {
  return Array.isArray(message.toolCalls) && message.toolCalls.length > 0
}

/** 这条消息之后是否又有一次模型输出。工具结果和画布 activity 不算新的一步。 */
function hasLaterModelStep(messages: ChatTurnMessageLike[], index: number): boolean {
  return messages
    .slice(index + 1)
    .some((message) => message.role === 'reasoning' || message.role === 'assistant')
}

function readToolResultId(message: ChatTurnMessageLike): string | undefined {
  const linked = message as { toolCallId?: string; tool_call_id?: string }
  return linked.toolCallId ?? linked.tool_call_id
}

/** 还有工具没返回，或画布仍在组装时，工作段还没结束。 */
function hasUnresolvedWork(messages: ChatTurnMessageLike[]): boolean {
  if (messages.some((message) => isInProgressA2uiActivity(message, messages))) return true

  const settled = new Set<string>()
  for (const message of messages) {
    if (message.role !== 'tool') continue
    const toolCallId = readToolResultId(message)
    if (toolCallId) settled.add(toolCallId)
  }

  return messages.some(
    (message) =>
      message.role === 'assistant' &&
      (message.toolCalls ?? []).some((toolCall) => !toolCall.id || !settled.has(toolCall.id))
  )
}

function findLastAssistant<T extends ChatTurnMessageLike>(
  messages: T[],
  match: (message: T) => boolean
): { message: T; index: number } | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message && match(message)) return { message, index }
  }
  return undefined
}

/**
 * 只有同时满足才把助手消息放到轨迹外：有正文、没有工具调用、后面没有新的模型步骤。
 * 运行中的尾部文字还可能再挂上工具，不能提前当成最终回复。
 * 带工具调用的说明始终留在轨迹里。
 */
function selectFinalAssistant<T extends ChatTurnMessageLike>(
  messages: T[],
  liveRun: boolean
): T | undefined {
  if (!liveRun) {
    const textOnly = findLastAssistant(
      messages,
      (message) => message.role === 'assistant' && hasVisibleText(message) && !hasToolCalls(message)
    )
    if (textOnly && !hasLaterModelStep(messages, textOnly.index)) return textOnly.message
  }

  const last = messages.at(-1)
  if (last?.role !== 'assistant' || hasVisibleText(last) || hasToolCalls(last)) return undefined
  if (liveRun && hasUnresolvedWork(messages)) return undefined
  return last
}

function isWorkMessage<T extends ChatTurnMessageLike>(
  message: T,
  finalAssistant: T | undefined
): boolean {
  if (message.role === 'tool') return false
  if (isA2uiActivity(message)) return false
  if (finalAssistant && message === finalAssistant) return false
  return true
}

/**
 * 按 user 消息切分回合。工作段按事件顺序留在轨迹里；
 * 只有收束后的正文放到轨迹外。liveRun 只作用于最后一轮。
 */
export function groupMessagesIntoTurns<T extends ChatTurnMessageLike>(
  messages: T[],
  options?: { liveRun?: boolean }
): ChatTurn<T>[] {
  const groups: Array<{ user?: T; rest: T[] }> = []
  let current: { user?: T; rest: T[] } | undefined

  for (const message of messages) {
    if (message.role === 'user') {
      if (current) groups.push(current)
      current = { user: message, rest: [] }
      continue
    }
    if (!current) current = { rest: [] }
    current.rest.push(message)
  }
  if (current) groups.push(current)

  return groups.map((group, index) => {
    const liveRun = Boolean(options?.liveRun && index === groups.length - 1)
    const finalAssistant = selectFinalAssistant(group.rest, liveRun)
    const finalIndex = finalAssistant ? group.rest.lastIndexOf(finalAssistant) : -1
    const foldedBefore = (finalIndex === -1 ? group.rest : group.rest.slice(0, finalIndex)).filter(
      (message) => isWorkMessage(message, finalAssistant)
    )
    const foldedAfter =
      finalIndex === -1
        ? []
        : group.rest
            .slice(finalIndex + 1)
            .filter((message) => isWorkMessage(message, finalAssistant))

    return {
      key: `${group.user?.id ?? finalAssistant?.id ?? 'turn'}-${index}`,
      user: group.user,
      foldedBefore,
      foldedAfter,
      foldedMessages: [...foldedBefore, ...foldedAfter],
      finalAssistant
    }
  })
}

export function turnHasFoldableWork<T extends ChatTurnMessageLike>(turn: ChatTurn<T>): boolean {
  if (turn.foldedMessages.length > 0) return true
  return getInlineStandardToolCalls(turn.finalAssistant?.toolCalls).length > 0
}
