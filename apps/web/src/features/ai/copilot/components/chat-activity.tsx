import { Shimmer } from '@zen/ui'
import { Loader2Icon } from 'lucide-react'

interface ChatActivityIndicatorProps {
  isRunning: boolean
  isStreamingText: boolean
  activityLabel?: string
}

export function ChatActivityIndicator({
  isRunning,
  isStreamingText,
  activityLabel
}: ChatActivityIndicatorProps) {
  if (!isRunning) return null
  if (!activityLabel && isStreamingText) return null

  const label = activityLabel ?? '正在思考...'

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
