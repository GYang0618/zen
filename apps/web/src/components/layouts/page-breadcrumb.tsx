import { Link, useMatches } from '@tanstack/react-router'
import { cn } from '@zen/ui'
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

import type { RouterMeta } from '@/types/router'

type BreadcrumbItem = {
  title: string
  path: string
}

function collectBreadcrumbs(
  matches: ReturnType<typeof useMatches>
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = []

  for (const match of matches) {
    const meta = match.staticData as RouterMeta | undefined
    if (!meta?.title || meta.hideInBreadcrumb) continue
    items.push({
      title: meta.title,
      path: match.pathname
    })
  }

  return items
}

export function PageBreadcrumb({ className }: { className?: string }) {
  const matches = useMatches()
  const items = collectBreadcrumbs(matches)

  if (items.length === 0) return null

  return (
    <nav aria-label="面包屑" className={cn('flex items-center gap-1.5 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <Fragment key={`${item.path}-${item.title}`}>
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            {isLast ? (
              <span className="truncate font-medium text-foreground">{item.title}</span>
            ) : (
              <Link
                to={item.path}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
