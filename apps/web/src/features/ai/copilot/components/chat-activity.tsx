import { Shimmer } from '@zen/ui'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ChatActivityIndicatorProps {
  isRunning: boolean
  isStreamingText: boolean
  activityLabel?: string
}

/** 收尾时 isRunning 还会停几百毫秒；延迟亮条，避免闪一下占位状态。 */
const SHOW_DELAY_MS = 240
const DEFAULT_ACTIVITY_LABEL = '正在处理…'

export function ChatActivityIndicator({
  isRunning,
  isStreamingText,
  activityLabel
}: ChatActivityIndicatorProps) {
  const shouldShow = Boolean(isRunning && (activityLabel || !isStreamingText))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!shouldShow) {
      setVisible(false)
      return
    }

    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [shouldShow])

  if (!visible) return null

  const label = activityLabel ?? DEFAULT_ACTIVITY_LABEL

  return (
    <div
      className="flex items-center gap-2 text-muted-foreground text-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2Icon className="size-4 animate-spin" />
      <Shimmer duration={1}>{label}</Shimmer>
    </div>
  )
}
