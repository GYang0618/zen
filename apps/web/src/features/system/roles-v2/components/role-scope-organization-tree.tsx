import {
  Badge,
  Button,
  Checkbox,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label
} from '@zen/ui'
import { ChevronRight, Folder, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  getOrganizationTypeLabel,
  organizationIconConfig
} from '@/features/system/organization-v2/data/data'

import type { Organization } from '@/features/system/organization-v2/type'

const TREE_INDENT_PX = 12

interface RoleScopeOrganizationTreeProps {
  tree: Organization[]
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

interface TreeNodeProps {
  node: Organization
  depth: number
  selectedIds: Set<string>
  expandedIds: Set<string>
  disabled: boolean
  onToggleExpanded: (id: string) => void
  onToggleChecked: (id: string, checked: boolean) => void
}

function collectExpandableIds(nodes: Organization[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.children?.length ? [node.id] : []),
    ...collectExpandableIds(node.children ?? [])
  ])
}

function filterOrganizationTreeByName(nodes: Organization[], keyword: string): Organization[] {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return nodes

  const filterNode = (node: Organization): Organization | null => {
    const children = (node.children ?? [])
      .map(filterNode)
      .filter((child): child is Organization => child !== null)
    const selfMatch = node.name.toLowerCase().includes(normalized)
    if (!selfMatch && children.length === 0) return null
    return { ...node, children }
  }

  return nodes.map(filterNode).filter((node): node is Organization => node !== null)
}

function TreeNode({
  node,
  depth,
  selectedIds,
  expandedIds,
  disabled,
  onToggleExpanded,
  onToggleChecked
}: TreeNodeProps) {
  const children = node.children ?? []
  const hasChildren = children.length > 0
  const expanded = expandedIds.has(node.id)
  const checked = selectedIds.has(node.id)
  const checkboxId = `role-scope-org-${node.id}`
  const config = organizationIconConfig[(node.type || '').toUpperCase()] ?? {
    icon: Folder,
    defaultColor: 'text-muted-foreground'
  }
  const Icon = config.icon

  return (
    <div className="flex flex-col gap-0.5">
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors',
          checked ? 'bg-primary/5' : 'hover:bg-muted/50'
        )}
        style={{ paddingInlineStart: 8 + depth * TREE_INDENT_PX }}
      >
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={expanded ? `收起${node.name}` : `展开${node.name}`}
            className="shrink-0"
            disabled={disabled}
            onClick={() => onToggleExpanded(node.id)}
          >
            <ChevronRight className={cn('transition-transform', expanded && 'rotate-90')} />
          </Button>
        ) : (
          <span className="inline-block size-6 shrink-0" aria-hidden />
        )}

        <Checkbox
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) => onToggleChecked(node.id, next === true)}
        />

        <Label
          htmlFor={checkboxId}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 font-normal"
        >
          <Icon className={cn('size-4 shrink-0', config.defaultColor)} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm">{node.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {getOrganizationTypeLabel(node.type)}
          </span>
        </Label>
      </div>

      {hasChildren && expanded
        ? children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              disabled={disabled}
              onToggleExpanded={onToggleExpanded}
              onToggleChecked={onToggleChecked}
            />
          ))
        : null}
    </div>
  )
}

export function RoleScopeOrganizationTree({
  tree,
  value,
  onChange,
  disabled = false
}: RoleScopeOrganizationTreeProps) {
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(tree.filter((node) => (node.children?.length ?? 0) > 0).map((node) => node.id))
  )

  const displayTree = useMemo(() => filterOrganizationTreeByName(tree, query), [query, tree])
  const selectedIds = useMemo(() => new Set(value), [value])

  const effectiveExpandedIds = useMemo(() => {
    if (query.trim()) return new Set(collectExpandableIds(displayTree))
    return expandedIds
  }, [displayTree, expandedIds, query])

  const handleToggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleChecked = (id: string, checked: boolean) => {
    if (disabled) return
    if (checked) {
      onChange([...value, id])
      return
    }
    onChange(value.filter((item) => item !== id))
  }

  if (tree.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无组织可选择</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">自定义组织范围</p>
          <p className="text-xs text-muted-foreground">勾选该角色可访问的组织节点</p>
        </div>
        <Badge variant="secondary">{value.length} 已选</Badge>
      </div>

      <div className="rounded-2xl border">
        <div className="p-4 pb-2">
          <InputGroup>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={disabled}
              placeholder="搜索组织名称"
              aria-label="搜索组织名称"
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex flex-col gap-0.5 p-2">
          {displayTree.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">没有找到匹配组织</p>
          ) : (
            displayTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedIds={selectedIds}
                expandedIds={effectiveExpandedIds}
                disabled={disabled}
                onToggleExpanded={handleToggleExpanded}
                onToggleChecked={handleToggleChecked}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
