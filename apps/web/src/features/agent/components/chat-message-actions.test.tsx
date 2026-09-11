// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAgentChatInputStore } from '../stores/agent-chat-input'
import { ChatAssistantActions } from './chat-assistant-actions'
import { ChatUserActions } from './chat-user-actions'

describe('ChatUserActions', () => {
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    useAgentChatInputStore.setState({ editDraft: null })
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    cleanup()
    Object.assign(navigator, { clipboard: originalClipboard })
    vi.restoreAllMocks()
  })

  it('renders re-edit and copy action buttons', () => {
    render(<ChatUserActions text="查询全部的用户" />)

    expect(screen.getByRole('button', { name: '重新编辑' })).toBeDefined()
    expect(screen.getByRole('button', { name: '复制' })).toBeDefined()
  })

  it('sets edit draft in store when clicking re-edit button', () => {
    render(<ChatUserActions text="查询全部的应用" />)

    const editButton = screen.getByRole('button', { name: '重新编辑' })
    fireEvent.click(editButton)

    const draft = useAgentChatInputStore.getState().editDraft
    expect(draft?.text).toBe('查询全部的应用')
    expect(draft?.timestamp).toBeGreaterThan(0)
  })

  it('copies user text to clipboard when clicking copy button', async () => {
    render(<ChatUserActions text="测试用户消息文本" />)

    const copyButton = screen.getByRole('button', { name: '复制' })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('测试用户消息文本')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '已复制' })).toBeDefined()
    })
  })
})

describe('ChatAssistantActions', () => {
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    cleanup()
    Object.assign(navigator, { clipboard: originalClipboard })
    vi.restoreAllMocks()
  })

  it('renders copy, retry, and copy link action buttons', () => {
    const handleRetry = vi.fn()
    render(<ChatAssistantActions content="AI 回答内容" onRetry={handleRetry} isRunning={false} />)

    expect(screen.getByRole('button', { name: '复制' })).toBeDefined()
    expect(screen.getByRole('button', { name: '重新回复' })).toBeDefined()
    expect(screen.getByRole('button', { name: '复制链接' })).toBeDefined()
  })

  it('triggers onRetry when retry button is clicked and not running', () => {
    const handleRetry = vi.fn()
    render(<ChatAssistantActions content="AI 回答内容" onRetry={handleRetry} isRunning={false} />)

    const retryButton = screen.getByRole('button', { name: '重新回复' })
    expect(retryButton.hasAttribute('disabled')).toBe(false)
    fireEvent.click(retryButton)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('disables retry button when isRunning is true', () => {
    const handleRetry = vi.fn()
    render(<ChatAssistantActions content="AI 回答内容" onRetry={handleRetry} isRunning={true} />)

    const retryButton = screen.getByRole('button', { name: '重新回复' })
    expect(retryButton.hasAttribute('disabled')).toBe(true)
    fireEvent.click(retryButton)
    expect(handleRetry).not.toHaveBeenCalled()
  })

  it('copies AI text to clipboard when copy button is clicked', async () => {
    render(<ChatAssistantActions content="已为您检索全部用户，共 14 人" onRetry={vi.fn()} />)

    const copyButton = screen.getByRole('button', { name: '复制' })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('已为您检索全部用户，共 14 人')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '已复制' })).toBeDefined()
    })
  })

  it('copies current location href when copy link button is clicked', async () => {
    render(<ChatAssistantActions content="AI 回答内容" onRetry={vi.fn()} />)

    const copyLinkButton = screen.getByRole('button', { name: '复制链接' })
    fireEvent.click(copyLinkButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '已复制链接' })).toBeDefined()
    })
  })
})

describe('useAgentChatInputStore', () => {
  it('updates and clears draft state', () => {
    useAgentChatInputStore.getState().setEditDraft('测试草稿')
    expect(useAgentChatInputStore.getState().editDraft?.text).toBe('测试草稿')

    useAgentChatInputStore.getState().clearEditDraft()
    expect(useAgentChatInputStore.getState().editDraft).toBeNull()
  })

  it('tracks running threads and increments newThreadNonce', () => {
    const threadA = 'thread-a'
    const threadB = 'thread-b'

    // Mark running
    useAgentChatInputStore.getState().markThreadRunning(threadA, true)
    useAgentChatInputStore.getState().markThreadRunning(threadB, true)
    expect(useAgentChatInputStore.getState().runningThreadIds.has(threadA)).toBe(true)
    expect(useAgentChatInputStore.getState().runningThreadIds.has(threadB)).toBe(true)

    // Mark finished
    useAgentChatInputStore.getState().markThreadRunning(threadA, false)
    expect(useAgentChatInputStore.getState().runningThreadIds.has(threadA)).toBe(false)
    expect(useAgentChatInputStore.getState().runningThreadIds.has(threadB)).toBe(true)

    // Increment nonce
    const initialNonce = useAgentChatInputStore.getState().newThreadNonce
    useAgentChatInputStore.getState().triggerNewThread()
    expect(useAgentChatInputStore.getState().newThreadNonce).toBe(initialNonce + 1)
  })
})
