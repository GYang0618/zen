import { cn, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Skeleton } from '@zen/ui'
import { Users } from 'lucide-react'

import { UsersCard } from './users-card'

import type { User } from '@zen/shared'

type UsersCardListProps = {
  data: User[]
  isLoading?: boolean
  isFetching?: boolean
}

const SKELETON_COUNT = 6

export function UsersCardList({ data, isLoading = false, isFetching = false }: UsersCardListProps) {
  const showSkeleton = isLoading && data.length === 0

  if (showSkeleton) {
    return <UsersCardListSkeleton count={SKELETON_COUNT} />
  }

  if (data.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>没有结果</EmptyTitle>
          <EmptyDescription>当前没有可展示的用户</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className={cn('@container transition-opacity', isFetching && 'opacity-70')}>
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
        {data.map((user) => (
          <UsersCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  )
}

function UsersCardListSkeleton({ count }: { count: number }) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`user-card-skeleton-${index}`}
            className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="size-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
