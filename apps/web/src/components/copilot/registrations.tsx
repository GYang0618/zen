import { useUsersTable } from './generative-ui'
import { useNavigateTool, useThemeTool, useUserTools } from './tools'

function useCopilotSharedRegistry() {
  useThemeTool()
}

export function PopupChatRegistrations() {
  useCopilotSharedRegistry()
  useNavigateTool()
  useUserTools()

  return null
}

export function ChatRegistrations() {
  useCopilotSharedRegistry()
  useUsersTable()

  return null
}
