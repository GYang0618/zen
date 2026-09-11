import { CopilotChatConfigurationProvider, UseAgentUpdate } from '@copilotkit/react-core/v2'
import { Outlet, useParams } from '@tanstack/react-router'
import { Button, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@zen/ui'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

import { ProfileDropdown, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { useElementHeight } from '@/hooks'

import { AgentBackgroundRunner } from './components/agent-background-runner'
import { ChatConversation } from './components/chat-conversation'
import { ChatGenerativePanel } from './components/chat-generative-panel'
import { ChatInputDock } from './components/chat-input-dock'
import { ChatRegistrations } from './components/registrations'
import { ChatAgentProvider, useChatAgent } from './context/chat-agent-context'
import { useAgentThreadSync } from './hooks/use-agent-thread-sync'
import { useAgentGenerativePanelStore } from './stores/agent-generative-panel'

export function AgentChat() {
  const { isOpen, setOpen } = useAgentGenerativePanelStore()
  const params = useParams({ strict: false }) as { threadId?: string }
  const { activeThreadId, hasExplicitThreadId, isConnecting, agent, isReady } = useAgentThreadSync({
    agentId: 'default',
    threadId: params.threadId
  })

  return (
    <CopilotChatConfigurationProvider
      agentId="default"
      threadId={activeThreadId}
      hasExplicitThreadId={hasExplicitThreadId}
    >
      <ChatAgentProvider agent={agent} isReady={isReady} activeThreadId={activeThreadId}>
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
          <AgentBackgroundRunner activeThreadId={activeThreadId} />
          <Chat key={activeThreadId} isConnecting={isConnecting} activeThreadId={activeThreadId} />
        </Main>
        <Outlet />
      </ChatAgentProvider>
    </CopilotChatConfigurationProvider>
  )
}

function Chat({ isConnecting, activeThreadId }: { isConnecting: boolean; activeThreadId: string }) {
  const [inputDockRef, inputDockHeight] = useElementHeight<HTMLDivElement>()
  const { agent } = useChatAgent({
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 0
  })
  const isGenerativeOpen = useAgentGenerativePanelStore((state) => state.isOpen)
  const [awaitingApproval, setAwaitingApproval] = useState(false)

  const showEmptyGreeting = !isConnecting && agent.messages.length === 0

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        <ResizablePanel
          id="chat-conversation-panel"
          defaultSize={isGenerativeOpen ? 40 : 100}
          minSize="25%"
          className="relative flex h-full flex-col min-w-0"
        >
          <ChatConversation
            threadLoading={isConnecting}
            inputDockHeight={inputDockHeight}
            onPendingApprovalChange={setAwaitingApproval}
          />
          <ChatInputDock
            ref={inputDockRef}
            showEmptyGreeting={showEmptyGreeting}
            awaitingApproval={awaitingApproval}
            threadId={activeThreadId}
            loading={isConnecting}
          />
        </ResizablePanel>

        {isGenerativeOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="chat-generative-panel"
              defaultSize={60}
              minSize="25%"
              className="relative flex h-full flex-col min-w-0"
            >
              <ChatGenerativePanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
