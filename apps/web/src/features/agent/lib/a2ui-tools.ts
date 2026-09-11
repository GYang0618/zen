export interface ToolCallLikeForA2UI {
  id?: string
  function?: {
    name?: string
    arguments?: string
  }
}

/**
 * 判断 ToolCall 是否属于 A2UI 生成式 UI 界面。
 * 属于 A2UI 的工具会在右侧“生成式工作区”展示专用的 A2UI 组件；
 * 普通工具（如修改资料、更新状态、删除用户等）保持在左侧对话流中内联展示。
 */
export function isA2UIToolCall(toolCall: ToolCallLikeForA2UI | undefined | null): boolean {
  if (!toolCall) return false
  const name = toolCall.function?.name
  if (!name) return false

  if (name === 'query_users_list') {
    try {
      const args = JSON.parse(toolCall.function?.arguments || '{}') as { display?: boolean }
      return args.display !== false
    } catch {
      return true
    }
  }

  if (name === 'generate_dynamic_dashboard' || name === 'render_a2ui') {
    return true
  }

  return false
}
