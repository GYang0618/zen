import { useInteractiveDataContext } from './contexts/Interactive-data'
import { usePromptContext } from './contexts/prompt'

export function useCopilotAgentContext() {
  usePromptContext()
  useInteractiveDataContext()
}
