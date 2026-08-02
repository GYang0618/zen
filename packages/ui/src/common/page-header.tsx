import { cn } from '@zen/ui/lib/utils'
import { cva } from 'class-variance-authority'

import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'

function PageHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="page-header" className={cn('flex items-start gap-4', className)} {...props} />
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
      className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}
      {...props}
    />
  )
}

const pageHeaderTitleVariants = cva('tracking-tight text-foreground', {
  variants: {
    size: {
      sm: 'text-lg font-semibold',
      default: 'text-2xl font-bold',
      lg: 'text-3xl font-medium'
    }
  },
  defaultVariants: {
    size: 'default'
  }
})

function PageHeaderTitle({
  className,
  size = 'default',
  as: Comp = 'h2',
  ...props
}: React.ComponentProps<'h2'> &
  VariantProps<typeof pageHeaderTitleVariants> & {
    as?: 'h1' | 'h2' | 'h3'
  }) {
  return (
    <Comp
      data-slot="page-header-title"
      data-size={size}
      className={cn(pageHeaderTitleVariants({ size }), className)}
      {...props}
    />
  )
}

function PageHeaderDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="page-header-description"
      className={cn('text-muted-foreground', className)}
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
