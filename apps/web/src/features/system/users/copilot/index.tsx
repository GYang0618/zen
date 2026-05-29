import { useCopilotAgentContext } from './agent-context'
import { useCopilotTools } from './copilot-tools'

export function Copilot() {
  useCopilotAgentContext()
  useCopilotTools()
  return null
}
