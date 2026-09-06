'use client'

import { Separator as SeparatorPrimitive } from '@zen/ui/lib/base-ui-primitives'
import { cn } from '@zen/ui/lib/utils'

import type * as React from 'react'

function Separator({
  className,
  orientation = 'horizontal',
  decorative: _decorative,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  decorative?: boolean
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-center',
        className
      )}
      {...props}
    />
  )
}

export { Separator }
