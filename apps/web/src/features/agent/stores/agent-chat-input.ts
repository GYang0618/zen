import { create } from 'zustand'

export interface AgentChatInputDraft {
  text: string
  timestamp: number
}

export interface AgentChatInputState {
  editDraft: AgentChatInputDraft | null
  newThreadNonce: number
  runningThreadIds: Set<string>
  setEditDraft: (text: string) => void
  clearEditDraft: () => void
  triggerNewThread: () => void
  markThreadRunning: (threadId: string, running: boolean) => void
}

export const useAgentChatInputStore = create<AgentChatInputState>((set) => ({
  editDraft: null,
  newThreadNonce: 0,
  runningThreadIds: new Set<string>(),
  setEditDraft: (text: string) =>
    set({
      editDraft: {
        text,
        timestamp: Date.now()
      }
    }),
  clearEditDraft: () => set({ editDraft: null }),
  triggerNewThread: () => set((state) => ({ newThreadNonce: state.newThreadNonce + 1 })),
  markThreadRunning: (threadId: string, running: boolean) =>
    set((state) => {
      if (running && state.runningThreadIds.has(threadId)) return state
      if (!running && !state.runningThreadIds.has(threadId)) return state
      const next = new Set(state.runningThreadIds)
      if (running) {
        next.add(threadId)
      } else {
        next.delete(threadId)
      }
      return { runningThreadIds: next }
    })
}))
