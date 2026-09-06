import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { Outlet, useMatch, useNavigate } from '@tanstack/react-router'
import { Conversation, ConversationContent, ConversationScrollButton, cn } from '@zen/ui'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ProfileDropdown, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { useElementHeight } from '@/hooks'
import { isApiClientError } from '@/lib/request/utils'

import { buildApprovalDecisions, toHitlResume } from './approval-decision'
import { ChatApprovalRegistration } from './components/chat-approval'
import { ChatGreeting } from './components/chat-greeting'
import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'
import { ChatRuns } from './components/chat-runs'
import { ChatThreadSkeleton } from './components/chat-thread-skeleton'
import { ChatRegistrations } from './components/registrations'
import { useOnlineStatus } from './hooks/use-online-status'
import { promoteThread } from './lib/thread-list'
import { restoreMessages } from './restore-messages'
import { deriveChatRunState } from './run-state'
import { defaultAgentRuntimeApi, THREAD_HISTORY_PAGE_SIZE } from './runtime-api'
import { useAgentChatShellStore } from './stores/agent-chat-shell'

import type { AgentApproval, AgentThreadSummary } from './runtime-api'

const THREAD_TITLE_MAX_LENGTH = 80
const DRAFT_ROUTE_THREAD_ID = 'draft'

function buildOptimisticThread(id: string, firstMessage: string): AgentThreadSummary {
  const now = new Date().toISOString()
  const title =
    firstMessage.trim().replace(/\s+/g, ' ').slice(0, THREAD_TITLE_MAX_LENGTH) || '新对话'
  return {
    id,
    title,
    status: 'active',
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    _count: { messages: 1, runs: 1 }
  }
}

async function loadPendingApproval(run: { id: string }): Promise<AgentApproval | null> {
  const detail = await defaultAgentRuntimeApi.getRun(run.id)
  return detail.approvals.find((approval) => approval.status === 'pending') ?? null
}

async function restorePendingApproval(threadId: string): Promise<AgentApproval | null> {
  const thread = await defaultAgentRuntimeApi.getThread(threadId)
  const latestRun = thread.runs[0]
  if (!latestRun) return null
  return loadPendingApproval(latestRun)
}

export function AgentChat() {
  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed fluid className="p-0">
        <ChatRegistrations />
        <Chat />
      </Main>
      <Outlet />
    </>
  )
}

function Chat() {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()
  const navigate = useNavigate()
  const threadMatch = useMatch({
    from: '/_authenticated/_workbench/chat/$threadId',
    shouldThrow: false
  })
  const routeThreadId = threadMatch?.params.threadId
  const [inputDockRef, inputDockHeight] = useElementHeight<HTMLDivElement>()
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
  const [awaitingApproval, setAwaitingApproval] = useState(false)
  const [persistedApproval, setPersistedApproval] = useState<AgentApproval | null>(null)
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
    setAwaitingApproval(false)
    setPersistedApproval(null)
    await navigate({ to: '/chat' })
  }, [agent, navigate, setCurrentThreadId, setThreadLoading, stopActiveRun])

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
      setAwaitingApproval(false)
      setPersistedApproval(null)

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
    [agent, navigate, setCurrentThreadId, setThreadLoading, stopActiveRun, stopLocalAgent]
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
    setAwaitingApproval(false)
    setPersistedApproval(null)
  }, [agent, routeThreadId, selectThread, setCurrentThreadId, setThreadLoading])

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

  const clearPersistedApproval = useCallback(() => setPersistedApproval(null), [])

  const resumePersistedApproval = useCallback(
    async (decision: 'approve' | 'reject') => {
      const decisions = buildApprovalDecisions(1, decision)
      await copilotkit.runAgent({
        agent,
        forwardedProps: { command: { resume: toHitlResume(decisions) } }
      })
      setPersistedApproval(null)
    },
    [agent, copilotkit]
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

  return (
    <div className="relative flex h-full flex-col">
      <span className="sr-only" aria-live="polite">
        Default Agent 状态：{runState}
      </span>
      <Conversation>
        <ConversationContent>
          <div
            className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl flex flex-col gap-4"
            style={{ paddingBottom: inputDockHeight }}
          >
            {threadLoading ? (
              <ChatThreadSkeleton />
            ) : (
              <>
                <ChatMessages
                  key={currentThreadId ?? DRAFT_ROUTE_THREAD_ID}
                  threadId={currentThreadId ?? DRAFT_ROUTE_THREAD_ID}
                />
                <ChatApprovalRegistration
                  persistedApproval={persistedApproval}
                  onPendingChange={setAwaitingApproval}
                  onPersistedDecision={resumePersistedApproval}
                  onLiveInterrupt={clearPersistedApproval}
                />
              </>
            )}
          </div>
        </ConversationContent>
        <ConversationScrollButton style={{ bottom: inputDockHeight + 10 }} />
      </Conversation>

      <div
        ref={inputDockRef}
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 w-full px-6',
          showEmptyGreeting && 'bottom-1/2 translate-y-1/2'
        )}
      >
        <div className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl relative pb-4">
          {showEmptyGreeting && <ChatGreeting className="relative z-10" />}
          <ChatInput
            className="relative z-10"
            online={online}
            awaitingApproval={awaitingApproval}
            loading={threadLoading}
            threadId={currentThreadId}
            onEnsureThread={ensureThread}
            onRunStart={(runId) => {
              activeRunIdRef.current = runId
            }}
            onRunSettled={(runId) => {
              if (activeRunIdRef.current === runId) activeRunIdRef.current = undefined
            }}
            onStop={stopActiveRun}
          />
          <div className="pointer-events-none absolute inset-0 z-0 w-full">
            <div className="h-full w-full bg-background backdrop-blur-xl mask-[linear-gradient(to_top,black_50%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_top,black_50%,transparent_85%)] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none" />
          </div>
        </div>
      </div>

      <ChatRuns
        open={runsOpen}
        onOpenChange={(open) => setRunsOpen(open, open ? runsThreadId : undefined)}
        threadId={
          runsThreadId && threads.some((thread) => thread.id === runsThreadId)
            ? runsThreadId
            : undefined
        }
        onResume={resumeRun}
        onCancel={cancelRun}
      />
    </div>
  )
}
