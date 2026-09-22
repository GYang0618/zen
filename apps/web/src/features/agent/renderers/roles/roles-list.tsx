import { Button, ScrollArea } from '@zen/ui'
import { ChevronLeftIcon, ChevronRightIcon, LayoutGrid, TextAlignStart } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { columns, RolesCard, RolesDialogs, RolesProvider } from '@/features/system/roles'

import { DataTable } from '../../a2ui/components/data-table'
import { ViewSwitcher } from '../../generative-ui/components/view-switcher'

import type { PageMeta, RoleListItem } from '@zen/shared'

interface RolesListViewProps {
  title: string
  data: RoleListItem[]
  description?: string
  pagination?: PageMeta
  loading?: boolean
}

function RolesCardScroll({ data }: { data: RoleListItem[] }) {
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

    const track = viewport.querySelector<HTMLElement>('[data-slot="role-card-track"]')
    const firstCard = track?.querySelector<HTMLElement>('[data-slot="role-card-item"]')
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
        <div data-slot="role-card-track" className="-ml-2 flex">
          {data.map((role) => (
            <div
              key={role.id}
              data-slot="role-card-item"
              className="w-[100cqi] shrink-0 grow-0 pl-2 sm:w-[50cqi] lg:w-[33.3333cqi]"
            >
              <div className="p-1">
                <RolesCard role={role} />
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

export function RolesList({ title, description, data, loading = false }: RolesListViewProps) {
  const views = useMemo(
    () => [
      {
        key: 'card',
        icon: LayoutGrid,
        render:
          data.length === 0 && !loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              暂无角色数据
            </div>
          ) : (
            <RolesCardScroll key={data.map((role) => role.id).join(':')} data={data} />
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
            emptyMessage="暂无角色数据"
          />
        )
      }
    ],
    [data, loading]
  )

  return (
    <RolesProvider>
      <RolesDialogs />
      <ViewSwitcher
        title={title ?? '角色查询结果'}
        description={description}
        views={views}
        loading={loading}
      />
    </RolesProvider>
  )
}
