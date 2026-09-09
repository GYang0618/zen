import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { useMatch, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { isApiClientError } from '@/lib/request/utils'

import { buildOptimisticThread, promoteThread } from '../lib/thread-list'
import { restoreMessages } from '../restore-messages'
import { deriveChatRunState } from '../run-state'
import { defaultAgentRuntimeApi, THREAD_HISTORY_PAGE_SIZE } from '../runtime-api'
import { useAgentChatShellStore } from '../stores/agent-chat-shell'
import {
  loadPendingApproval,
  restorePendingApproval,
  useAgentChatApprovals
} from './use-agent-chat-approvals'
import { useOnlineStatus } from './use-online-status'

import type { AgentApproval, AgentThreadSummary } from '../runtime-api'

export interface UseAgentChatSessionReturn {
  online: boolean
  currentThreadId: string | undefined
  threadLoading: boolean
  runState: string
  showEmptyGreeting: boolean
  awaitingApproval: boolean
  persistedApproval: AgentApproval | null
  threads: AgentThreadSummary[]
  runsOpen: boolean
  runsThreadId: string | undefined
  setRunsOpen: (open: boolean, threadId?: string) => void
  setAwaitingApproval: (pending: boolean) => void
  clearPersistedApproval: () => void
  resumePersistedApproval: (decision: 'approve' | 'reject') => Promise<void>
  ensureThread: (firstMessage: string) => Promise<string>
  stopActiveRun: (threadId?: string) => Promise<void>
  handleRunStart: (runId: string) => void
  handleRunSettled: (runId: string) => void
  resumeRun: (runId: string) => Promise<void>
  cancelRun: (runId: string) => Promise<void>
}

export function useAgentChatSession(): UseAgentChatSessionReturn {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()
  const navigate = useNavigate()
  const threadMatch = useMatch({
    from: '/_authenticated/_workbench/chat/$threadId',
    shouldThrow: false
  })
  const routeThreadId = threadMatch?.params.threadId
  const online = useOnlineStatus()

  const threads = useAgentChatShellStore((state) => state.threads)
  const currentThreadId = useAgentChatShellStore((state) => state.currentThreadId)
  const upsertThread = useAgentChatShellStore((state) => state.upsertThread)
  const removeThread = useAgentChatShellStore((state) => state.removeThread)
  const applyThreadPage = useAgentChatShellStore((state) => state.applyThreadPage)
  const setCurrentThreadId = useAgentChatShellStore((state) => state.setCurrentThreadId)
  const setHistoryLoading = useAgentChatShellStore((state) => state.setHistoryLoading)
  const setHistoryLoadingMore = useAgentChatShellStore((state) => state.setHistoryLoadingMore)
  const setHistoryLoadMoreError = useAgentChatShellStore((state) => state.setHistoryLoadMoreError)
  const bindHandlers = useAgentChatShellStore((state) => state.bindHandlers)
  const unbindHandlers = useAgentChatShellStore((state) => state.unbindHandlers)
  const runsOpen = useAgentChatShellStore((state) => state.runsOpen)
  const runsThreadId = useAgentChatShellStore((state) => state.runsThreadId)
  const setRunsOpen = useAgentChatShellStore((state) => state.setRunsOpen)
  const setRunningThreadId = useAgentChatShellStore((state) => state.setRunningThreadId)
  const threadLoading = useAgentChatShellStore((state) => state.threadLoading)
  const setThreadLoading = useAgentChatShellStore((state) => state.setThreadLoading)

  const [recovered, setRecovered] = useState(false)
  const {
    awaitingApproval,
    persistedApproval,
    setAwaitingApproval,
    setPersistedApproval,
    clearPersistedApproval,
    resumePersistedApproval,
    resetApprovals
  } = useAgentChatApprovals(agent)

  const wasRunningRef = useRef(agent.isRunning)
  const threadSelectionVersionRef = useRef(0)
  const activeRunIdRef = useRef<string | undefined>(undefined)
  const runningAnchorRef = useRef<string | undefined>(undefined)
  const draftBootedRef = useRef(false)

  const hasMessages = agent.messages.length > 0
  const showEmptyGreeting = !hasMessages && !threadLoading
  const runState = deriveChatRunState({
    online,
    isRunning: agent.isRunning,
    recovered,
    persistedStatus: awaitingApproval ? 'interrupted' : undefined
  })

  useEffect(() => {
    const busy = agent.isRunning || awaitingApproval
    if (!busy) {
      runningAnchorRef.current = undefined
      setRunningThreadId(undefined)
      return
    }
    if (!runningAnchorRef.current) runningAnchorRef.current = currentThreadId
    setRunningThreadId(runningAnchorRef.current)
  }, [agent.isRunning, awaitingApproval, currentThreadId, setRunningThreadId])

  useEffect(() => {
    return () => setRunningThreadId(undefined)
  }, [setRunningThreadId])

  const loadThreads = useCallback(async () => {
    const isInitial = useAgentChatShellStore.getState().threads.length === 0
    if (isInitial) setHistoryLoading(true)
    try {
      applyThreadPage(
        await defaultAgentRuntimeApi.listThreads({ limit: THREAD_HISTORY_PAGE_SIZE }),
        'refresh'
      )
    } finally {
      setHistoryLoading(false)
    }
  }, [applyThreadPage, setHistoryLoading])

  const loadMoreThreads = useCallback(async () => {
    const { historyHasMore, historyCursor, historyLoading, historyLoadingMore } =
      useAgentChatShellStore.getState()
    if (!historyHasMore || !historyCursor || historyLoading || historyLoadingMore) return

    setHistoryLoadingMore(true)
    setHistoryLoadMoreError(false)
    try {
      applyThreadPage(
        await defaultAgentRuntimeApi.listThreads({
          limit: THREAD_HISTORY_PAGE_SIZE,
          cursor: historyCursor
        }),
        'append'
      )
    } catch (error) {
      setHistoryLoadMoreError(true)
      console.error('AgentChat: failed to load more threads', error)
    } finally {
      setHistoryLoadingMore(false)
    }
  }, [applyThreadPage, setHistoryLoadMoreError, setHistoryLoadingMore])

  useEffect(() => {
    void defaultAgentRuntimeApi
      .reconcile()
      .catch((error) => console.error('AgentChat: runtime reconciliation failed', error))
      .finally(() => void loadThreads())
  }, [loadThreads])

  useEffect(() => {
    if (wasRunningRef.current && !agent.isRunning) void loadThreads()
    wasRunningRef.current = agent.isRunning
  }, [agent.isRunning, loadThreads])

  const stopLocalAgent = useCallback(() => {
    try {
      copilotkit.stopAgent({ agent })
    } catch {
      agent.abortRun()
    }
  }, [agent, copilotkit])

  const stopActiveRun = useCallback(
    async (threadId = currentThreadId) => {
      const trackedRunId = activeRunIdRef.current
      const runId =
        trackedRunId ??
        (await defaultAgentRuntimeApi.listRuns({ threadId, limit: 10 })).find((run) =>
          ['pending', 'running', 'finishing'].includes(run.status)
        )?.id
      if (!runId) {
        stopLocalAgent()
        return
      }
      await defaultAgentRuntimeApi.cancelRun(runId)
      if (activeRunIdRef.current === runId) activeRunIdRef.current = undefined
      stopLocalAgent()
    },
    [currentThreadId, stopLocalAgent]
  )

  const createThread = useCallback(async () => {
    threadSelectionVersionRef.current += 1
    if (agent.isRunning) await stopActiveRun()
    agent.setMessages([])
    agent.setState({})
    setCurrentThreadId(undefined)
    setThreadLoading(false)
    setRecovered(false)
    resetApprovals()
    await navigate({ to: '/chat' })
  }, [agent, navigate, resetApprovals, setCurrentThreadId, setThreadLoading, stopActiveRun])

  const ensureThread = useCallback(
    async (firstMessage: string) => {
      const existing = useAgentChatShellStore.getState().currentThreadId
      if (existing) {
        agent.threadId = existing
        return existing
      }

      const threadId = crypto.randomUUID()
      threadSelectionVersionRef.current += 1
      agent.threadId = threadId
      setCurrentThreadId(threadId)
      setThreadLoading(false)
      upsertThread(buildOptimisticThread(threadId, firstMessage))
      await navigate({ to: '/chat/$threadId', params: { threadId }, replace: true })
      return threadId
    },
    [agent, navigate, setCurrentThreadId, setThreadLoading, upsertThread]
  )

  const selectThread = useCallback(
    async (threadId: string) => {
      const { currentThreadId: selectedId, threadLoading: loading } =
        useAgentChatShellStore.getState()
      if (threadId === selectedId && !loading) {
        const selectionVersion = threadSelectionVersionRef.current
        try {
          const pending = await restorePendingApproval(threadId)
          if (selectionVersion !== threadSelectionVersionRef.current) return
          if (useAgentChatShellStore.getState().currentThreadId !== threadId) return
          setPersistedApproval(pending)
          setAwaitingApproval(Boolean(pending))
        } catch (error) {
          console.error('AgentChat: failed to restore pending approval', error)
        }
        return
      }

      const previousThreadId = selectedId
      const previousAgentThreadId = agent.threadId
      const selectionVersion = threadSelectionVersionRef.current + 1
      threadSelectionVersionRef.current = selectionVersion
      setCurrentThreadId(threadId)
      setThreadLoading(true)
      resetApprovals()

      if (agent.isRunning) {
        stopLocalAgent()
        void stopActiveRun(previousAgentThreadId)
      }

      try {
        const thread = await defaultAgentRuntimeApi.getThread(threadId)
        if (selectionVersion !== threadSelectionVersionRef.current) return

        const applySnapshot = (events: Parameters<typeof restoreMessages>[1]) => {
          const restored = restoreMessages(thread, events)
          agent.threadId = threadId
          agent.setMessages(restored as typeof agent.messages)
          agent.setState((thread.checkpoints[0]?.state ?? {}) as typeof agent.state)
          setRecovered(restored.length > 0)
        }

        applySnapshot([])
        setThreadLoading(false)

        const latestRun = thread.runs[0]
        if (!latestRun) return

        try {
          const replay = await defaultAgentRuntimeApi.listEvents(latestRun.id, 0)
          if (selectionVersion !== threadSelectionVersionRef.current) return
          applySnapshot(replay.items)
          localStorage.setItem(`default-agent:cursor:${latestRun.id}`, String(replay.cursor))
        } catch (error) {
          console.error('AgentChat: failed to replay thread events', error)
        }

        try {
          const pending = await loadPendingApproval(latestRun)
          if (selectionVersion !== threadSelectionVersionRef.current) return
          setPersistedApproval(pending)
          setAwaitingApproval(Boolean(pending))
        } catch (error) {
          console.error('AgentChat: failed to restore pending approval', error)
        }
      } catch (error) {
        if (selectionVersion !== threadSelectionVersionRef.current) return
        if (isApiClientError(error) && error.code === 404) {
          if (agent.isRunning || agent.messages.length > 0) {
            setThreadLoading(false)
            return
          }
          agent.threadId = threadId
          agent.setMessages([])
          agent.setState({})
          setRecovered(false)
          setThreadLoading(false)
          return
        }
        console.error('AgentChat: failed to load thread', error)
        setCurrentThreadId(previousThreadId)
        setThreadLoading(false)
        if (previousThreadId) {
          void navigate({
            to: '/chat/$threadId',
            params: { threadId: previousThreadId },
            replace: true
          })
        } else {
          void navigate({ to: '/chat', replace: true })
        }
      }
    },
    [
      agent,
      navigate,
      resetApprovals,
      setCurrentThreadId,
      setPersistedApproval,
      setAwaitingApproval,
      setThreadLoading,
      stopActiveRun,
      stopLocalAgent
    ]
  )

  useEffect(() => {
    if (routeThreadId) {
      draftBootedRef.current = false
      void selectThread(routeThreadId)
      return
    }

    if (draftBootedRef.current) return
    draftBootedRef.current = true
    threadSelectionVersionRef.current += 1
    agent.setMessages([])
    agent.setState({})
    setCurrentThreadId(undefined)
    setThreadLoading(false)
    setRecovered(false)
    resetApprovals()
  }, [agent, resetApprovals, routeThreadId, selectThread, setCurrentThreadId, setThreadLoading])

  const renameThread = useCallback(async (threadId: string, title: string) => {
    const { threads, patchThread, setThreads } = useAgentChatShellStore.getState()
    const previous = threads.find((item) => item.id === threadId)
    if (!previous) {
      await defaultAgentRuntimeApi.updateThread(threadId, { title })
      return
    }

    const snapshot = threads
    setThreads(promoteThread(threads, threadId, { title, updatedAt: new Date().toISOString() }))
    try {
      const updated = await defaultAgentRuntimeApi.updateThread(threadId, { title })
      patchThread(threadId, { title: updated.title ?? title, updatedAt: updated.updatedAt })
    } catch (error) {
      setThreads(snapshot)
      throw error
    }
  }, [])

  const deleteThread = useCallback(
    async (threadId: string) => {
      await defaultAgentRuntimeApi.deleteThread(threadId)
      removeThread(threadId)
      if (threadId === currentThreadId) await createThread()
    },
    [createThread, currentThreadId, removeThread]
  )

  const resumeRun = useCallback(
    async (runId: string) => {
      const prepared = await defaultAgentRuntimeApi.prepareRunResume(runId)
      const [thread, replay] = await Promise.all([
        defaultAgentRuntimeApi.getThread(prepared.threadId),
        defaultAgentRuntimeApi.listEvents(runId, 0)
      ])
      const restored = restoreMessages(thread, replay.items)
      agent.threadId = prepared.threadId
      agent.setMessages(restored as typeof agent.messages)
      agent.setState((prepared.checkpoint?.state ?? {}) as typeof agent.state)
      setCurrentThreadId(prepared.threadId)
      setRecovered(restored.length > 0)
      if (prepared.threadId !== routeThreadId) {
        await navigate({
          to: '/chat/$threadId',
          params: { threadId: prepared.threadId },
          replace: true
        })
      }
      activeRunIdRef.current = runId
      try {
        await copilotkit.runAgent({ agent, runId })
      } finally {
        if (activeRunIdRef.current === runId) activeRunIdRef.current = undefined
      }
    },
    [agent, copilotkit, navigate, routeThreadId, setCurrentThreadId]
  )

  const cancelRun = useCallback(
    async (runId: string) => {
      await defaultAgentRuntimeApi.cancelRun(runId)
      if (activeRunIdRef.current === runId) {
        activeRunIdRef.current = undefined
        stopLocalAgent()
      }
    },
    [stopLocalAgent]
  )

  const handleRunStart = useCallback((runId: string) => {
    activeRunIdRef.current = runId
  }, [])

  const handleRunSettled = useCallback((runId: string) => {
    if (activeRunIdRef.current === runId) {
      activeRunIdRef.current = undefined
    }
  }, [])

  useEffect(() => {
    bindHandlers({
      createThread,
      selectThread,
      renameThread,
      deleteThread,
      loadMoreThreads,
      resumeRun,
      cancelRun
    })
    return () => unbindHandlers()
  }, [
    bindHandlers,
    cancelRun,
    createThread,
    deleteThread,
    loadMoreThreads,
    renameThread,
    resumeRun,
    selectThread,
    unbindHandlers
  ])

  return {
    online,
    currentThreadId,
    threadLoading,
    runState,
    showEmptyGreeting,
    awaitingApproval,
    persistedApproval,
    threads,
    runsOpen,
    runsThreadId,
    setRunsOpen,
    setAwaitingApproval,
    clearPersistedApproval,
    resumePersistedApproval,
    ensureThread,
    stopActiveRun,
    handleRunStart,
    handleRunSettled,
    resumeRun,
    cancelRun
  }
}
