// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseInterrupt = vi.fn()
let mockIsReady = true

vi.mock('@copilotkit/react-core/v2', () => ({
  useInterrupt: (args: unknown) => mockUseInterrupt(args)
}))

vi.mock('../context/chat-agent-context', () => ({
  useChatAgent: () => ({
    agent: {
      agentId: 'chat-active'
    },
    isReady: mockIsReady
  })
}))

import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { ChatApprovalRegistration, parseInterruptValue } from './chat-approval'

import type { UseInterruptConfig } from '@copilotkit/react-core/v2'

describe('parseInterruptValue', () => {
  it('正确解析包含 actionRequests 的 JSON 字符串', () => {
    const raw = JSON.stringify({
      actionRequests: [
        {
          name: 'delete_users',
          args: { ids: ['user-1', 'user-2'] },
          description: '高风险操作'
        }
      ],
      reviewConfigs: [{ actionName: 'delete_users' }]
    })

    const parsed = parseInterruptValue(raw)
    expect(parsed.actionRequests).toHaveLength(1)
    expect(parsed.actionRequests[0]).toEqual({
      name: 'delete_users',
      args: { ids: ['user-1', 'user-2'] },
      description: '高风险操作'
    })
  })

  it('正确解析原生对象结构', () => {
    const raw = {
      actionRequests: [
        {
          name: 'reset_user_password',
          args: { id: 'user-1' }
        }
      ]
    }

    const parsed = parseInterruptValue(raw)
    expect(parsed.actionRequests).toHaveLength(1)
    expect(parsed.actionRequests[0].name).toBe('reset_user_password')
  })

  it('容错处理无效 JSON 字符串', () => {
    const raw = 'Invalid JSON String'
    const parsed = parseInterruptValue(raw)
    expect(parsed.actionRequests).toEqual([])
    expect(parsed.message).toBe('Invalid JSON String')
  })

  it('容错处理空值或非对象', () => {
    expect(parseInterruptValue(null).actionRequests).toEqual([])
    expect(parseInterruptValue(undefined).actionRequests).toEqual([])
    expect(parseInterruptValue(123).actionRequests).toEqual([])
  })
})

describe('ChatApprovalRegistration', () => {
  const mockResolve = vi.fn()
  const mockOnPendingChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsReady = true
    useAgentChatInputStore.getState().clearPendingApprovalTools()
  })

  afterEach(() => {
    cleanup()
    useAgentChatInputStore.getState().clearPendingApprovalTools()
  })

  it('当 agent 尚未准备就绪 (isReady=false) 时不挂载 useInterrupt 且返回 null', () => {
    mockIsReady = false
    const { container } = render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)
    expect(container.firstChild).toBeNull()
    expect(mockUseInterrupt).not.toHaveBeenCalled()
  })

  it('无中断事件时返回 null 并通知 pending 为 false', () => {
    mockUseInterrupt.mockReturnValue(null)

    const { container } = render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)
    expect(container.firstChild).toBeNull()
    expect(mockOnPendingChange).toHaveBeenCalledWith(false)
  })

  it('有中断事件时正确渲染工具标题并向 store 同步待审批工具', () => {
    mockUseInterrupt.mockImplementation((config: UseInterruptConfig) => {
      return config.render?.({
        event: {
          name: 'on_interrupt',
          value: JSON.stringify({
            actionRequests: [
              {
                name: 'delete_users',
                args: { ids: ['user-123'] }
              }
            ]
          })
        },
        interrupt: null,
        resolve: mockResolve,
        cancel: vi.fn()
      } as never)
    })

    render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)

    expect(screen.getByText('确定要执行「删除用户」操作吗？')).toBeDefined()
    expect(mockOnPendingChange).toHaveBeenCalledWith(true)

    const pendingTools = useAgentChatInputStore.getState().pendingApprovalTools
    expect(pendingTools).toHaveLength(1)
    expect(pendingTools[0].name).toBe('delete_users')
  })

  it('点击「确认执行」时向 resolve 传递符合 LangGraph 规范的 decisions', () => {
    mockUseInterrupt.mockImplementation((config: UseInterruptConfig) => {
      return config.render?.({
        event: {
          name: 'on_interrupt',
          value: JSON.stringify({
            actionRequests: [
              {
                name: 'delete_users',
                args: { ids: ['user-123'] }
              }
            ]
          })
        },
        interrupt: null,
        resolve: mockResolve,
        cancel: vi.fn()
      } as never)
    })

    render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)

    const approveButton = screen.getByRole('button', { name: '确认执行' })
    fireEvent.click(approveButton)

    expect(mockResolve).toHaveBeenCalledWith({
      approved: true,
      decisions: [{ type: 'approve' }]
    })
  })

  it('点击「拒绝」时向 resolve 传递符合 LangGraph 规范的 decisions', () => {
    mockUseInterrupt.mockImplementation((config: UseInterruptConfig) => {
      return config.render?.({
        event: {
          name: 'on_interrupt',
          value: JSON.stringify({
            actionRequests: [
              {
                name: 'delete_users',
                args: { ids: ['user-123'] }
              }
            ]
          })
        },
        interrupt: null,
        resolve: mockResolve,
        cancel: vi.fn()
      } as never)
    })

    render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)

    const rejectButton = screen.getByRole('button', { name: '拒绝' })
    fireEvent.click(rejectButton)

    expect(mockResolve).toHaveBeenCalledWith({
      approved: false,
      decisions: [{ type: 'reject', message: '用户已拒绝执行该操作' }]
    })
  })

  it('组件卸载后清空 store 中的待审批工具', () => {
    mockUseInterrupt.mockImplementation((config: UseInterruptConfig) => {
      return config.render?.({
        event: {
          name: 'on_interrupt',
          value: JSON.stringify({
            actionRequests: [{ name: 'delete_users' }]
          })
        },
        interrupt: null,
        resolve: mockResolve,
        cancel: vi.fn()
      } as never)
    })

    const { unmount } = render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)
    expect(useAgentChatInputStore.getState().pendingApprovalTools).toHaveLength(1)

    act(() => {
      unmount()
    })

    expect(useAgentChatInputStore.getState().pendingApprovalTools).toEqual([])
  })
})
