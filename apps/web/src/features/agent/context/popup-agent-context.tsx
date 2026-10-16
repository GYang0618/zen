import { randomUUID, useCopilotKit } from '@copilotkit/react-core/v2'
import { PAGE_AGENT_ID } from '@zen/shared'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { useAgentChatInputStore } from '../stores/agent-chat-input'

/** 弹层对话使用的运行时 agent，须与 CopilotPopup.agentId 一致 */
export const POPUP_AGENT_ID = PAGE_AGENT_ID

export interface PopupAgentContextValue {
  threadId: string
  onNewThread: () => void
}

const PopupAgentContext = createContext<PopupAgentContextValue | null>(null)

export function PopupAgentProvider({ children }: { children: React.ReactNode }) {
  const { copilotkit } = useCopilotKit()
  const [threadId, setThreadId] = useState(() => randomUUID())

  const onNewThread = useCallback(() => {
    const nextThreadId = randomUUID()
    setThreadId(nextThreadId)
    const agent = copilotkit.getAgent(POPUP_AGENT_ID)
    if (agent) {
      agent.threadId = nextThreadId
      agent.setMessages([])
    }
    const input = useAgentChatInputStore.getState()
    input.clearEditDraft()
    input.triggerNewThread()
  }, [copilotkit])

  const value = useMemo(() => ({ threadId, onNewThread }), [threadId, onNewThread])

  return <PopupAgentContext value={value}>{children}</PopupAgentContext>
}

export function usePopupAgent() {
  const value = useContext(PopupAgentContext)
  if (!value) {
    throw new Error('usePopupAgent must be used within a PopupAgentProvider')
  }
  return value
}
