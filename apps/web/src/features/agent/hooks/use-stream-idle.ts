'use client'

import { useEffect, useRef, useState } from 'react'

/** 流式 token 停更超过该时间，视为中间空窗，停止打字动画。 */
export const STREAM_IDLE_MS = 450

/**
 * 签名持续变化时保持 false；签名稳定超过 idleMs 后为 true。
 * 签名在渲染期变化时立即视为未空闲，避免新 token 到达后活动条闪一帧。
 */
export function useStreamIdle(
  active: boolean,
  signature: string,
  idleMs: number = STREAM_IDLE_MS
): boolean {
  const [idle, setIdle] = useState(false)
  const seenSignature = useRef(signature)
  const signatureChanged = seenSignature.current !== signature

  if (signatureChanged) {
    seenSignature.current = signature
    if (idle) setIdle(false)
  }

  useEffect(() => {
    if (!active) {
      setIdle(false)
      return
    }

    setIdle(false)
    const watchedSignature = signature
    const timer = window.setTimeout(() => {
      if (watchedSignature === signature) setIdle(true)
    }, idleMs)
    return () => window.clearTimeout(timer)
  }, [active, idleMs, signature])

  return Boolean(active && idle && !signatureChanged)
}
