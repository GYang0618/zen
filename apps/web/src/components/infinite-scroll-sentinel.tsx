import { Button, cn } from '@zen/ui'
import { Loader2 } from 'lucide-react'

import { useInViewCallback } from '@/hooks/use-in-view-callback'

type InfiniteScrollSentinelProps = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isError?: boolean
  onLoadMore: () => void
  onRetry?: () => void
  className?: string
  rootSelector?: string
  exhaustedLabel?: string | null
}

export function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  isError = false,
  onLoadMore,
  onRetry,
  className,
  rootSelector,
  exhaustedLabel = '已加载全部'
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useInViewCallback(onLoadMore, {
    enabled: hasNextPage && !isFetchingNextPage && !isError,
    rootSelector
  })

  return (
    <div
      ref={sentinelRef}
      className={cn('flex min-h-10 items-center justify-center py-4', className)}
      aria-live="polite"
    >
      {isFetchingNextPage ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="加载更多" />
      ) : null}

      {isError ? (
        <Button variant="ghost" size="sm" onClick={onRetry ?? onLoadMore}>
          加载失败，点击重试
        </Button>
      ) : null}

      {!hasNextPage && !isFetchingNextPage && !isError && exhaustedLabel ? (
        <p className="text-sm text-muted-foreground">{exhaustedLabel}</p>
      ) : null}
    </div>
  )
}
