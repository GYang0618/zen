import { Badge, cn, Skeleton } from '@zen/ui'
import { Building2, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { ReactNode } from 'react'

export type AITreeNode = {
  id: string
  label: string
  description?: string
  badge?: string
  children?: AITreeNode[]
}

export interface AITreeProps {
  nodes: AITreeNode[]
  emptyMessage?: string
  isLoading?: boolean
  defaultExpanded?: boolean
}

function countNodes(nodes: AITreeNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children ?? []), 0)
}

function collectExpandableIds(nodes: AITreeNode[]): string[] {
  const ids: string[] = []
  const walk = (list: AITreeNode[]) => {
    for (const node of list) {
      if ((node.children?.length ?? 0) > 0) {
        ids.push(node.id)
        walk(node.children ?? [])
      }
    }
  }
  walk(nodes)
  return ids
}

function TreeNode({
  node,
  depth,
  expandedIds,
  onToggle
}: {
  node: AITreeNode
  depth: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const children = node.children ?? []
  const hasChildren = children.length > 0
  const expanded = expandedIds.has(node.id)

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md py-1.5 pe-2 text-sm text-foreground',
          depth >= 2 && 'text-xs'
        )}
        style={{ paddingInlineStart: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
          onClick={() => onToggle(node.id)}
          disabled={!hasChildren}
          aria-label={expanded ? '折叠' : '展开'}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn('size-3.5 transition-transform', expanded && 'rotate-90')}
            />
          ) : (
            <span className="inline-block size-3.5" aria-hidden />
          )}
        </button>

        <Building2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{node.label}</span>
        {node.description ? (
          <span className="hidden max-w-28 truncate text-xs text-muted-foreground sm:inline">
            {node.description}
          </span>
        ) : null}
        {node.badge ? (
          <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
            {node.badge}
          </Badge>
        ) : null}
      </div>

      {hasChildren && expanded
        ? children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))
        : null}
    </div>
  )
}

export function AITree({
  nodes,
  emptyMessage = '暂无数据',
  isLoading = false,
  defaultExpanded = true
}: AITreeProps) {
  const expandableIds = useMemo(() => collectExpandableIds(nodes), [nodes])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpanded ? expandableIds : [])
  )

  useEffect(() => {
    setExpandedIds(new Set(defaultExpanded ? expandableIds : []))
  }, [defaultExpanded, expandableIds])

  const total = countNodes(nodes)

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  let body: ReactNode
  if (isLoading) {
    body = (
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-8 w-4/6" />
      </div>
    )
  } else if (nodes.length === 0) {
    body = <div className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>
  } else {
    body = (
      <div className="max-h-80 space-y-0.5 overflow-y-auto p-2">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            onToggle={handleToggle}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">组织树</span>
        <Badge variant="outline" className="font-mono text-[10px]">
          {total}
        </Badge>
      </div>
      {body}
    </div>
  )
}
