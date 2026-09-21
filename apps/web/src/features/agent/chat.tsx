import { CopilotChatConfigurationProvider, UseAgentUpdate } from '@copilotkit/react-core/v2'
import { Outlet, useLocation } from '@tanstack/react-router'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@zen/ui'
import { useState } from 'react'

import { ProfileDropdown, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { useElementHeight } from '@/hooks'
import { isAgentChatPath, parseThreadIdFromPath, useShellModeStore } from '@/stores'

import { AgentBackgroundRunner } from './components/agent-background-runner'
import { ChatConversation } from './components/chat-conversation'
import { ChatCanvas } from './components/chat-canvas'
import { ChatInputDock } from './components/chat-input-dock'
import { ChatRegistrations } from './components/registrations'
import { ChatAgentProvider, useChatAgent } from './context/chat-agent-context'
import { useAgentThreadSync } from './hooks/use-agent-thread-sync'
import { useAgentCanvasStore } from './stores/agent-canvas'

export function AgentChat({
  threadId: propThreadId,
  /** 是否处于可见的智能体模式；隐藏时需关闭 fixed，避免污染 SidebarInset 的 :has([data-layout=fixed]) */
  active = true
}: {
  threadId?: string
  active?: boolean
} = {}) {
  const { pathname } = useLocation()
  const lastAgentPath = useShellModeStore((state) => state.lastAgentPath)

  // 处于智能体路由时从当前路径解析 threadId，切到管理后台时锁定 lastAgentPath 中的 threadId
  const isAgentRoute = isAgentChatPath(pathname)
  const currentPathThreadId = parseThreadIdFromPath(pathname)
  const lastPathThreadId = parseThreadIdFromPath(lastAgentPath)
  const effectiveThreadId = propThreadId ?? (isAgentRoute ? currentPathThreadId : lastPathThreadId)

  const { activeThreadId, hasExplicitThreadId, isConnecting, agent, isReady } = useAgentThreadSync({
    agentId: 'default',
    threadId: effectiveThreadId
  })

  return (
    <CopilotChatConfigurationProvider
      agentId={agent.agentId}
      threadId={activeThreadId}
      hasExplicitThreadId={hasExplicitThreadId}
    >
      <ChatAgentProvider agent={agent} isReady={isReady} activeThreadId={activeThreadId}>
        <Header>
          <div className="ms-auto flex items-center gap-2 sm:gap-4">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main fixed={active} fluid className="p-0">
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
  const isCanvasOpen = useAgentCanvasStore((state) => state.isOpen)
  const [awaitingApproval, setAwaitingApproval] = useState(false)

  const showEmptyGreeting = !isConnecting && agent.messages.length === 0

  return (
    <div className="relative h-full w-full overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        <ResizablePanel
          id="chat-conversation-panel"
          defaultSize={isCanvasOpen ? 40 : 100}
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

        {isCanvasOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="chat-canvas"
              defaultSize={60}
              minSize="25%"
              className="relative flex h-full flex-col min-w-0"
            >
              <ChatCanvas />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
