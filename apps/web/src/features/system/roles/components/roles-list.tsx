import {
  cn,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Skeleton,
  VirtualList
} from '@zen/ui'
import { Search, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

import { FacetedFilter } from '@/components/faceted-filter'
import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { selectItemsById, useListSelection } from '@/hooks'
import { flattenPages } from '@/lib/infinite-list'

import { roleEffectiveStatusOptions } from '../data/data'
import { useRolesInfiniteQuery } from '../queries'
import { RolesBulkActions } from './roles-bulk-actions'
import { RolesCard } from './roles-card'

import type { RoleDataScope, RoleEffectiveStatus } from '@zen/shared'
import type { NavigateFn } from '@/hooks'

type RolesSearch = {
  keyword?: string
  page?: number
  pageSize?: number
  effectiveStatus?: RoleEffectiveStatus | RoleEffectiveStatus[]
  dataScope?: RoleDataScope | RoleDataScope[]
}

type RolesListProps = {
  search: RolesSearch
  navigate: NavigateFn
}

function toFilterArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

const SKELETON_COUNT = 6
const SEARCH_DEBOUNCE_MS = 300

export function RolesList({ search, navigate }: RolesListProps) {
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const statusFilter = toFilterArray(search.effectiveStatus)
  const selection = useListSelection()
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage
  } = useRolesInfiniteQuery({
    keyword: search.keyword,
    effectiveStatus: search.effectiveStatus,
    dataScope: search.dataScope
  })
  const roles = flattenPages(data)
  const selectedItems = selectItemsById(roles, selection.selectedIds)
  const showSkeleton = isLoading && roles.length === 0
  const isFilterFetching = isFetching && !isFetchingNextPage

  useEffect(() => {
    setKeyword(search.keyword ?? '')
  }, [search.keyword])

  useEffect(() => {
    const next = keyword.trim() || undefined
    if (next === (search.keyword || undefined)) return
    const timer = window.setTimeout(() => {
      selection.clear()
      navigate({
        search: (prev) => ({
          ...prev,
          page: undefined,
          keyword: next
        })
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [keyword, navigate, search.keyword, selection.clear])

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

  return (
    <div className={cn('max-sm:has-[div[role="toolbar"]]:mb-16', 'flex flex-1 flex-col gap-4')}>
      <section className="flex gap-4">
        <InputGroup className="w-100">
          <InputGroupInput
            placeholder="搜索角色名称或编码"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <FacetedFilter
          options={roleEffectiveStatusOptions}
          value={statusFilter}
          onValueChange={(values) => {
            selection.clear()
            navigate({
              search: (prev) => ({
                ...prev,
                page: undefined,
                effectiveStatus: values.length > 0 ? values : undefined
              })
            })
          }}
        />
      </section>

      {isError && roles.length === 0 ? (
        <p className="text-sm text-destructive">角色列表加载失败</p>
      ) : null}

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton key={`role-card-skeleton-${index}`} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {!showSkeleton && !isError && roles.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shield />
            </EmptyMedia>
            <EmptyTitle>没有结果</EmptyTitle>
            <EmptyDescription>当前没有可展示的角色</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!showSkeleton && roles.length > 0 ? (
        <>
          <section
            className={cn('@container transition-opacity', isFilterFetching && 'opacity-70')}
          >
            <VirtualList
              items={roles}
              estimateSize={160}
              minLaneSize={280}
              gap={16}
              getItemKey={(role) => role.id}
              className="max-h-[70vh]"
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
              }}
            >
              {(role) => (
                <RolesCard
                  role={role}
                  isSelecting={selection.isSelecting}
                  selected={selection.isSelected(role.id)}
                  onEnterSelecting={selection.enterSelecting}
                  onSelectedChange={(nextSelected) => selection.setSelected(role.id, nextSelected)}
                />
              )}
            </VirtualList>
          </section>
          <InfiniteScrollSentinel
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            isError={isFetchNextPageError}
            onLoadMore={() => {
              void fetchNextPage()
            }}
          />
          <RolesBulkActions
            selectedItems={selectedItems}
            isSelecting={selection.isSelecting}
            onClearSelection={selection.clear}
          />
        </>
      ) : null}
    </div>
  )
}
