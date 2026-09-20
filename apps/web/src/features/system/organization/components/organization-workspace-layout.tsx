import { cn, Drawer, DrawerContent, DrawerTitle } from '@zen/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { useOrganizations } from '../organizations-provider'
import { OrganizationSideOverview } from './organizations-side-overview'

import type { ReactNode, RefObject } from 'react'

/** 与 OrganizationSideOverview 的 `w-95` 对齐 */
const SIDE_OVERVIEW_WIDTH = '23.75rem'
/** 与 Tailwind `@5xl` / `@5xl/content` 一致：容器不足时改用 Drawer */
const COMPACT_MAX_WIDTH_PX = 1024

const sideOverviewMotion = {
  initial: { width: 0, opacity: 0, marginLeft: 0 },
  animate: { width: SIDE_OVERVIEW_WIDTH, opacity: 1, marginLeft: '1.5rem' },
  exit: { width: 0, opacity: 0, marginLeft: 0 },
  transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const }
}

function useIsCompactContainer(ref: RefObject<HTMLElement | null>) {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      setIsCompact(element.clientWidth < COMPACT_MAX_WIDTH_PX)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return isCompact
}

export function OrganizationWorkspaceLayout({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  const { currentNode, setCurrentNode } = useOrganizations()
  const containerRef = useRef<HTMLDivElement>(null)
  const isCompact = useIsCompactContainer(containerRef)
  const hasSelection = currentNode !== null

  return (
    <div ref={containerRef} className={cn('flex min-h-0 flex-1', className)}>
      <section className="min-h-0 min-w-0 flex-1">{children}</section>

      {!isCompact ? (
        <AnimatePresence initial={false}>
          {hasSelection ? (
            <motion.div
              key="organization-side-overview"
              initial={sideOverviewMotion.initial}
              animate={sideOverviewMotion.animate}
              exit={sideOverviewMotion.exit}
              transition={sideOverviewMotion.transition}
              className="shrink-0 overflow-hidden"
            >
              <div className="h-full w-95 overflow-y-auto">
                <OrganizationSideOverview />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : (
        <Drawer
          open={hasSelection}
          onOpenChange={(open) => {
            if (!open) setCurrentNode(null)
          }}
          swipeDirection="right"
        >
          <DrawerContent>
            <DrawerTitle className="sr-only">{currentNode?.name ?? '组织详情'}</DrawerTitle>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 ">
              {hasSelection ? <OrganizationSideOverview /> : null}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
