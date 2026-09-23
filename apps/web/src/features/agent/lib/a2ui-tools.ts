import { A2UI_SURFACE_TOOL_NAMES } from '@zen/shared'

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
}

function readA2uiActivityStatus(content: unknown): string | undefined {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return undefined
  const status = (content as { status?: unknown }).status
  return typeof status === 'string' ? status : undefined
}

/** 画布 activity 仍在组装参数，对话里还没有可打开的结果。 */
export function isInProgressA2uiActivity(message: A2uiActivityMessageLike): boolean {
  if (message.role !== 'activity' || message.activityType !== A2UI_ACTIVITY_TYPE) return false
  const status = readA2uiActivityStatus(message.content)
  return status !== undefined && IN_PROGRESS_A2UI_STATUSES.has(status)
}

/** 当前回合（相邻 user 之间）是否已有进行中的画布 activity。 */
export function turnHasInProgressA2uiActivity(
  messages: A2uiActivityMessageLike[],
  messageId: string
): boolean {
  const index = messages.findIndex((message) => message.id === messageId)
  if (index === -1) return false

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

  return messages.slice(start, end).some((message) => isInProgressA2uiActivity(message))
}
