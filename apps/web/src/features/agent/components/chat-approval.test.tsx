// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseInterrupt = vi.fn()
let mockIsReady = true
let mockIsRunning = false
let mockActiveThreadId = 'thread-1'

vi.mock('@copilotkit/react-core/v2', () => ({
  useInterrupt: (args: unknown) => mockUseInterrupt(args)
}))

vi.mock('../context/chat-agent-context', () => ({
  useChatAgent: () => ({
    agent: {
      agentId: 'chat-active',
      isRunning: mockIsRunning
    },
    isReady: mockIsReady,
    activeThreadId: mockActiveThreadId
  })
}))

import { useAgentChatInputStore } from '../stores/agent-chat-input'
import {
  ChatApprovalRegistration,
  extractInterruptRawValue,
  parseInterruptValue
} from './chat-approval'

import type { UseInterruptConfig } from '@copilotkit/react-core/v2'

describe('extractInterruptRawValue', () => {
  it('优先从标准 AG-UI interrupt.metadata.langgraph.raw 提取负载', () => {
    const interrupt = {
      id: 'int-1',
      metadata: {
        langgraph: {
          raw: { actionRequests: [{ name: 'delete_users' }] }
        }
      }
    }
    const event = { value: 'legacy_value' }

    expect(extractInterruptRawValue(interrupt, event)).toEqual({
      actionRequests: [{ name: 'delete_users' }]
    })
  })

  it('当 metadata 中无 raw 时从 interrupt.value 提取', () => {
    const interrupt = {
      id: 'int-1',
      value: { actionRequests: [{ name: 'delete_users' }] }
    }
    expect(extractInterruptRawValue(interrupt, null)).toEqual({
      actionRequests: [{ name: 'delete_users' }]
    })
  })

  it('无 interrupt 时降级从 event.value 提取', () => {
    const event = { value: '{"actionRequests":[]}' }
    expect(extractInterruptRawValue(null, event)).toBe('{"actionRequests":[]}')
  })

  it('两者均为空时返回 undefined', () => {
    expect(extractInterruptRawValue(null, null)).toBeUndefined()
  })
})

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
    mockIsRunning = false
    mockActiveThreadId = 'thread-1'
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

  it('点击「确认执行」时向 resolve 传递符合 LangGraph 规范的 decisions，且防止重复点击', () => {
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
        interrupt: { id: 'int-123' },
        resolve: mockResolve,
        cancel: vi.fn()
      } as never)
    })

    render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)

    const approveButton = screen.getByRole('button', { name: '确认执行' })
    fireEvent.click(approveButton)

    expect(mockResolve).toHaveBeenCalledTimes(1)
    expect(mockResolve).toHaveBeenCalledWith({
      approved: true,
      decisions: [{ type: 'approve' }]
    })

    // 再次点击不会二次调用 resolve
    fireEvent.click(approveButton)
    expect(mockResolve).toHaveBeenCalledTimes(1)
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

  it('已处理的中断 ID 不会再次被重复渲染（乐观去重）', () => {
    let capturedRender: ((props: unknown) => unknown) | undefined

    mockUseInterrupt.mockImplementation((config: UseInterruptConfig) => {
      capturedRender = config.render as never
      return config.render?.({
        event: { name: 'on_interrupt' },
        interrupt: {
          id: 'interrupt-dedup-1',
          value: { actionRequests: [{ name: 'delete_users' }] }
        },
        resolve: mockResolve,
        cancel: vi.fn()
      } as never)
    })

    render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)

    const approveBtn = screen.getByRole('button', { name: '确认执行' })
    fireEvent.click(approveBtn)
    expect(mockResolve).toHaveBeenCalledTimes(1)

    // 模拟事件重放或者重新执行 render
    const secondRenderResult = capturedRender?.({
      event: { name: 'on_interrupt' },
      interrupt: {
        id: 'interrupt-dedup-1',
        value: { actionRequests: [{ name: 'delete_users' }] }
      },
      resolve: mockResolve,
      cancel: vi.fn()
    })

    expect(secondRenderResult).toBeNull()
  })

  it('当 agent 处于 isRunning 状态时禁用按钮并阻止提交', () => {
    mockIsRunning = true

    mockUseInterrupt.mockImplementation((config: UseInterruptConfig) => {
      return config.render?.({
        event: { name: 'on_interrupt' },
        interrupt: {
          id: 'int-running',
          value: { actionRequests: [{ name: 'delete_users' }] }
        },
        resolve: mockResolve,
        cancel: vi.fn()
      } as never)
    })

    render(<ChatApprovalRegistration onPendingChange={mockOnPendingChange} />)

    const approveBtn = screen.getByRole('button', { name: '确认执行' }) as HTMLButtonElement
    expect(approveBtn.disabled).toBe(true)
    fireEvent.click(approveBtn)

    expect(mockResolve).not.toHaveBeenCalled()
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
