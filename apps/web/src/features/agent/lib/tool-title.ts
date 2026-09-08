import { TOOL_TITLES } from '@zen/shared'

/** 将工具名转为友好的中文业务操作名称 */
export function formatToolTitle(name: string): string {
  if (!name) return '未知操作'
  return TOOL_TITLES[name] ?? name.replaceAll('_', ' ')
}
