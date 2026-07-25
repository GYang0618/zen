import { useOrganizationTreeView, useRolesTable, useUsersTable } from '../generative-ui'
import { useNavigateTool, useQueryRouteTool, useThemeTool } from '../tools'

function useCopilotSharedRegistry() {
  useThemeTool()
}

export function PopupChatRegistrations() {
  useCopilotSharedRegistry()
  useNavigateTool()
  useQueryRouteTool()
  return null
}

export function ChatRegistrations() {
  useCopilotSharedRegistry()
  useUsersTable()
  useRolesTable()
  useOrganizationTreeView()
  return null
}
