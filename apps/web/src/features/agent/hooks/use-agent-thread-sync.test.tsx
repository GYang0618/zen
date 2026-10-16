// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockConnectAgent = vi.fn()
const mockUseAgent = vi.fn()
const mockUseCopilotKit = vi.fn()

vi.mock('@copilotkit/react-core/v2', () => ({
  randomUUID: vi.fn(() => 'mock-uuid-1'),
  UseAgentUpdate: {
    OnMessagesChanged: 1,
    OnRunStatusChanged: 2
  },
  useAgent: (...args: unknown[]) => mockUseAgent(...args),
  useCopilotKit: () => mockUseCopilotKit()
}))

import { resetAgentPendingInterrupts, useAgentThreadSync } from './use-agent-thread-sync'

describe('useAgentThreadSync', () => {
  let mockAgent: {
    agentId: string
    threadId: string | null
    messages: unknown[]
    isRunning: boolean
    pendingInterrupts?: unknown[]
    delegate?: { pendingInterrupts?: unknown[] }
    subscribe: ReturnType<typeof vi.fn>
    setMessages: ReturnType<typeof vi.fn>
    detachActiveRun: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAgent = {
      agentId: 'chat-active-mock-uuid-1',
      threadId: null,
      messages: [],
      isRunning: false,
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      setMessages: vi.fn((msgs) => {
        mockAgent.messages = msgs
      }),
      detachActiveRun: vi.fn().mockResolvedValue(undefined)
    }

    mockUseAgent.mockImplementation((config?: { agentId?: string }) => {
      if (config?.agentId) {
        mockAgent.agentId = config.agentId
      }
      return {
        agent: mockAgent,
        isReady: true
      }
    })

    mockConnectAgent.mockClear()
    mockConnectAgent.mockResolvedValue(undefined)
    mockUseCopilotKit.mockReturnValue({
      copilotkit: {
        connectAgent: mockConnectAgent
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes in non-connecting state for new conversation', () => {
    const { result } = renderHook(() => useAgentThreadSync({ agentId: 'default' }))

    expect(result.current.hasExplicitThreadId).toBe(false)
    expect(result.current.isConnecting).toBe(false)
    expect(result.current.activeThreadId).toBe('mock-uuid-1')
    expect(mockConnectAgent).not.toHaveBeenCalled()
  })

  it('triggers connectAgent and updates isConnecting when switching to a historical thread', async () => {
    let currentThreadId: string | undefined
    const { result, rerender } = renderHook(
      ({ threadId }: { threadId?: string }) => useAgentThreadSync({ agentId: 'default', threadId }),
      { initialProps: { threadId: currentThreadId } }
    )

    expect(result.current.isConnecting).toBe(false)

    // Switch to a historical thread
    await act(async () => {
      currentThreadId = 'thread-hist-1'
      rerender({ threadId: currentThreadId })
    })

    expect(mockConnectAgent).toHaveBeenCalledWith({ agent: mockAgent })
    expect(mockAgent.threadId).toBe('thread-hist-1')

    // Wait for frame schedule
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    expect(result.current.isConnecting).toBe(false)
    expect(result.current.activeThreadId).toBe('thread-hist-1')
  })

  it('connects to next historical thread when switching between existing threads', async () => {
    let currentThreadId: string | undefined = 'thread-1'
    const { result, rerender } = renderHook(
      ({ threadId }) => useAgentThreadSync({ agentId: 'default', threadId }),
      { initialProps: { threadId: currentThreadId } }
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(result.current.isConnecting).toBe(false)
    expect(mockConnectAgent).toHaveBeenCalledTimes(1)

    // Switch to thread-2
    await act(async () => {
      currentThreadId = 'thread-2'
      rerender({ threadId: currentThreadId })
    })

    expect(mockConnectAgent).toHaveBeenCalledTimes(2)
    expect(mockAgent.threadId).toBe('thread-2')

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(result.current.isConnecting).toBe(false)
    expect(result.current.activeThreadId).toBe('thread-2')
  })

  it('does not re-connect when route anchors to the freshly created thread after sending a message', async () => {
    let currentThreadId: string | undefined
    const { result, rerender } = renderHook(
      ({ threadId }: { threadId?: string }) => useAgentThreadSync({ agentId: 'default', threadId }),
      { initialProps: { threadId: currentThreadId } }
    )

    const initialActiveId = result.current.activeThreadId
    expect(result.current.isConnecting).toBe(false)
    expect(mockConnectAgent).not.toHaveBeenCalled()

    // Simulate chat-input anchoring route to initialActiveId
    await act(async () => {
      currentThreadId = initialActiveId
      rerender({ threadId: currentThreadId })
    })

    expect(result.current.isConnecting).toBe(false)
    expect(mockConnectAgent).not.toHaveBeenCalled()
  })

  it('clears messages when switching from historical thread to new thread', async () => {
    let currentThreadId: string | undefined = 'hist-1'
    const { result, rerender } = renderHook(
      ({ threadId }: { threadId?: string }) => useAgentThreadSync({ agentId: 'default', threadId }),
      { initialProps: { threadId: currentThreadId as string | undefined } }
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(result.current.isConnecting).toBe(false)

    // Simulate that hist-1 has messages
    mockAgent.messages = [{ id: 'm1', content: 'test message' }]

    // Switch to new conversation
    await act(async () => {
      currentThreadId = undefined
      rerender({ threadId: currentThreadId })
    })

    expect(result.current.isConnecting).toBe(false)
    expect(mockAgent.messages).toHaveLength(0)
  })

  it('dynamically scopes localAgentId to the activeThreadId for thread isolation', async () => {
    let currentThreadId: string | undefined = 'thread-isolated-1'
    const { result, rerender } = renderHook(
      ({ threadId }: { threadId?: string }) => useAgentThreadSync({ agentId: 'default', threadId }),
      { initialProps: { threadId: currentThreadId } }
    )

    expect(result.current.localAgentId).toBe('chat-active-thread-isolated-1')
    expect(mockAgent.agentId).toBe('chat-active-thread-isolated-1')

    await act(async () => {
      currentThreadId = 'thread-isolated-2'
      rerender({ threadId: currentThreadId })
    })

    expect(result.current.localAgentId).toBe('chat-active-thread-isolated-2')
    expect(mockAgent.agentId).toBe('chat-active-thread-isolated-2')
  })

  it('resets pendingInterrupts on agent and delegate before connecting to historical thread', async () => {
    mockAgent.pendingInterrupts = [{ id: 'pending-int-1' }]
    mockAgent.delegate = { pendingInterrupts: [{ id: 'pending-int-2' }] }

    let currentThreadId: string | undefined
    const { rerender } = renderHook(
      ({ threadId }: { threadId?: string }) => useAgentThreadSync({ agentId: 'default', threadId }),
      { initialProps: { threadId: currentThreadId } }
    )

    await act(async () => {
      currentThreadId = 'thread-with-interrupt'
      rerender({ threadId: currentThreadId })
    })

    expect(mockAgent.pendingInterrupts).toHaveLength(0)
    expect(mockAgent.delegate?.pendingInterrupts).toHaveLength(0)
    expect(mockConnectAgent).toHaveBeenCalledWith({ agent: mockAgent })
  })

  it('resetAgentPendingInterrupts safely handles non-objects and objects without interrupts', () => {
    expect(() => resetAgentPendingInterrupts(null)).not.toThrow()
    expect(() => resetAgentPendingInterrupts(undefined)).not.toThrow()
    expect(() => resetAgentPendingInterrupts({})).not.toThrow()
    expect(() => resetAgentPendingInterrupts('string-agent')).not.toThrow()

    const obj = { pendingInterrupts: [1, 2], delegate: { pendingInterrupts: [3] } }
    resetAgentPendingInterrupts(obj)
    expect(obj.pendingInterrupts).toEqual([])
    expect(obj.delegate.pendingInterrupts).toEqual([])
  })
})
