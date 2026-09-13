import { create } from 'zustand'

export interface AgentChatInputDraft {
  text: string
  timestamp: number
}

export interface PendingApprovalTool {
  name: string
  args?: Record<string, unknown>
  description?: string
}

export interface AgentChatInputState {
  editDraft: AgentChatInputDraft | null
  newThreadNonce: number
  runningThreadIds: Set<string>
  stoppedMessageIds: Set<string>
  pendingApprovalTools: PendingApprovalTool[]
  setEditDraft: (text: string) => void
  clearEditDraft: () => void
  triggerNewThread: () => void
  markThreadRunning: (threadId: string, running: boolean) => void
  markMessageStopped: (messageId: string) => void
  clearMessageStopped: (messageId?: string) => void
  setPendingApprovalTools: (tools: PendingApprovalTool[]) => void
  clearPendingApprovalTools: () => void
}

export const useAgentChatInputStore = create<AgentChatInputState>((set) => ({
  editDraft: null,
  newThreadNonce: 0,
  runningThreadIds: new Set<string>(),
  stoppedMessageIds: new Set<string>(),
  pendingApprovalTools: [],
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
    }),
  markMessageStopped: (messageId: string) =>
    set((state) => {
      if (state.stoppedMessageIds.has(messageId)) return state
      const next = new Set(state.stoppedMessageIds)
      next.add(messageId)
      return { stoppedMessageIds: next }
    }),
  clearMessageStopped: (messageId?: string) =>
    set((state) => {
      if (!messageId) {
        if (state.stoppedMessageIds.size === 0) return state
        return { stoppedMessageIds: new Set() }
      }
      if (!state.stoppedMessageIds.has(messageId)) return state
      const next = new Set(state.stoppedMessageIds)
      next.delete(messageId)
      return { stoppedMessageIds: next }
    }),
  setPendingApprovalTools: (tools: PendingApprovalTool[]) => set({ pendingApprovalTools: tools }),
  clearPendingApprovalTools: () => set({ pendingApprovalTools: [] })
}))
