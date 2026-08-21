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
import { Search, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

import { FacetedFilter } from '@/components/faceted-filter'

import { roleEffectiveStatusOptions } from '../data/data'
import { RolesCard } from './roles-card'

import type { Role, RoleEffectiveStatus } from '@zen/shared'
import type { NavigateFn } from '@/hooks'

type RolesSearch = {
  keyword?: string
  page?: number
  pageSize?: number
  effectiveStatus?: RoleEffectiveStatus | RoleEffectiveStatus[]
}

type RolesListProps = {
  data: Role[]
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  search: RolesSearch
  navigate: NavigateFn
}

function toFilterArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

const SKELETON_COUNT = 6
const SEARCH_DEBOUNCE_MS = 300

export function RolesList({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  search,
  navigate
}: RolesListProps) {
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const statusFilter = toFilterArray(search.effectiveStatus)
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
          onValueChange={(values) =>
            navigate({
              search: (prev) => ({
                ...prev,
                page: undefined,
                effectiveStatus: values.length > 0 ? values : undefined
              })
            })
          }
        />
      </section>

      {isError ? <p className="text-sm text-destructive">角色列表加载失败</p> : null}

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton key={`role-card-skeleton-${index}`} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {!showSkeleton && !isError && data.length === 0 ? (
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

      {!showSkeleton && data.length > 0 ? (
        <section className={cn('@container transition-opacity', isFetching && 'opacity-70')}>
          <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
            {data.map((role) => (
              <RolesCard key={role.id} role={role} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
