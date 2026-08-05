import { cn } from '@zen/ui/lib/utils'
import { createContext, useContext } from 'react'

import type * as React from 'react'

type PageHeaderSize = 'sm' | 'default' | 'lg'

const PAGE_HEADER_TITLE_AS: Record<PageHeaderSize, 'h1' | 'h2' | 'h3'> = {
  sm: 'h3',
  default: 'h2',
  lg: 'h1'
}

const PageHeaderSizeContext = createContext<PageHeaderSize>('default')

function PageHeader({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: PageHeaderSize }) {
  return (
    <PageHeaderSizeContext.Provider value={size}>
      <div
        data-slot="page-header"
        data-size={size}
        className={cn('group/page-header flex items-start gap-4', className)}
        {...props}
      />
    </PageHeaderSizeContext.Provider>
  )
}

function PageHeaderMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-media"
      className={cn(
        "flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg:not([class*='size-'])]:size-6",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-content"
      className={cn('flex  min-w-0 flex-1 flex-col gap-1', className)}
      {...props}
    />
  )
}

function PageHeaderTitle({
  className,
  as,
  ...props
}: React.ComponentProps<'h2'> & {
  as?: 'h1' | 'h2' | 'h3'
}) {
  const size = useContext(PageHeaderSizeContext)
  const Comp = as ?? PAGE_HEADER_TITLE_AS[size]

  return (
    <Comp
      data-slot="page-header-title"
      className={cn(
        'tracking-tight text-foreground',
        'text-2xl font-bold',
        'group-data-[size=sm]/page-header:text-lg group-data-[size=sm]/page-header:font-semibold',
        'group-data-[size=lg]/page-header:text-3xl group-data-[size=lg]/page-header:font-medium',
        className
      )}
      {...props}
    />
  )
}

function PageHeaderDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="page-header-description"
      className={cn(
        'text-base text-muted-foreground',
        'group-data-[size=sm]/page-header:text-sm',
        'group-data-[size=lg]/page-header:text-lg',
        className
      )}
      {...props}
    />
  )
}

function PageHeaderActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}
      {...props}
    />
  )
}

export {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderMedia,
  PageHeaderTitle
}
