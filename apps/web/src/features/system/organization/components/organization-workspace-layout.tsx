import { cn } from '@zen/ui'
import { AnimatePresence, motion } from 'motion/react'

import { useOrganizations } from '../organizations-provider'
import { OrganizationSideOverview } from './organizations-side-overview'

import type { ReactNode } from 'react'

/** 与 OrganizationSideOverview 的 `w-95` 对齐 */
const SIDE_OVERVIEW_WIDTH = '23.75rem'

const sideOverviewMotion = {
  initial: { width: 0, opacity: 0, marginLeft: 0 },
  animate: { width: SIDE_OVERVIEW_WIDTH, opacity: 1, marginLeft: '1.5rem' },
  exit: { width: 0, opacity: 0, marginLeft: 0 },
  transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const }
}

export function OrganizationWorkspaceLayout({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  const { currentNode } = useOrganizations()

  return (
    <div className={cn('flex min-h-0 flex-1', className)}>
      <section className="min-h-0 min-w-0 flex-1">{children}</section>

      <AnimatePresence initial={false}>
        {currentNode ? (
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
    </div>
  )
}
