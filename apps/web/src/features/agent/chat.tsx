import { Outlet } from '@tanstack/react-router'

import { ProfileDropdown, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { useElementHeight } from '@/hooks'

import { ChatConversation } from './components/chat-conversation'
import { ChatInputDock } from './components/chat-input-dock'
import { ChatRuns } from './components/chat-runs'
import { ChatRegistrations } from './components/registrations'
import { useAgentChatSession } from './hooks/use-agent-chat-session'

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
  const [inputDockRef, inputDockHeight] = useElementHeight<HTMLDivElement>()
  const session = useAgentChatSession()

  return (
    <div className="relative flex h-full flex-col">
      <span className="sr-only" aria-live="polite">
        Default Agent 状态：{session.runState}
      </span>

      <ChatConversation
        threadId={session.currentThreadId}
        threadLoading={session.threadLoading}
        inputDockHeight={inputDockHeight}
        persistedApproval={session.persistedApproval}
        onPendingApprovalChange={session.setAwaitingApproval}
        onPersistedDecision={session.resumePersistedApproval}
        onLiveInterrupt={session.clearPersistedApproval}
      />

      <ChatInputDock
        ref={inputDockRef}
        showEmptyGreeting={session.showEmptyGreeting}
        online={session.online}
        awaitingApproval={session.awaitingApproval}
        loading={session.threadLoading}
        threadId={session.currentThreadId}
        onEnsureThread={session.ensureThread}
        onRunStart={session.handleRunStart}
        onRunSettled={session.handleRunSettled}
        onStop={session.stopActiveRun}
      />

      <ChatRuns
        open={session.runsOpen}
        onOpenChange={(open) => session.setRunsOpen(open, open ? session.runsThreadId : undefined)}
        threadId={
          session.runsThreadId &&
          session.threads.some((thread) => thread.id === session.runsThreadId)
            ? session.runsThreadId
            : undefined
        }
        onResume={session.resumeRun}
        onCancel={session.cancelRun}
      />
    </div>
  )
}
