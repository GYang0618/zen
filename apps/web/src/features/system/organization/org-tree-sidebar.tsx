import { PermissionCode } from '@zen/shared'
import { Button, cn, Input, ScrollArea, Skeleton } from '@zen/ui'
import { Building2, ChevronRight, ChevronsDown, ChevronsUp, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Can } from '@/components/auth/can'
import { EmptyState } from '@/features/system/config/components'

import { collectExpandableIds } from './utils'

import type { OrganizationTreeNode } from '@zen/shared'

type OrgTreeSidebarProps = {
  tree: OrganizationTreeNode[]
  selectedId: string | null
  keyword?: string
  isLoading?: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onKeywordChange?: (value: string) => void
}

function OrgTreeNode({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect
}: {
  node: OrganizationTreeNode
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const hasChildren = node.children.length > 0
  const expanded = expandedIds.has(node.id)
  const selected = selectedId === node.id

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between gap-1 rounded-md pe-2 transition-colors',
          selected
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          depth >= 2 && 'text-xs'
        )}
        style={{ paddingInlineStart: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-muted disabled:opacity-40"
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
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2 text-left text-sm"
          onClick={() => onSelect(node.id)}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Building2 className="size-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{node.name}</span>
          </span>
          <span
            className={cn(
              'shrink-0 text-xs',
              selected
                ? 'rounded border border-border bg-card px-1.5 py-0.5 text-muted-foreground'
                : ''
            )}
          >
            {node.memberCount}人
          </span>
        </button>
      </div>

      {hasChildren && expanded
        ? node.children.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  )
}

export function OrgTreeSidebar({
  tree,
  selectedId,
  keyword = '',
  isLoading = false,
  onSelect,
  onCreate,
  onKeywordChange
}: OrgTreeSidebarProps) {
  const allExpandableIds = useMemo(() => collectExpandableIds(tree), [tree])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allExpandableIds))

  useEffect(() => {
    setExpandedIds(new Set(allExpandableIds))
  }, [allExpandableIds])

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside className="flex max-h-[min(50vh,28rem)] min-h-0 flex-col overflow-hidden rounded-xl border bg-card lg:max-h-[calc(100svh-12rem)]">
      <div className="space-y-3 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            组织架构图谱
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="展开全部"
              aria-label="展开全部"
              onClick={() => setExpandedIds(new Set(allExpandableIds))}
            >
              <ChevronsDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="折叠全部"
              aria-label="折叠全部"
              onClick={() => setExpandedIds(new Set())}
            >
              <ChevronsUp className="size-4" />
            </Button>
            <Can permission={PermissionCode.ORG_CREATE}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="新建部门"
                aria-label="新建部门"
                onClick={onCreate}
              >
                <Plus className="size-4" />
              </Button>
            </Can>
          </div>
        </div>

        {onKeywordChange ? (
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="按名称 / 编码过滤..."
              className="h-8 ps-8 text-xs"
              aria-label="搜索组织"
            />
          </div>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-0.5 p-3">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-5/6" />
              <Skeleton className="h-9 w-4/6" />
            </div>
          ) : tree.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="暂无组织"
              description="请先创建根节点，再挂载下级部门"
              compact
              action={
                <Can permission={PermissionCode.ORG_CREATE}>
                  <Button size="sm" onClick={onCreate}>
                    <Plus data-icon="inline-start" />
                    创建根组织
                  </Button>
                </Can>
              }
            />
          ) : (
            tree.map((node) => (
              <OrgTreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
