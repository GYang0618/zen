import { Outlet } from '@tanstack/react-router'
import { Button, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@zen/ui'
import { Sparkles } from 'lucide-react'

import { ProfileDropdown, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { useElementHeight } from '@/hooks'

import { ChatConversation } from './components/chat-conversation'
import { ChatGenerativePanel } from './components/chat-generative-panel'
import { ChatInputDock } from './components/chat-input-dock'
import { ChatRuns } from './components/chat-runs'
import { ChatRegistrations } from './components/registrations'
import { useAgentChatSession } from './hooks/use-agent-chat-session'
import { useAgentGenerativePanelStore } from './stores/agent-generative-panel'

export function AgentChat() {
  const { isOpen, setOpen } = useAgentGenerativePanelStore()

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setOpen(!isOpen)}
            title={isOpen ? '收起生成式工作区' : '展开生成式工作区'}
          >
            <Sparkles className="size-3.5 text-primary" />
            <span className="hidden sm:inline">生成式工作区</span>
          </Button>
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
  const isGenerativeOpen = useAgentGenerativePanelStore((state) => state.isOpen)
  const runsThreadId =
    session.runsThreadId && session.threads.some((t) => t.id === session.runsThreadId)
      ? session.runsThreadId
      : undefined

  return (
    <div className="relative h-full w-full overflow-hidden">
      <span className="sr-only" aria-live="polite">
        Default Agent 状态：{session.runState}
      </span>

      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        <ResizablePanel
          id="chat-conversation-panel"
          defaultSize={isGenerativeOpen ? 50 : 100}
          minSize="25%"
          className="relative flex h-full flex-col min-w-0"
        >
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
        </ResizablePanel>

        {isGenerativeOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="chat-generative-panel"
              defaultSize={50}
              minSize="25%"
              className="relative flex h-full flex-col min-w-0"
            >
              <ChatGenerativePanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <ChatRuns
        open={session.runsOpen}
        onOpenChange={(open) => session.setRunsOpen(open, open ? session.runsThreadId : undefined)}
        threadId={runsThreadId}
        onResume={session.resumeRun}
        onCancel={session.cancelRun}
      />
    </div>
  )
}
