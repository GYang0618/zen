import { useRenderTool } from '@copilotkit/react-core/v2'
import { usersPageSchema, usersQueryToolSchema } from '@zen/shared'
import { Button, ScrollArea } from '@zen/ui'
import { ChevronLeftIcon, ChevronRightIcon, LayoutGrid, TextAlignStart } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { columns, UserCard, UsersDialogs, UsersProvider } from '@/features/system/users'

import { DataTable } from '../../generative-ui'
import { ViewSwitcher } from '../../generative-ui/components/view-switcher'
import { parseToolResult } from '../../lib/parse-tool-result'

import type { PageMeta, UserListItem } from '@zen/shared'

export function useUsersRenderers() {
  useRenderTool({
    name: 'query_users_list',
    parameters: usersQueryToolSchema,
    render: ({ parameters, status, result }) => {
      try {
        if (status === 'inProgress') return <span>处理中...</span>
        const { title, description, display } = parameters.meta
        if (display === false) return null
        if (status === 'executing') return <span>工具执行中...</span>
        if (status === 'complete') {
          const data = parseToolResult(result, usersPageSchema)
          if (data?.items?.length === 0) return null
          return (
            <UsersRender
              title={title}
              description={description}
              data={data?.items ?? []}
              pagination={data?.pagination}
            />
          )
        }
        return null
      } catch (error) {
        console.error(error)
        return null
      }
    }
  })
}

interface UsersRenderViewProps {
  title: string
  data: UserListItem[]
  description?: string
  pagination?: PageMeta
  loading?: boolean
}

function UsersCardScroll({ data }: { data: UserListItem[] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const syncScrollState = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const { scrollLeft, scrollWidth, clientWidth } = viewport
    setCanScrollPrev(scrollLeft > 1)
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    syncScrollState()
    viewport.addEventListener('scroll', syncScrollState, { passive: true })
    const observer = new ResizeObserver(syncScrollState)
    observer.observe(viewport)

    return () => {
      viewport.removeEventListener('scroll', syncScrollState)
      observer.disconnect()
    }
  }, [syncScrollState])

  const scrollByDirection = (direction: -1 | 1) => {
    const viewport = viewportRef.current
    if (!viewport) return

    const track = viewport.querySelector<HTMLElement>('[data-slot="user-card-track"]')
    const firstCard = track?.querySelector<HTMLElement>('[data-slot="user-card-item"]')
    if (!firstCard) return

    viewport.scrollBy({
      left: direction * firstCard.offsetWidth,
      behavior: 'smooth'
    })
  }

  return (
    <div className="@container relative w-full">
      <ScrollArea
        className="w-full"
        scrollbars="none"
        viewportRef={viewportRef}
        viewportClassName="!h-auto w-full"
      >
        <div data-slot="user-card-track" className="-ml-2 flex">
          {data.map((user) => (
            <div
              key={user.id}
              data-slot="user-card-item"
              className="w-[100cqi] shrink-0 grow-0 pl-2 sm:w-[50cqi] lg:w-[33.3333cqi]"
            >
              <div className="p-1">
                <UserCard user={user} />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {data.length > 1 ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute inset-y-0 left-1 z-10 my-auto hidden rounded-full touch-manipulation md:inline-flex"
            disabled={!canScrollPrev}
            aria-label="向左滚动"
            onClick={() => scrollByDirection(-1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute inset-y-0 right-1 z-10 my-auto hidden rounded-full touch-manipulation md:inline-flex"
            disabled={!canScrollNext}
            aria-label="向右滚动"
            onClick={() => scrollByDirection(1)}
          >
            <ChevronRightIcon />
          </Button>
        </>
      ) : null}
    </div>
  )
}

function UsersRender({ title, description, data, loading = false }: UsersRenderViewProps) {
  const views = useMemo(
    () => [
      {
        key: 'card',
        icon: LayoutGrid,
        render:
          data.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              暂无用户数据
            </div>
          ) : (
            <UsersCardScroll key={data.map((user) => user.id).join(':')} data={data} />
          )
      },
      {
        key: 'table',
        icon: TextAlignStart,
        render: (
          <DataTable
            data={data}
            columns={columns}
            isLoading={loading}
            emptyMessage="暂无用户数据"
          />
        )
      }
    ],
    [data, loading]
  )

  return (
    <UsersProvider>
      <UsersDialogs />
      <ViewSwitcher
        title={title ?? '用户查询结果'}
        description={description}
        views={views}
        loading={loading}
      />
    </UsersProvider>
  )
}
