import { useUsersTable } from '../generative-ui'
import { useDefaultToolUi } from '../hooks/use-default-tool-ui'
import { useAppearanceTool } from '../tools'

/**`
 * agent共享的生成式UI和前端工具
 */
export function AgentSharedRegistrations() {
  useAppearanceTool()
  useDefaultToolUi()
  return null
}

/**
 * Popup模式专属生成式UI和前端工具（copilot辅助模式下）
 */
export function PopupChatRegistrations() {
  return null
}

/**
 * Chat模式专属生成式UI和前端工具（智能体模式下）
 */
export function ChatRegistrations() {
  useUsersTable()
  return null
}
