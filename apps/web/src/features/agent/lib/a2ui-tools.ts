import { A2UI_SURFACE_TOOL_NAMES } from '@zen/shared'

import { isToolCallDisplayHidden, parseToolCallArguments } from './group-tool-calls'

import type { ToolCallLike } from './group-tool-calls'

/** CopilotKit activity 消息上的 A2UI Surface 类型，由画布而非对话流渲染。 */
export const A2UI_ACTIVITY_TYPE = 'a2ui-surface' as const

/** 中间件在画布参数流式阶段打在 activity content 上的状态。 */
export const A2UI_ACTIVITY_STATUS = {
  building: 'building',
  retrying: 'retrying',
  failed: 'failed'
} as const

const IN_PROGRESS_A2UI_STATUSES = new Set<string>([
  A2UI_ACTIVITY_STATUS.building,
  A2UI_ACTIVITY_STATUS.retrying
])

export interface ToolCallLikeForA2UI {
  id?: string
  function?: {
    name?: string
    arguments?: string
  }
}

/**
 * 判断 ToolCall 是否属于 A2UI 生成式 UI 界面。
 * 属于 A2UI 的工具会在右侧画布展示专用的 A2UI 组件；
 * 普通工具（如修改资料、更新状态、删除用户等）保持在左侧对话流中内联展示。
 */
export function isA2UIToolCall(toolCall: ToolCallLikeForA2UI | undefined | null): boolean {
  if (!toolCall) return false
  const name = toolCall.function?.name
  if (!name) return false
  return (A2UI_SURFACE_TOOL_NAMES as readonly string[]).includes(name)
}

interface A2uiActivityMessageLike {
  id?: string
  role: string
  activityType?: string
  content?: unknown
  toolCallId?: string
  toolCalls?: ToolCallLike[]
}

function readA2uiActivityStatus(content: unknown): string | undefined {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return undefined
  const status = (content as { status?: unknown }).status
  return typeof status === 'string' ? status : undefined
}

function hasA2uiOperations(content: unknown): boolean {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return false
  const operations = (content as { a2ui_operations?: unknown }).a2ui_operations
  return Array.isArray(operations) && operations.length > 0
}

function a2uiToolCallIds(messages: A2uiActivityMessageLike[]): string[] {
  const ids: string[] = []
  for (const message of messages) {
    if (message.role !== 'assistant') continue
    for (const toolCall of message.toolCalls ?? []) {
      if (toolCall.id && isA2UIToolCall(toolCall)) ids.push(toolCall.id)
    }
  }
  return ids
}

/** 画布工具是否都已经拿到结果。对不上具体调用时，本段里只要还有未返回的画布工具就不算结束。 */
function activityOperationsSettled(
  message: A2uiActivityMessageLike,
  messages: A2uiActivityMessageLike[]
): boolean {
  const ids = a2uiToolCallIds(messages)
  if (ids.length === 0) return false
  const linked = message.id ? ids.filter((id) => message.id?.includes(id)) : []
  const relevant = linked.length > 0 ? linked : ids
  return relevant.every((id) => hasToolResult(id, messages))
}

/**
 * 画布仍在生成。
 * `building` / `retrying` 是参数流式阶段；组件数组闭合后中间件会用
 * `a2ui_operations` 覆盖掉 status，这时只要工具结果还没回来，生成就没结束。
 */
export function isInProgressA2uiActivity(
  message: A2uiActivityMessageLike,
  messages: A2uiActivityMessageLike[] = []
): boolean {
  if (message.role !== 'activity' || message.activityType !== A2UI_ACTIVITY_TYPE) return false
  const status = readA2uiActivityStatus(message.content)
  if (status === A2UI_ACTIVITY_STATUS.failed) return false
  if (status !== undefined && IN_PROGRESS_A2UI_STATUSES.has(status)) return true
  if (!hasA2uiOperations(message.content)) return false
  return !activityOperationsSettled(message, messages)
}

function sliceTurn<T extends { id?: string; role: string }>(
  messages: T[],
  messageId: string
): T[] | undefined {
  const index = messages.findIndex((message) => message.id === messageId)
  if (index === -1) return undefined

  let start = 0
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    if (messages[cursor]?.role === 'user') {
      start = cursor + 1
      break
    }
  }

  let end = messages.length
  for (let cursor = index + 1; cursor < messages.length; cursor += 1) {
    if (messages[cursor]?.role === 'user') {
      end = cursor
      break
    }
  }

  return messages.slice(start, end)
}

/** 当前回合（相邻 user 之间）是否已有进行中的画布 activity。 */
export function turnHasInProgressA2uiActivity(
  messages: A2uiActivityMessageLike[],
  messageId: string
): boolean {
  const turn = sliceTurn(messages, messageId)
  return Boolean(turn?.some((message) => isInProgressA2uiActivity(message, turn)))
}

interface GeneratingCanvasMessage extends A2uiActivityMessageLike, CanvasToolMessageLike {
  toolCalls?: ToolCallLike[]
}

/** 画布工具已经开始，但结果还没回来。参数未闭合也算生成中。 */
export function isGeneratingA2uiToolCall(
  toolCall: ToolCallLike,
  messages: CanvasToolMessageLike[]
): boolean {
  if (!isA2UIToolCall(toolCall) || isToolCallDisplayHidden(toolCall)) return false
  if (!toolCall.id) return true
  return !hasToolResult(toolCall.id, messages)
}

/** 本回合里第一笔尚未返回的画布工具。 */
export function findTurnGeneratingA2uiToolCall(
  messages: GeneratingCanvasMessage[],
  anchorId: string
): ToolCallLike | undefined {
  const turn = sliceTurn(messages, anchorId)
  if (!turn) return undefined

  for (const message of turn) {
    if (message.role !== 'assistant') continue
    const toolCall = message.toolCalls?.find((call) => isGeneratingA2uiToolCall(call, messages))
    if (toolCall) return toolCall
  }
  return undefined
}

interface CanvasToolMessageLike {
  role: string
  toolCallId?: string
  content?: unknown
}

function readToolCallId(message: CanvasToolMessageLike): string | undefined {
  const linked = message as { toolCallId?: string; tool_call_id?: string }
  return linked.toolCallId ?? linked.tool_call_id
}

function hasToolResult(toolCallId: string, messages: CanvasToolMessageLike[]): boolean {
  return messages.some(
    (message) => message.role === 'tool' && readToolCallId(message) === toolCallId
  )
}

function hasSettledCanvasPayload(toolCall: ToolCallLike, hasResult: boolean): boolean {
  if (hasResult) return true
  const args = parseToolCallArguments(toolCall)
  return Array.isArray(args?.components) && args.components.length > 0
}

/**
 * 画布徽章只在生成意图已经落地后出现。
 * 参数还没闭合，或本轮仍在跑且工具还没有结果时先不展示，避免徽章闪出后又消失。
 */
export function shouldShowA2uiCanvasBadge(
  toolCall: ToolCallLike,
  messages: CanvasToolMessageLike[],
  isRunning: boolean
): boolean {
  if (!isA2UIToolCall(toolCall) || isToolCallDisplayHidden(toolCall)) return false
  if (!parseToolCallArguments(toolCall)) return false
  const hasResult = Boolean(toolCall.id && hasToolResult(toolCall.id, messages))
  if (!hasSettledCanvasPayload(toolCall, hasResult)) return false
  if (isRunning && !hasResult) return false
  return true
}
