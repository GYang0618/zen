// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSmoothStreamText } from './use-smooth-stream-text'

describe('useSmoothStreamText', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('非流式状态下直接返回原始文本且无动画', () => {
    const { result } = renderHook(() => useSmoothStreamText('历史回复内容', false))

    expect(result.current.displayText).toBe('历史回复内容')
    expect(result.current.isAnimating).toBe(false)
  })

  it('流式更新时逐帧平滑推进文本', () => {
    let rafCallback: FrameRequestCallback | null = null
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 1
    })

    const { result, rerender } = renderHook(
      ({ text, isStreaming }: { text: string; isStreaming: boolean }) =>
        useSmoothStreamText(text, isStreaming),
      { initialProps: { text: '', isStreaming: true } }
    )

    expect(result.current.displayText).toBe('')
    expect(result.current.isAnimating).toBe(true)

    // 收到第一批 token
    rerender({ text: '你好，我是 Zen', isStreaming: true })

    // 触发单帧消费
    act(() => {
      rafCallback?.(16)
    })

    // 应该平滑前进若干字符
    expect(result.current.displayText.length).toBeGreaterThan(0)
    expect(result.current.displayText.length).toBeLessThanOrEqual('你好，我是 Zen'.length)
    expect('你好，我是 Zen'.startsWith(result.current.displayText)).toBe(true)
  })

  it('流式结束后若有未消费字符，进入排空态并在完成后结束动画', () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      callbacks.push(cb)
      return callbacks.length
    })

    const { result, rerender } = renderHook(
      ({ text, isStreaming }: { text: string; isStreaming: boolean }) =>
        useSmoothStreamText(text, isStreaming),
      { initialProps: { text: '一二三四五六七八九十', isStreaming: true } }
    )

    // 大模型流结束，isStreaming 变为 false
    rerender({ text: '一二三四五六七八九十', isStreaming: false })

    // 排空循环，持续调用 RAF 回调直到消费完毕
    while (callbacks.length > 0) {
      const cb = callbacks.shift()
      act(() => {
        cb?.(16)
      })
    }

    expect(result.current.displayText).toBe('一二三四五六七八九十')
    expect(result.current.isAnimating).toBe(false)
  })
})
