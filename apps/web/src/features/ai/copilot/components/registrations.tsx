import { useUsersTable } from '../generative-ui'
import { useAppearanceTool, useNavigateTool, useQueryRouteTool } from '../tools'

/** 全树只注册一次的工具。必须挂在 CopilotProvider 下，不能同时出现在 Popup / Chat 里。 */
export function CopilotSharedRegistrations() {
  useAppearanceTool()
  return null
}

export function PopupChatRegistrations() {
  useNavigateTool()
  useQueryRouteTool()
  return null
}

export function ChatRegistrations() {
  useUsersTable()
  return null
}
