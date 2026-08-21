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

import { JOB_PROFILE_STATUS_OPTIONS } from '../utils'
import { PostsCard } from './posts-card'

import type { JobProfile, JobProfileStatus } from '@zen/shared'
import type { NavigateFn } from '@/hooks'

type PostsSearch = {
  keyword?: string
  page?: number
  pageSize?: number
  status?: JobProfileStatus | JobProfileStatus[]
}

type PostsListProps = {
  data: JobProfile[]
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  search: PostsSearch
  navigate: NavigateFn
}

function toFilterArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

const SKELETON_COUNT = 8
const SEARCH_DEBOUNCE_MS = 300

export function PostsList({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  search,
  navigate
}: PostsListProps) {
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const statusFilter = toFilterArray(search.status)
  const showSkeleton = isLoading && data.length === 0

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
    <div className="flex flex-col gap-4">
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

      {isError ? <p className="text-sm text-destructive">岗位列表加载失败</p> : null}

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton key={`post-card-skeleton-${index}`} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : null}

      {!showSkeleton && !isError && data.length === 0 ? (
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

      {!showSkeleton && data.length > 0 ? (
        <section className={cn('@container transition-opacity', isFetching && 'opacity-70')}>
          <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
            {data.map((item) => (
              <PostsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
