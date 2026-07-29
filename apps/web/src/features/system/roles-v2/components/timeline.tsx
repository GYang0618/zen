import { cn } from '@zen/ui'

import type { ReactNode } from 'react'

export type TimelineItem = {
  title: string
  description: ReactNode
  timestamp: string
  active?: boolean
}

type TimelineProps = {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isActive = item.active ?? index === 0

        return (
          <div key={`${item.title}-${index}`} className="grid grid-cols-[24px_1fr] gap-3">
            <div className="relative flex justify-center pt-1.5">
              <span
                className={cn(
                  'size-2.5 rounded-full',
                  isActive ? 'bg-foreground' : 'bg-muted-foreground/40'
                )}
              />
              {!isLast ? <span className="bg-border absolute top-5 -bottom-5.5 w-px" /> : null}
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <span className="text-muted-foreground shrink-0 text-xs">{item.timestamp}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm leading-6">{item.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
