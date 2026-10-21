import { cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@zen/ui'
import { useLayoutEffect, useRef, useState } from 'react'

import type { ReactNode } from 'react'

export type OverflowTooltipSide = 'top' | 'right' | 'bottom' | 'left'

interface OverflowTextProps {
  children: ReactNode
  className?: string
  content?: ReactNode
  lines?: 1 | 2
  side?: OverflowTooltipSide
}

const LINE_CLASS = {
  1: 'truncate',
  2: 'line-clamp-2 whitespace-pre-line wrap-anywhere'
} as const

function isOverflowing(node: HTMLElement) {
  return node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1
}

/**
 * 按所在容器宽度截断文本。只有实际溢出时才打开悬浮层，全文放在 content。
 */
export function OverflowText({
  children,
  className,
  content,
  lines = 1,
  side = 'top'
}: OverflowTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(false)
  const [open, setOpen] = useState(false)
  const contentKey =
    typeof children === 'string' || typeof children === 'number' ? String(children) : lines

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const update = () => {
      setOverflow(contentKey !== '' && isOverflowing(node))
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [contentKey])

  const text = (
    <span ref={ref} className={cn('block min-w-0 max-w-full', LINE_CLASS[lines], className)}>
      {children}
    </span>
  )

  return (
    <TooltipProvider delay={200}>
      <Tooltip open={overflow && open} onOpenChange={setOpen}>
        <TooltipTrigger render={text} />
        <TooltipContent side={side} className="max-w-xs whitespace-pre-wrap text-left">
          {content ?? children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
