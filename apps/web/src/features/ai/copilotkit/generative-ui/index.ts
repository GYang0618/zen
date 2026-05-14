import { useCopilotChatOnlyGenerativeUIComponents } from './chat'
import { useCopilotPopupOnlyGenerativeUIComponents } from './popup'
import { useCopilotSharedGenerativeUIComponents } from './shared'

export function useCopilotChatGenerativeUIComponents() {
  useCopilotSharedGenerativeUIComponents()
  useCopilotChatOnlyGenerativeUIComponents()
}

export function useCopilotPopupGenerativeUIComponents() {
  useCopilotSharedGenerativeUIComponents()
  useCopilotPopupOnlyGenerativeUIComponents()
}
