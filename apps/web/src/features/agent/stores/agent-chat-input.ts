import { create } from 'zustand'

export interface AgentChatInputDraft {
  text: string
  timestamp: number
}

export interface AgentChatInputState {
  editDraft: AgentChatInputDraft | null
  setEditDraft: (text: string) => void
  clearEditDraft: () => void
}

export const useAgentChatInputStore = create<AgentChatInputState>((set) => ({
  editDraft: null,
  setEditDraft: (text: string) =>
    set({
      editDraft: {
        text,
        timestamp: Date.now()
      }
    }),
  clearEditDraft: () => set({ editDraft: null })
}))
