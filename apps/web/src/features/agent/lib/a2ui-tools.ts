import { A2UI_SURFACE_TOOL_NAMES } from '@zen/shared'

/** CopilotKit activity 消息上的 A2UI Surface 类型，由画布而非对话流渲染。 */
export const A2UI_ACTIVITY_TYPE = 'a2ui-surface' as const

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
