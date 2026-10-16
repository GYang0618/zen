'use client'

import { useEffect, useState } from 'react'

/**
 * 画布工具参数要等整段调用结束才写入消息，完成前徽章不会出现。
 * 正文停稳后再提示，避免逐字输出时闪出生成态。
 */
const CANVAS_GENERATION_SETTLE_MS = 800

export function useCanvasGenerationPending(content: string, active: boolean): boolean {
  const [settledContent, setSettledContent] = useState<string | null>(null)

  useEffect(() => {
    if (!active) {
      setSettledContent(null)
      return
    }

    const timer = window.setTimeout(() => setSettledContent(content), CANVAS_GENERATION_SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [active, content])

  return active && settledContent === content
}
