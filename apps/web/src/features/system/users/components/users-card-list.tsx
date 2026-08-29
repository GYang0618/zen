import { cn, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Skeleton } from '@zen/ui'
import { Users } from 'lucide-react'
import { useEffect } from 'react'

import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { selectItemsById, useListSelection } from '@/hooks'
import { flattenPages } from '@/lib/infinite-list'

import { useUsersInfiniteQuery } from '../queries'
import { UsersBulkActions } from './users-bulk-actions'
import { UsersCard } from './users-card'

import type { UsersQuery } from '@zen/shared'

type UsersCardListProps = Omit<UsersQuery, 'page' | 'pageSize'>

const SKELETON_COUNT = 6

export function UsersCardList({ keyword, status, role, sortBy, sortOrder }: UsersCardListProps) {
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage
  } = useUsersInfiniteQuery({ keyword, status, role, sortBy, sortOrder })
  const users = flattenPages(data)
  const selection = useListSelection()
  const selectedItems = selectItemsById(users, selection.selectedIds)
  const showSkeleton = isLoading && users.length === 0
  const isFilterFetching = isFetching && !isFetchingNextPage
  const selectionResetKey = JSON.stringify({ keyword, status, role, sortBy, sortOrder })

  useEffect(() => {
    void selectionResetKey
    selection.clear()
  }, [selectionResetKey, selection.clear])

  useEffect(() => {
    if (!selection.isSelecting) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (document.querySelector('[data-slot="alert-dialog-content"]')) return
      selection.clear()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selection.isSelecting, selection.clear])

  if (showSkeleton) {
    return <UsersCardListSkeleton count={SKELETON_COUNT} />
  }

  if (isError && users.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>加载失败</EmptyTitle>
          <EmptyDescription>用户列表加载失败，请稍后重试</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (users.length === 0) {
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
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex flex-1 flex-col gap-4')}>
      <div className={cn('@container transition-opacity', isFilterFetching && 'opacity-70')}>
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
          {users.map((user) => (
            <UsersCard
              key={user.id}
              user={user}
              isSelecting={selection.isSelecting}
              selected={selection.isSelected(user.id)}
              onEnterSelecting={selection.enterSelecting}
              onSelectedChange={(nextSelected) => selection.setSelected(user.id, nextSelected)}
            />
          ))}
        </div>
      </div>
      <InfiniteScrollSentinel
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
        isError={isFetchNextPageError}
        onLoadMore={() => {
          void fetchNextPage()
        }}
      />
      <UsersBulkActions
        selectedItems={selectedItems}
        isSelecting={selection.isSelecting}
        onClearSelection={selection.clear}
      />
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
