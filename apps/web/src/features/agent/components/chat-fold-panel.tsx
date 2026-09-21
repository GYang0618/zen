'use client'

import { Collapsible, CollapsibleTrigger, cn } from '@zen/ui'
import { ChevronRightIcon } from 'lucide-react'

import type { ReactNode } from 'react'

function FoldChevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <ChevronRightIcon
      aria-hidden="true"
      className={cn(
        'block size-3.5 shrink-0 transition-transform',
        open ? 'rotate-90' : 'rotate-0',
        className
      )}
    />
  )
}

interface ChatFoldPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  /** 传入后默认展示该图标，悬停标题时切换为折叠箭头；不传则标题后常驻折叠箭头。 */
  icon?: ReactNode
  /** 跟在标题后的附加内容，不参与折叠图标切换。 */
  trailing?: ReactNode
  children: ReactNode
  className?: string
}

export function ChatFoldPanel({
  open,
  onOpenChange,
  trigger,
  icon,
  trailing,
  children,
  className
}: ChatFoldPanelProps) {
  return (
    <Collapsible className={cn('w-full', className)} open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="group flex w-full items-center overflow-visible text-muted-foreground text-sm leading-none transition-colors hover:text-foreground">
        <span className="inline-flex items-center gap-1.5">
          {icon ? (
            <span className="relative flex size-3.5 shrink-0 -translate-y-px items-center justify-center">
              <span className="flex size-3.5 items-center justify-center transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0">
                {icon}
              </span>
              <FoldChevron
                open={open}
                className="pointer-events-none absolute inset-0 m-auto opacity-0 transition-[opacity,transform] group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </span>
          ) : null}
          {trigger}
          {trailing}
          {icon ? null : <FoldChevron open={open} className="-translate-y-px" />}
        </span>
      </CollapsibleTrigger>
      <div
        className={cn(
          'grid overflow-hidden transition-[grid-template-rows,opacity] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
        inert={!open}
      >
        {/* 展开时去掉 min-h-0，避免 1fr + overflow 把流式增高的内容裁掉 1px */}
        <div className={cn('overflow-hidden', !open && 'min-h-0')}>{children}</div>
      </div>
    </Collapsible>
  )
}
