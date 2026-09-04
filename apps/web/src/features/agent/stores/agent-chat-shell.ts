import { create } from 'zustand'

import { appendThreadPage, mergeThreadPage } from '../lib/thread-list'

import type { AgentThreadListPage, AgentThreadSummary } from '../runtime-api'

export type AgentChatShellHandlers = {
  createThread: () => Promise<void>
  selectThread: (threadId: string) => Promise<void>
  renameThread: (threadId: string, title: string) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  loadMoreThreads: () => Promise<void>
  resumeRun: (runId: string) => Promise<void>
  cancelRun: (runId: string) => Promise<void>
}

export interface AgentChatShellState {
  threads: AgentThreadSummary[]
  currentThreadId: string | undefined
  runningThreadId: string | undefined
  historyLoading: boolean
  historyLoadingMore: boolean
  historyHasMore: boolean
  historyCursor: string | null
  historyPaged: boolean
  historyLoadMoreError: boolean
  threadLoading: boolean
  runsOpen: boolean
  runsThreadId: string | undefined
  handlers: AgentChatShellHandlers | null

  setThreads: (threads: AgentThreadSummary[]) => void
  upsertThread: (thread: AgentThreadSummary) => void
  patchThread: (threadId: string, patch: Partial<AgentThreadSummary>) => void
  removeThread: (threadId: string) => void
  applyThreadPage: (page: AgentThreadListPage, mode: 'refresh' | 'append') => void
  setCurrentThreadId: (threadId: string | undefined) => void
  setRunningThreadId: (threadId: string | undefined) => void
  setHistoryLoading: (loading: boolean) => void
  setHistoryLoadingMore: (loading: boolean) => void
  setHistoryLoadMoreError: (error: boolean) => void
  setThreadLoading: (loading: boolean) => void
  setRunsOpen: (open: boolean, threadId?: string) => void
  bindHandlers: (handlers: AgentChatShellHandlers) => void
  unbindHandlers: () => void
}

export const useAgentChatShellStore = create<AgentChatShellState>((set) => ({
  threads: [],
  currentThreadId: undefined,
  runningThreadId: undefined,
  historyLoading: false,
  historyLoadingMore: false,
  historyHasMore: false,
  historyCursor: null,
  historyPaged: false,
  historyLoadMoreError: false,
  threadLoading: false,
  runsOpen: false,
  runsThreadId: undefined,
  handlers: null,

  setThreads: (threads) => set({ threads }),
  upsertThread: (thread) =>
    set((state) => ({
      threads: [thread, ...state.threads.filter((item) => item.id !== thread.id)]
    })),
  patchThread: (threadId, patch) =>
    set((state) => ({
      threads: state.threads.map((item) => (item.id === threadId ? { ...item, ...patch } : item))
    })),
  removeThread: (threadId) =>
    set((state) => ({
      threads: state.threads.filter((item) => item.id !== threadId)
    })),
  applyThreadPage: (page, mode) =>
    set((state) => {
      if (mode === 'append') {
        return {
          threads: appendThreadPage(state.threads, page.items),
          historyCursor: page.cursor,
          historyHasMore: page.hasMore,
          historyPaged: true,
          historyLoadMoreError: false
        }
      }

      const threads = mergeThreadPage(state.threads, page.items)
      const replacePageMeta = !state.historyPaged
      return {
        threads,
        ...(replacePageMeta ? { historyCursor: page.cursor, historyHasMore: page.hasMore } : {}),
        historyLoadMoreError: false
      }
    }),
  setCurrentThreadId: (currentThreadId) => set({ currentThreadId }),
  setRunningThreadId: (runningThreadId) => set({ runningThreadId }),
  setHistoryLoading: (historyLoading) => set({ historyLoading }),
  setHistoryLoadingMore: (historyLoadingMore) => set({ historyLoadingMore }),
  setHistoryLoadMoreError: (historyLoadMoreError) => set({ historyLoadMoreError }),
  setThreadLoading: (threadLoading) => set({ threadLoading }),
  setRunsOpen: (open, threadId) =>
    set((state) => ({
      runsOpen: open,
      runsThreadId: open ? (threadId ?? state.runsThreadId) : undefined
    })),
  bindHandlers: (handlers) => set({ handlers }),
  unbindHandlers: () => set({ handlers: null })
}))
