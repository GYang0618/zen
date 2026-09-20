import { create } from 'zustand'

import type { Thread } from '@copilotkit/react-core/v2'

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
  resolvingApprovalToolNames: Set<string>
  /** 首条消息发出后、服务端列表尚未返回前的乐观会话项 */
  provisionalThreads: Thread[]
  historyRefreshNonce: number
  setEditDraft: (text: string) => void
  clearEditDraft: () => void
  triggerNewThread: () => void
  markThreadRunning: (threadId: string, running: boolean) => void
  markMessageStopped: (messageId: string) => void
  clearMessageStopped: (messageId?: string) => void
  setPendingApprovalTools: (tools: PendingApprovalTool[]) => void
  clearPendingApprovalTools: () => void
  markApprovalToolsResolving: (toolNames: string[]) => void
  clearResolvingApprovalTools: (toolName?: string) => void
  upsertProvisionalThread: (thread: Thread) => void
  removeProvisionalThread: (threadId: string) => void
  requestHistoryRefresh: () => void
}

export const useAgentChatInputStore = create<AgentChatInputState>((set) => ({
  editDraft: null,
  newThreadNonce: 0,
  runningThreadIds: new Set<string>(),
  stoppedMessageIds: new Set<string>(),
  pendingApprovalTools: [],
  resolvingApprovalToolNames: new Set<string>(),
  provisionalThreads: [],
  historyRefreshNonce: 0,
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
  clearPendingApprovalTools: () => set({ pendingApprovalTools: [] }),
  markApprovalToolsResolving: (toolNames: string[]) =>
    set((state) => {
      const next = new Set(state.resolvingApprovalToolNames)
      for (const name of toolNames) {
        next.add(name)
      }
      return { resolvingApprovalToolNames: next }
    }),
  clearResolvingApprovalTools: (toolName?: string) =>
    set((state) => {
      if (!toolName) {
        if (state.resolvingApprovalToolNames.size === 0) return state
        return { resolvingApprovalToolNames: new Set() }
      }
      if (!state.resolvingApprovalToolNames.has(toolName)) return state
      const next = new Set(state.resolvingApprovalToolNames)
      next.delete(toolName)
      return { resolvingApprovalToolNames: next }
    }),
  upsertProvisionalThread: (thread) =>
    set((state) => {
      const index = state.provisionalThreads.findIndex((item) => item.id === thread.id)
      if (index === -1) {
        return { provisionalThreads: [thread, ...state.provisionalThreads] }
      }
      const next = [...state.provisionalThreads]
      next[index] = { ...next[index], ...thread, updatedAt: thread.updatedAt }
      return { provisionalThreads: next }
    }),
  removeProvisionalThread: (threadId) =>
    set((state) => {
      if (!state.provisionalThreads.some((item) => item.id === threadId)) return state
      return {
        provisionalThreads: state.provisionalThreads.filter((item) => item.id !== threadId)
      }
    }),
  requestHistoryRefresh: () =>
    set((state) => ({ historyRefreshNonce: state.historyRefreshNonce + 1 }))
}))
