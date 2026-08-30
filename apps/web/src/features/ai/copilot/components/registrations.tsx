import { useJobProfilesTable, useUsersTable } from '../generative-ui'
import { useDefaultToolUi } from '../hooks/use-default-tool-ui'
import { useAppearanceTool, useNavigateTool, useQueryRouteTool } from '../tools'
import { ChatApprovalRegistration } from './chat-approval'

/** 全树只注册一次的工具。必须挂在 CopilotProvider 下，不能同时出现在 Popup / Chat 里。 */
export function CopilotSharedRegistrations() {
  useAppearanceTool()
  useDefaultToolUi()
  return null
}

export function PopupChatRegistrations() {
  useNavigateTool()
  useQueryRouteTool()
  return null
}

export function ChatRegistrations() {
  useUsersTable()
  useJobProfilesTable()
  return <ChatApprovalRegistration />
}
