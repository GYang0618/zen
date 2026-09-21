import { createContext, useContext } from 'react'

export interface AgentPopupContextValue {
  threadId: string
  onNewThread: () => void
}

export const AgentPopupContext = createContext<AgentPopupContextValue | null>(null)

export function useAgentPopupContext() {
  return useContext(AgentPopupContext)
}
