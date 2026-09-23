import { useUserHumanInTheLoop } from '../hitl'
import {
  useDefaultRender,
  useOrganizationsRenderers,
  usePostsRenderers,
  useRolesRenderers,
  useUsersRenderers
} from '../renderers'
import { useAppearanceTool } from '../tools'

/**
 * agent共享的生成式UI和前端工具
 */
export function AgentSharedRegistrations() {
  useAppearanceTool()
  useDefaultRender()
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
  useUsersRenderers()
  usePostsRenderers()
  useRolesRenderers()
  useOrganizationsRenderers()
  useUserHumanInTheLoop()
  return null
}
