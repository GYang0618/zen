import { create } from 'zustand'

export interface AgentGenerativePanelState {
  isOpen: boolean
  activeToolCallId: string | null
  setOpen: (open: boolean) => void
  setActiveToolCallId: (id: string | null) => void
  openToolCall: (id: string) => void
  close: () => void
}

export const useAgentGenerativePanelStore = create<AgentGenerativePanelState>((set) => ({
  isOpen: false,
  activeToolCallId: null,
  setOpen: (isOpen) => set({ isOpen }),
  setActiveToolCallId: (activeToolCallId) => set({ activeToolCallId }),
  openToolCall: (id) => set({ activeToolCallId: id, isOpen: true }),
  close: () => set({ isOpen: false })
}))
