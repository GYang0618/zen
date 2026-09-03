import { useJobProfilesTable, useUsersTable } from '../generative-ui'
import { useDefaultToolUi } from '../hooks/use-default-tool-ui'
import { useAppearanceTool, useNavigateTool, useQueryRouteTool } from '../tools'

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

/**
 * 审批 UI（`ChatApprovalRegistration`）不在此处注册：它需要内联渲染在消息流末尾，
 * 因此由 `chat.tsx` 在对应 DOM 位置直接挂载，而不是作为无位置要求的隐藏注册组件。
 */
export function ChatRegistrations() {
  useUsersTable()
  useJobProfilesTable()
  return null
}
