import { Link } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@zen/ui'
import {
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderKanban,
  GitBranch,
  GripVertical,
  Landmark,
  Network,
  Plus,
  Search,
  Settings2,
  UsersRound
} from 'lucide-react'
import { useMemo, useState } from 'react'

import type { LucideIcon } from 'lucide-react'
import type { DragEvent } from 'react'
import type { OrganizationIcon, OrganizationNode } from '../data'

type OrganizationTreeProps = {
  root: OrganizationNode
  activeId: string | null
  onCreate: (parentId?: string) => void
  onMove: (nodeId: string, parentId: string) => boolean
  onSelect: (nodeId: string) => void
}

const typeIcons: Record<string, LucideIcon> = {
  集团: Landmark,
  事业群: Network,
  业务中心: Building2,
  职能中心: Building2,
  分公司: GitBranch,
  部门: BriefcaseBusiness,
  项目组: FolderKanban,
  小组: UsersRound
}

const configuredIcons: Record<OrganizationIcon, LucideIcon> = {
  landmark: Landmark,
  network: Network,
  building: Building2,
  branch: GitBranch,
  briefcase: BriefcaseBusiness,
  project: FolderKanban,
  users: UsersRound
}

function nodeIcon(node: OrganizationNode) {
  return (node.icon && configuredIcons[node.icon]) || typeIcons[node.type] || Building2
}

function filterOrganizationTree(node: OrganizationNode, query: string): OrganizationNode | null {
  const children = (node.children ?? [])
    .map((child) => filterOrganizationTree(child, query))
    .filter((child): child is OrganizationNode => child !== null)

  if (node.name.includes(query) || node.type.includes(query) || children.length > 0) {
    return { ...node, children }
  }

  return null
}

function collectExpandableIds(node: OrganizationNode): string[] {
  return [
    ...(node.children?.length ? [node.id] : []),
    ...(node.children ?? []).flatMap(collectExpandableIds)
  ]
}

type TreeNodeProps = {
  node: OrganizationNode
  activeId: string | null
  depth?: number
  expandedIds: Set<string>
  searching: boolean
  draggedId: string | null
  dropTargetId: string | null
  onExpandedChange: (id: string, open: boolean) => void
  onMove: (nodeId: string, parentId: string) => boolean
  onSelect: (nodeId: string) => void
  onDragStateChange: (draggedId: string | null, dropTargetId?: string | null) => void
}

function TreeNode({
  node,
  activeId,
  depth = 0,
  expandedIds,
  searching,
  draggedId,
  dropTargetId,
  onExpandedChange,
  onMove,
  onSelect,
  onDragStateChange
}: TreeNodeProps) {
  const hasChildren = Boolean(node.children?.length)
  const open = searching || expandedIds.has(node.id)
  const Icon = nodeIcon(node)

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/x-organization-id', node.id)
    onDragStateChange(node.id)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const sourceId = event.dataTransfer.getData('application/x-organization-id') || draggedId
    if (sourceId && sourceId !== node.id) onMove(sourceId, node.id)
    onDragStateChange(null, null)
  }

  return (
    <Collapsible open={open} onOpenChange={(value) => onExpandedChange(node.id, value)}>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'group flex min-w-0 items-center gap-1 rounded-lg border border-transparent px-2 py-1.5 transition-colors',
          'hover:bg-muted/50',
          draggedId === node.id && 'opacity-45',
          dropTargetId === node.id && 'border-primary bg-primary/5',
          activeId === node.id && 'border-primary/40 bg-primary/10'
        )}
        onClick={() => onSelect(node.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect(node.id)
          }
        }}
        onDragOver={(event) => {
          if (draggedId && draggedId !== node.id) {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
            onDragStateChange(draggedId, node.id)
          }
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            onDragStateChange(draggedId, null)
          }
        }}
        onDrop={handleDrop}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              aria-label={open ? `收起${node.name}` : `展开${node.name}`}
              onClick={(event) => event.stopPropagation()}
            >
              <ChevronRight
                className={cn('transition-transform duration-200 ease-out', open && 'rotate-90')}
              />
            </Button>
          </CollapsibleTrigger>
        ) : (
          <span className="size-6 shrink-0" />
        )}
        <div
          className="flex min-w-0 flex-1 items-center gap-3"
          style={{ paddingLeft: `${depth * 14}px` }}
        >
          <button
            type="button"
            draggable={node.id !== 'zen'}
            onDragStart={handleDragStart}
            onDragEnd={() => onDragStateChange(null, null)}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors',
              node.id !== 'zen' &&
                'cursor-grab hover:bg-primary/10 hover:text-primary active:cursor-grabbing'
            )}
            aria-label={node.id === 'zen' ? `${node.name}不可移动` : `拖动${node.name}`}
          >
            <Icon className="size-4 group-hover:hidden" />
            <GripVertical className="hidden size-4 group-hover:block" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{node.name}</span>
              <Badge variant="secondary" className="shrink-0">
                {node.memberCount} 人
              </Badge>
            </div>
            <div className="truncate text-xs text-muted-foreground">{node.type}</div>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`进入${node.name}详情`} asChild>
              <Link
                to="/system/organization-v2/$id"
                params={{ id: node.id }}
                onClick={(event) => event.stopPropagation()}
              >
                <Settings2 />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">进入组织详情</TooltipContent>
        </Tooltip>
      </div>
      {hasChildren && (
        <CollapsibleContent className="CollapsibleContent flex flex-col gap-1">
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              depth={depth + 1}
              expandedIds={expandedIds}
              searching={searching}
              draggedId={draggedId}
              dropTargetId={dropTargetId}
              onExpandedChange={onExpandedChange}
              onMove={onMove}
              onSelect={onSelect}
              onDragStateChange={onDragStateChange}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export function OrganizationTree({
  root,
  activeId,
  onCreate,
  onMove,
  onSelect
}: OrganizationTreeProps) {
  const expandableIds = useMemo(() => collectExpandableIds(root), [root])
  const [expandedIds, setExpandedIds] = useState(() => new Set(expandableIds))
  const [query, setQuery] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const visibleRoot = useMemo(() => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) return root
    return filterOrganizationTree(root, normalizedQuery)
  }, [query, root])

  const setDragState = (nextDraggedId: string | null, nextDropTargetId: string | null = null) => {
    setDraggedId(nextDraggedId)
    setDropTargetId(nextDropTargetId)
  }

  return (
    <TooltipProvider>
      <Card className="h-fit rounded-lg">
        <CardHeader className="gap-3 border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 />
              </span>
              组织架构
            </CardTitle>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExpandedIds(new Set(expandableIds))}
                    aria-label="全部展开"
                  >
                    <ChevronsUpDown />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全部展开</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExpandedIds(new Set())}
                    aria-label="全部折叠"
                  >
                    <ChevronsDownUp />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全部折叠</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onCreate()}
                    aria-label="新增组织"
                  >
                    <Plus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>新增组织</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <InputGroup>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索组织名称或类型"
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </CardHeader>
        <CardContent className="p-2 pt-3">
          {visibleRoot ? (
            <TreeNode
              node={visibleRoot}
              activeId={activeId}
              expandedIds={expandedIds}
              searching={Boolean(query.trim())}
              draggedId={draggedId}
              dropTargetId={dropTargetId}
              onExpandedChange={(id, open) => {
                setExpandedIds((current) => {
                  const next = new Set(current)
                  if (open) next.add(id)
                  else next.delete(id)
                  return next
                })
              }}
              onMove={onMove}
              onSelect={onSelect}
              onDragStateChange={setDragState}
            />
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              没有找到匹配的组织
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
