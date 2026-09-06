import { Skeleton } from '@zen/ui'

export function RoutePending() {
  return (
    <div className="flex flex-1 flex-col gap-3 p-6" role="status" aria-label="页面加载中">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
