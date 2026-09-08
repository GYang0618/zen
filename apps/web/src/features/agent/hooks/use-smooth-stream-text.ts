'use client'

import { useEffect, useRef, useState } from 'react'

export interface SmoothStreamResult {
  displayText: string
  isAnimating: boolean
}

/**
 * 虚拟平滑打字机缓冲 Hook（对标 Cursor / ChatGPT 的流式输出质感）：
 * - 对于历史消息或非流式消息，直接返回 rawText，零延迟；
 * - 对于正在流式的最新消息，通过 requestAnimationFrame 维护一个消费速率自适应的缓冲队列；
 * - 当后端大模型结束推送（isStreaming 由 true 变为 false）时，若队列中仍有未打完的字符，
 *   在 ~100-200ms 内平滑把最后几个字打完，与后端停止/发送按钮就绪形成自然的时间重叠。
 */
export function useSmoothStreamText(rawText: string, isStreaming: boolean): SmoothStreamResult {
  const [displayText, setDisplayText] = useState(() => rawText)
  const [isDraining, setIsDraining] = useState(false)

  const rawTextRef = useRef(rawText)
  rawTextRef.current = rawText

  const displayTextRef = useRef(displayText)
  displayTextRef.current = displayText

  const rafIdRef = useRef<number | null>(null)
  const wasStreamingRef = useRef(isStreaming)

  useEffect(() => {
    // 历史或静态文本，没有经历过 streaming，直接同步
    if (!isStreaming && !wasStreamingRef.current) {
      if (displayTextRef.current !== rawText) {
        setDisplayText(rawText)
      }
      return
    }

    if (isStreaming) {
      wasStreamingRef.current = true
    }

    const tick = () => {
      const current = displayTextRef.current
      const target = rawTextRef.current

      // 内容已被全部消费
      if (current === target) {
        if (!isStreaming) {
          wasStreamingRef.current = false
          setIsDraining(false)
        }
        rafIdRef.current = null
        return
      }

      // 文本被清空或重置（如重新生成），直接同步
      if (target.length < current.length) {
        setDisplayText(target)
        if (!isStreaming) {
          wasStreamingRef.current = false
          setIsDraining(false)
        }
        rafIdRef.current = null
        return
      }

      const diff = target.length - current.length
      // 自适应消费步长（字符/帧）：
      // - 堆积极多（>120 字）：以较大步长高速追赶
      // - 中等堆积（20-120 字）：平滑追赶
      // - 剩余少量（<20 字）：以 1~2 字/帧的舒适打字速度消费
      let step = 1
      if (diff > 120) {
        step = Math.ceil(diff / 4)
      } else if (diff > 50) {
        step = Math.ceil(diff / 8)
      } else if (diff > 20) {
        step = 3
      } else if (diff > 6) {
        step = 2
      } else {
        step = 1
      }

      const nextLength = Math.min(current.length + step, target.length)
      setDisplayText(target.slice(0, nextLength))

      if (!isStreaming && nextLength < target.length) {
        setIsDraining(true)
      }

      rafIdRef.current = requestAnimationFrame(tick)
    }

    if (rafIdRef.current === null && displayTextRef.current !== rawTextRef.current) {
      rafIdRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [rawText, isStreaming])

  return {
    displayText,
    isAnimating: isStreaming || isDraining
  }
}
