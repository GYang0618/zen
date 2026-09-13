// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate
}))

vi.mock('@zen/ui', () => ({
  Button: ({ children, onClick, ...props }: React.ComponentProps<'button'>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({
    render,
    children
  }: {
    render?: React.ReactNode
    children?: React.ReactNode
  }) => (render ? <div>{render}</div> : <div>{children}</div>),
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSidebar: () => ({ state: 'expanded', isMobile: false }),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' ')
}))

vi.mock('./chat-history', () => ({
  ChatHistory: () => <div data-testid="chat-history">历史列表</div>
}))

import { useShellModeStore } from '@/stores'

import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { AgentSidebar } from './agent-sidebar'

describe('AgentSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useShellModeStore.setState({
      mode: 'agent',
      lastAdminPath: '/',
      lastAgentPath: '/chat/thread-prev'
    })
  })

  it('点击「发起新对话」时递增 newThreadNonce，重置 lastAgentPath 为 /chat 并导航', () => {
    const prevNonce = useAgentChatInputStore.getState().newThreadNonce

    render(<AgentSidebar />)

    const newChatButton = screen.getByRole('button', { name: '发起新对话' })
    fireEvent.click(newChatButton)

    expect(useAgentChatInputStore.getState().newThreadNonce).toBe(prevNonce + 1)
    expect(useShellModeStore.getState().lastAgentPath).toBe('/chat')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/chat' })
  })
})
