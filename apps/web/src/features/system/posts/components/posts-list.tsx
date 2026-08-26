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
  Skeleton
} from '@zen/ui'
import { BriefcaseBusiness, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { FacetedFilter } from '@/components/faceted-filter'
import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { flattenPages } from '@/lib/infinite-list'

import { useJobProfilesInfiniteQuery } from '../queries'
import { JOB_PROFILE_STATUS_OPTIONS } from '../utils'
import { PostsCard } from './posts-card'

import type { JobProfileStatus } from '@zen/shared'
import type { NavigateFn } from '@/hooks'

type PostsSearch = {
  keyword?: string
  page?: number
  pageSize?: number
  status?: JobProfileStatus | JobProfileStatus[]
}

type PostsListProps = {
  search: PostsSearch
  navigate: NavigateFn
}

function toFilterArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

const SKELETON_COUNT = 8
const SEARCH_DEBOUNCE_MS = 300

export function PostsList({ search, navigate }: PostsListProps) {
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const statusFilter = toFilterArray(search.status)
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage
  } = useJobProfilesInfiniteQuery({
    keyword: search.keyword,
    status: statusFilter.length === 1 ? statusFilter[0] : undefined
  })
  const profiles = flattenPages(data)
  const showSkeleton = isLoading && profiles.length === 0
  const isFilterFetching = isFetching && !isFetchingNextPage

  useEffect(() => {
    setKeyword(search.keyword ?? '')
  }, [search.keyword])

  useEffect(() => {
    const next = keyword.trim() || undefined
    if (next === (search.keyword || undefined)) return
    const timer = window.setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          page: undefined,
          keyword: next
        })
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [keyword, navigate, search.keyword])

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="flex flex-wrap gap-4">
        <InputGroup className="max-w-sm min-w-56 flex-1">
          <InputGroupInput
            placeholder="搜索岗位名称、编码或岗位族"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <FacetedFilter
          options={JOB_PROFILE_STATUS_OPTIONS.map((item) => ({
            label: item.label,
            value: item.value
          }))}
          value={statusFilter}
          onValueChange={(values) =>
            navigate({
              search: (prev) => ({
                ...prev,
                page: undefined,
                status: values.length > 0 ? values : undefined
              })
            })
          }
        />
      </section>

      {isError && profiles.length === 0 ? (
        <p className="text-sm text-destructive">岗位列表加载失败</p>
      ) : null}

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton key={`post-card-skeleton-${index}`} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : null}

      {!showSkeleton && !isError && profiles.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyTitle>没有结果</EmptyTitle>
            <EmptyDescription>当前没有可展示的岗位目录</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!showSkeleton && profiles.length > 0 ? (
        <>
          <section
            className={cn('@container transition-opacity', isFilterFetching && 'opacity-70')}
          >
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
              {profiles.map((item) => (
                <PostsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
          <InfiniteScrollSentinel
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            isError={isFetchNextPageError}
            onLoadMore={() => {
              void fetchNextPage()
            }}
          />
        </>
      ) : null}
    </div>
  )
}
