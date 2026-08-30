import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import {
  Badge,
  Button,
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  cn
} from '@zen/ui'
import { Activity, CheckCircle2, History, Plus, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { useElementHeight } from '@/hooks'

import { ChatGreeting } from './components/chat-greeting'
import { ChatHistory } from './components/chat-history'
import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'
import { ChatRegistrations } from './components/registrations'
import { ChatRuns } from './components/chat-runs'
import { useOnlineStatus } from './hooks/use-online-status'
import { restoreMessages } from './restore-messages'
import { defaultAgentRuntimeApi } from './runtime-api'
import { deriveChatRunState } from './run-state'

import type { AgentThreadSummary } from './runtime-api'

export function CopilotChat() {
  return (
    <>
      <AppHeader />

      <Main fixed fluid className="p-0">
        <ChatRegistrations />
        <Chat />
      </Main>
    </>
  )
}

function Chat() {
  const { agent } = useAgent()
  const { copilotkit } = useCopilotKit()
  const [inputDockRef, inputDockHeight] = useElementHeight<HTMLDivElement>()
  const online = useOnlineStatus()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [runsOpen, setRunsOpen] = useState(false)
  const [threads, setThreads] = useState<AgentThreadSummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [currentThreadId, setCurrentThreadId] = useState(agent.threadId)
  const [recovered, setRecovered] = useState(false)
  const wasRunningRef = useRef(agent.isRunning)
  const threadSelectionVersionRef = useRef(0)
  const activeRunIdRef = useRef<string>()
  const hasMessages = agent.messages.length > 0
  const runState = deriveChatRunState({ online, isRunning: agent.isRunning, recovered })

  const loadThreads = useCallback(async () => {
    setHistoryLoading(true)
    try {
      setThreads(await defaultAgentRuntimeApi.listThreads())
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void defaultAgentRuntimeApi
      .reconcile()
      .catch((error) => console.error('CopilotChat: runtime reconciliation failed', error))
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

  const stopActiveRun = useCallback(async () => {
    const trackedRunId = activeRunIdRef.current
    const runId =
      trackedRunId ??
      (await defaultAgentRuntimeApi.listRuns({ threadId: currentThreadId, limit: 10 })).find(
        (run) => ['pending', 'running', 'finishing'].includes(run.status)
      )?.id
    if (!runId) {
      stopLocalAgent()
      return
    }
    await defaultAgentRuntimeApi.cancelRun(runId)
    if (activeRunIdRef.current === runId) activeRunIdRef.current = undefined
    stopLocalAgent()
  }, [currentThreadId, stopLocalAgent])

  const createThread = async () => {
    threadSelectionVersionRef.current += 1
    if (agent.isRunning) await stopActiveRun()
    const threadId = crypto.randomUUID()
    agent.threadId = threadId
    agent.setMessages([])
    agent.setState({})
    setCurrentThreadId(threadId)
    setRecovered(false)
    setHistoryOpen(false)
  }

  const selectThread = async (threadId: string) => {
    const selectionVersion = threadSelectionVersionRef.current + 1
    threadSelectionVersionRef.current = selectionVersion
    if (agent.isRunning) await stopActiveRun()
    const thread = await defaultAgentRuntimeApi.getThread(threadId)
    if (selectionVersion !== threadSelectionVersionRef.current) return
    const latestRun = thread.runs[0]
    const replay = latestRun
      ? await defaultAgentRuntimeApi.listEvents(latestRun.id, 0)
      : { items: [], cursor: 0 }
    if (selectionVersion !== threadSelectionVersionRef.current) return
    const restored = restoreMessages(thread, replay.items)
    agent.threadId = threadId
    agent.setMessages(restored as typeof agent.messages)
    agent.setState((thread.checkpoints[0]?.state ?? {}) as typeof agent.state)
    setCurrentThreadId(threadId)
    setRecovered(restored.length > 0)
    localStorage.setItem(`default-agent:cursor:${latestRun?.id ?? threadId}`, String(replay.cursor))
    setHistoryOpen(false)
  }

  const archiveThread = async (threadId: string) => {
    await defaultAgentRuntimeApi.updateThread(threadId, { status: 'archived' })
    if (threadId === currentThreadId) await createThread()
    await loadThreads()
  }

  const deleteThread = async (threadId: string) => {
    await defaultAgentRuntimeApi.deleteThread(threadId)
    if (threadId === currentThreadId) await createThread()
    await loadThreads()
  }

  const resumeRun = async (runId: string) => {
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
    const resumedRunId = crypto.randomUUID()
    activeRunIdRef.current = resumedRunId
    try {
      await copilotkit.runAgent({ agent, runId: resumedRunId })
    } finally {
      if (activeRunIdRef.current === resumedRunId) activeRunIdRef.current = undefined
    }
  }

  const cancelRun = async (runId: string) => {
    await defaultAgentRuntimeApi.cancelRun(runId)
    if (activeRunIdRef.current === runId) {
      activeRunIdRef.current = undefined
      stopLocalAgent()
    }
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            title="对话历史"
            onClick={() => setHistoryOpen(true)}
          >
            <History data-icon="inline-start" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="新对话" onClick={() => void createThread()}>
            <Plus data-icon="inline-start" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="运行记录" onClick={() => setRunsOpen(true)}>
            <Activity data-icon="inline-start" />
          </Button>
          <span className="truncate text-sm text-muted-foreground">
            {threads.find((thread) => thread.id === currentThreadId)?.title || '新对话'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!online && (
            <Badge variant="destructive">
              <WifiOff data-icon="inline-start" />
              已离线
            </Badge>
          )}
          {online && recovered && !agent.isRunning && (
            <Badge variant="outline">
              <CheckCircle2 data-icon="inline-start" />
              已恢复
            </Badge>
          )}
          {agent.isRunning && <Badge variant="secondary">正在运行</Badge>}
          <span className="sr-only" aria-live="polite">Default Agent 状态：{runState}</span>
        </div>
      </div>
      <Conversation>
        <ConversationContent>
          <div
            className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl"
            style={{ paddingBottom: inputDockHeight }}
          >
            <ChatMessages key={currentThreadId} threadId={currentThreadId} />
          </div>
        </ConversationContent>
        <ConversationScrollButton style={{ bottom: inputDockHeight + 10 }} />
      </Conversation>

      <div
        ref={inputDockRef}
        className={cn(
          'absolute bottom-0 z-10 inset-x-0 w-full px-6',
          !hasMessages && 'bottom-1/2 translate-y-1/2'
        )}
      >
        <div className="@5xl/content:mx-auto @5xl/content:w-full @5xl/content:max-w-5xl relative pb-4">
          {!hasMessages && <ChatGreeting className="relative z-10" />}
          <ChatInput
            className="relative z-10"
            online={online}
            threadId={currentThreadId}
            onRunStart={(runId) => {
              activeRunIdRef.current = runId
            }}
            onRunSettled={(runId) => {
              if (activeRunIdRef.current === runId) activeRunIdRef.current = undefined
            }}
            onStop={stopActiveRun}
          />
          <div className="pointer-events-none absolute inset-0 z-0  w-full ">
            <div className="bg-background h-full w-full backdrop-blur-xl mask-[linear-gradient(to_top,black_50%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_top,black_50%,transparent_85%)] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"></div>
          </div>
        </div>
      </div>
      <ChatHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        threads={threads.filter((thread) => thread.status !== 'archived')}
        currentThreadId={currentThreadId}
        loading={historyLoading}
        onCreate={() => void createThread()}
        onSelect={(threadId) => void selectThread(threadId)}
        onArchive={(threadId) => void archiveThread(threadId)}
        onDelete={(threadId) => void deleteThread(threadId)}
      />
      <ChatRuns
        open={runsOpen}
        onOpenChange={setRunsOpen}
        threadId={threads.some((thread) => thread.id === currentThreadId) ? currentThreadId : undefined}
        onResume={resumeRun}
        onCancel={cancelRun}
      />
    </div>
  )
}
