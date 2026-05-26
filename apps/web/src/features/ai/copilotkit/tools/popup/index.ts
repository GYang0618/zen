import { useNavigateTool } from './use-navigate-tool'
import { useUserTools } from './use-user-tools'

export function useCopilotPopupOnlyTools() {
  useNavigateTool()
  useUserTools()
}
