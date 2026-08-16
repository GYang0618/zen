import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@zen/ui'
import { Ban, ChevronRight, ChevronsUpDown, Folder } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getOrganizationTypeLabel, organizationIconConfig } from '../data/data'
import {
  collectExpandableIds,
  filterOrganizationTreeByName,
  findOrganization,
  pruneOrganizationTree
} from '../utils'

import type { Organization } from '../type'

const TREE_INDENT_PX = 12

interface OrganizationParentSelectProps {
  id?: string
  value: string
  onValueChange: (id: string) => void
  tree: Organization[]
  excludeIds?: ReadonlySet<string>
  selectableIds?: ReadonlySet<string>
  'aria-invalid'?: boolean
}

interface ParentTreeNodeProps {
  node: Organization
  depth: number
  value: string
  expandedIds: Set<string>
  selectableIds?: ReadonlySet<string>
  canToggleExpanded: boolean
  onToggleExpanded: (id: string) => void
  onSelect: (id: string) => void
}

function ParentTreeNode({
  node,
  depth,
  value,
  expandedIds,
  selectableIds,
  canToggleExpanded,
  onToggleExpanded,
  onSelect
}: ParentTreeNodeProps) {
  const children = node.children ?? []
  const hasChildren = children.length > 0
  const expanded = expandedIds.has(node.id)
  const selected = value === node.id
  const disabled = selectableIds ? !selectableIds.has(node.id) : false
  const config = organizationIconConfig[(node.type || '').toUpperCase()] ?? {
    icon: Folder,
    defaultColor: 'text-muted-foreground'
  }
  const Icon = config.icon

  return (
    <>
      <CommandItem
        value={`${node.name} ${node.id}`}
        disabled={disabled}
        data-checked={selected || undefined}
        className="rounded-lg"
        onSelect={() => {
          if (disabled) return
          onSelect(node.id)
        }}
        style={{ paddingInlineStart: 8 + depth * TREE_INDENT_PX }}
      >
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={expanded ? `收起${node.name}` : `展开${node.name}`}
            className="shrink-0"
            disabled={!canToggleExpanded}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (!canToggleExpanded) return
              onToggleExpanded(node.id)
            }}
          >
            <ChevronRight className={cn('transition-transform', expanded && 'rotate-90')} />
          </Button>
        ) : (
          <span className="inline-block size-6 shrink-0" aria-hidden />
        )}
        <Icon className={cn('shrink-0', config.defaultColor)} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{node.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {getOrganizationTypeLabel(node.type)}
          </p>
        </div>
      </CommandItem>
      {hasChildren && expanded
        ? children.map((child) => (
            <ParentTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              value={value}
              expandedIds={expandedIds}
              selectableIds={selectableIds}
              canToggleExpanded={canToggleExpanded}
              onToggleExpanded={onToggleExpanded}
              onSelect={onSelect}
            />
          ))
        : null}
    </>
  )
}

export function OrganizationParentSelect({
  id,
  value,
  onValueChange,
  tree,
  excludeIds,
  selectableIds,
  'aria-invalid': ariaInvalid
}: OrganizationParentSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(() => new Set())

  const displayTree = useMemo(() => {
    const pruned = excludeIds?.size ? pruneOrganizationTree(tree, excludeIds) : tree
    return filterOrganizationTreeByName(pruned, query)
  }, [excludeIds, query, tree])

  const expandedIds = useMemo(() => {
    if (query.trim()) return new Set(collectExpandableIds(displayTree))
    return manualExpandedIds
  }, [displayTree, manualExpandedIds, query])

  const selected = findOrganization(tree, value)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      const rootExpandableIds = tree
        .filter((node) => (node.children?.length ?? 0) > 0)
        .map((node) => node.id)
      setManualExpandedIds(new Set(rootExpandableIds))
      return
    }
    setQuery('')
  }

  const handleToggleExpanded = (nodeId: string) => {
    setManualExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const handleSelect = (nextId: string) => {
    onValueChange(nextId)
    setOpen(false)
    setQuery('')
  }

  const showRootOption = !query.trim()

  return (
    <Popover modal open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name}
              <span className="text-muted-foreground">
                {' '}
                · {getOrganizationTypeLabel(selected.type)}
              </span>
            </span>
          ) : (
            <span className="truncate">
              无（根节点）
              <span className="text-muted-foreground"> · 独立根节点</span>
            </span>
          )}
          <ChevronsUpDown data-icon="inline-end" className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="搜索组织名称" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>没有找到匹配组织</CommandEmpty>
            {showRootOption ? (
              <CommandGroup>
                <CommandItem
                  value="__root__ 无 根节点"
                  data-checked={value === '' || undefined}
                  className="rounded-lg"
                  onSelect={() => handleSelect('')}
                >
                  <span className="inline-flex size-6 shrink-0 items-center justify-center">
                    <Ban className="text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">无（根节点）</p>
                    <p className="truncate text-xs text-muted-foreground">新建为独立根节点</p>
                  </div>
                </CommandItem>
              </CommandGroup>
            ) : null}
            {displayTree.length > 0 ? (
              <CommandGroup>
                {displayTree.map((node) => (
                  <ParentTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    value={value}
                    expandedIds={expandedIds}
                    selectableIds={selectableIds}
                    canToggleExpanded={!query.trim()}
                    onToggleExpanded={handleToggleExpanded}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
