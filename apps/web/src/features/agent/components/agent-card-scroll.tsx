import { Button, cn, ScrollArea } from '@zen/ui'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ReactNode } from 'react'

interface AgentCardScrollProps<T extends { id: string }> {
  items: T[]
  renderItem: (item: T) => ReactNode
}

export function AgentCardScroll<T extends { id: string }>({
  items,
  renderItem
}: AgentCardScrollProps<T>) {
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
    const card = viewport?.querySelector<HTMLElement>('[data-slot="agent-card-item"]')
    if (!viewport || !card) return
    viewport.scrollBy({ left: direction * card.offsetWidth, behavior: 'smooth' })
  }

  return (
    <div className="@container relative w-full">
      <ScrollArea
        className="w-full"
        scrollbars="none"
        viewportRef={viewportRef}
        viewportClassName="!h-auto w-full"
      >
        <div className="-ml-2 flex">
          {items.map((item) => (
            <div
              key={item.id}
              data-slot="agent-card-item"
              className="w-[100cqi] shrink-0 grow-0 pl-2 @2xl:w-[50cqi] @4xl:w-[33.3333cqi]"
            >
              <div className="p-1">{renderItem(item)}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {items.length > 1 ? (
        <>
          <ScrollButton
            label="向左滚动"
            disabled={!canScrollPrev}
            onClick={() => scrollByDirection(-1)}
          >
            <ChevronLeftIcon />
          </ScrollButton>
          <ScrollButton
            label="向右滚动"
            disabled={!canScrollNext}
            align="right"
            onClick={() => scrollByDirection(1)}
          >
            <ChevronRightIcon />
          </ScrollButton>
        </>
      ) : null}
    </div>
  )
}

function ScrollButton({
  label,
  disabled,
  align = 'left',
  onClick,
  children
}: {
  label: string
  disabled: boolean
  align?: 'left' | 'right'
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn(
        'absolute inset-y-0 z-10 my-auto hidden rounded-full touch-manipulation md:inline-flex',
        align === 'left' ? 'left-1' : 'right-1'
      )}
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
