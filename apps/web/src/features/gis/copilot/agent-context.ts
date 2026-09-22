import { useInteractiveDataContext } from './contexts/interactive-data'
import { usePromptContext } from './contexts/prompt'

export function useCopilotAgentContext() {
  usePromptContext()
  useInteractiveDataContext()
}
