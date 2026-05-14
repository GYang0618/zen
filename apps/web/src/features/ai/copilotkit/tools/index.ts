// tools/index.ts

import { useCopilotChatOnlyTools } from './chat'
import { useCopilotPopupOnlyTools } from './popup'
import { useCopilotSharedTools } from './shared'

export function useCopilotPopupTools() {
  useCopilotSharedTools()
  useCopilotPopupOnlyTools()
}

export function useCopilotChatTools() {
  useCopilotSharedTools()
  useCopilotChatOnlyTools()
}
