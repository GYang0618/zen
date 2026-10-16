import { ScrollArea as BaseScrollArea, cn } from '@zen/ui'

import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface A2uiScrollAreaProps {
  children?: string[]
  maxHeight?: number | string
  scrollbars?: 'vertical' | 'horizontal' | 'both' | 'none'
  className?: string
}

export function ScrollArea({ props, children }: RendererProps<A2uiScrollAreaProps>) {
  const { children: childIds = [], maxHeight = 320, scrollbars = 'vertical', className } = props

  const style = maxHeight
    ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
    : undefined

  return (
    <BaseScrollArea
      scrollbars={scrollbars}
      style={style}
      className={cn('w-full rounded-md border p-2', className)}
    >
      <div className="flex flex-col gap-2">
        {childIds.map((id) => (
          <div key={id} className="w-full">
            {children(id)}
          </div>
        ))}
      </div>
    </BaseScrollArea>
  )
}
