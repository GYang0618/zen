import { A2UI_ACTIVITY_TYPE, isA2UIToolCall } from './a2ui-tools'
import { isToolCallDisplayEnabled, isTurnFinalDisplayToolCall } from './group-tool-calls'

import type { ToolCallLike } from './group-tool-calls'

export interface ChatTurnMessageLike {
  id?: string
  role: string
  content?: unknown
  toolCalls?: ToolCallLike[]
  activityType?: string
}

export interface ChatTurn<T extends ChatTurnMessageLike = ChatTurnMessageLike> {
  key: string
  user?: T
  foldedMessages: T[]
  finalAssistant?: T
}

/** 对话流内联工具卡片：非 A2UI、非末尾展示槽，且未显式关闭 display。 */
export function isInlineStandardToolCall(toolCall: ToolCallLike): boolean {
  return (
    !isA2UIToolCall(toolCall) &&
    !isTurnFinalDisplayToolCall(toolCall) &&
    isToolCallDisplayEnabled(toolCall)
  )
}

export function getInlineStandardToolCalls(toolCalls: ToolCallLike[] | undefined): ToolCallLike[] {
  if (!toolCalls?.length) return []
  return toolCalls.filter(isInlineStandardToolCall)
}

function isA2uiActivity(message: ChatTurnMessageLike): boolean {
  return message.role === 'activity' && message.activityType === A2UI_ACTIVITY_TYPE
}

/**
 * 按 user 消息切分回合：最后一条 assistant 作为最终回复，其余思考 / ReAct / activity 进入折叠区。
 */
export function groupMessagesIntoTurns<T extends ChatTurnMessageLike>(
  messages: T[]
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
    const assistants = group.rest.filter((message) => message.role === 'assistant')
    const finalAssistant = assistants.at(-1)
    const foldedMessages = group.rest.filter((message) => {
      if (message.role === 'tool') return false
      if (isA2uiActivity(message)) return false
      if (finalAssistant && message === finalAssistant) return false
      return true
    })

    return {
      key: `${group.user?.id ?? finalAssistant?.id ?? 'turn'}-${index}`,
      user: group.user,
      foldedMessages,
      finalAssistant
    }
  })
}

export function turnHasFoldableWork<T extends ChatTurnMessageLike>(turn: ChatTurn<T>): boolean {
  if (turn.foldedMessages.length > 0) return true
  return getInlineStandardToolCalls(turn.finalAssistant?.toolCalls).length > 0
}
