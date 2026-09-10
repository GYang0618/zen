import { useDefaultToolRender } from '../generative-ui'
import { useAppearanceTool } from '../hooks/tools'

/**
 * agent共享的生成式UI和前端工具
 */
export function AgentSharedRegistrations() {
  useAppearanceTool()
  useDefaultToolRender()
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
  return null
}
