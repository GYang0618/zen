import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/react'
import { Link } from '@tanstack/react-router'
import { PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import {
  Ban,
  ChevronRightIcon,
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  Settings,
  Trash2
} from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Can } from '@/components/auth/can'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { useOrganizations } from '../organizations-provider'
import { useOrganizationTypeCatalog } from '../queries'
import {
  collectExpandableIds,
  collectExpandedIdsToDepth,
  DEFAULT_ORGANIZATION_TREE_EXPAND_DEPTH,
  findOrganization,
  getOrganizationDropRejectionMessage,
  validateOrganizationDrop
} from '../utils'
import { OrganizationTypeIcon } from './organization-icon'

import type { DragEndEvent, DragOverEvent } from '@dnd-kit/react'
import type { Organization } from '../type'

interface TreeNodePreviewProps {
  data: Organization
  className?: string
  /** 当前指针下没有可放置的合法目标，用于提示「无法放置」 */
  isBlocked?: boolean
}

function TreeNodePreview({ data, className, isBlocked }: TreeNodePreviewProps) {
  const { getLabel } = useOrganizationTypeCatalog()
  const { name, type, memberCount } = data

  return (
    <Item
      size="xs"
      className={cn(
        'my-0.5 border-primary/40 bg-muted/80 px-2 py-1.5 shadow-md',
        isBlocked ? 'cursor-not-allowed border-destructive/40' : 'cursor-grabbing',
        className
      )}
    >
      <ItemMedia>
        <div className="flex size-7 items-center justify-center text-muted-foreground/50">
          {isBlocked ? (
            <Ban className="size-4 text-destructive" />
          ) : (
            <GripVertical className="size-4" />
          )}
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <OrganizationTypeIcon type={type} />
        </div>
      </ItemMedia>
      <ItemContent className="gap-0">
        <ItemTitle>{name}</ItemTitle>
        <ItemDescription className="text-xs">{getLabel(type)}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge className="bg-muted text-muted-foreground">{memberCount}人</Badge>
      </ItemActions>
    </Item>
  )
}

interface TreeNodeProps {
  data: Organization
  expandedIds: Set<string>
  onExpandedChange: (id: string, open: boolean) => void
  onSelect?: (node: Organization) => void
  onDelete: (node: Organization) => void
  isDragging: boolean
  dragOverId: string | null
  /** 校验某个正在拖拽的组织是否允许放置到当前节点，用于在碰撞检测阶段直接拒绝非法目标 */
  canAcceptDraggable: (activeId: string, overId: string) => boolean
}

function TreeNode({
  data,
  expandedIds,
  onExpandedChange,
  onSelect,
  onDelete,
  isDragging,
  dragOverId,
  canAcceptDraggable
}: TreeNodeProps) {
  const { getLabel } = useOrganizationTypeCatalog()
  const { id, name, type, memberCount, children } = data
  const hasChildren = Boolean(children?.length)
  const { currentNode } = useOrganizations()
  const open = expandedIds.has(id)
  const isSelected = currentNode?.id === id

  const { isDragSource, handleRef, ref: draggableRef } = useDraggable({ id })
  const { isDropTarget, ref: droppableRef } = useDroppable({
    id,
    accept: (source) => {
      const sourceId = String(source.id)
      return sourceId !== id && canAcceptDraggable(sourceId, id)
    }
  })
  const setNodeRef = useCallback(
    (element: HTMLDivElement | null) => {
      draggableRef(element)
      droppableRef(element)
    },
    [draggableRef, droppableRef]
  )

  const canAcceptDrop = isDragging && isDropTarget && dragOverId === id
  const deleteBlockReason = hasChildren
    ? '请先删除或迁移下级组织'
    : memberCount > 0
      ? '请先移除当前组织成员'
      : data.positionCount > 0
        ? '请先解除当前组织岗位'
        : null

  return (
    <Collapsible
      open={hasChildren ? open : undefined}
      onOpenChange={hasChildren ? (nextOpen) => onExpandedChange(id, nextOpen) : undefined}
    >
      <div
        ref={setNodeRef}
        className={cn(
          'rounded-lg transition-colors',
          isDragSource && 'opacity-40',
          canAcceptDrop && !isDragSource && 'bg-primary/5 ring-1 ring-primary/30'
        )}
      >
        <Item
          size="xs"
          className={cn(
            'group/item my-0.5 px-2 py-1.5 hover:bg-muted/50',
            isSelected && 'border-muted bg-muted/50'
          )}
          onClick={() => onSelect?.(data)}
        >
          <ItemMedia>
            <Button
              type="button"
              variant="ghost"
              ref={handleRef}
              className="size-7 cursor-grab text-muted-foreground/50 opacity-0 transition-opacity duration-200 hover:cursor-grab hover:text-muted-foreground active:cursor-grabbing group-hover/item:opacity-100"
              aria-label={`拖动${name}`}
              onClick={(event) => event.stopPropagation()}
            >
              <GripVertical />
            </Button>

            {hasChildren ? (
              <CollapsibleTrigger
                render={
                  <Button
                    variant="ghost"
                    className="group size-7"
                    onClick={(event) => event.stopPropagation()}
                    aria-label={open ? `收起${name}` : `展开${name}`}
                  />
                }
              >
                <ChevronRightIcon className="transition-transform in-data-panel-open:rotate-90" />
              </CollapsibleTrigger>
            ) : null}
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <OrganizationTypeIcon type={type} />
            </div>
          </ItemMedia>
          <ItemContent className="gap-0">
            <ItemTitle>{name}</ItemTitle>
            <ItemDescription className="text-xs">{getLabel(type)}</ItemDescription>
          </ItemContent>

          <ItemActions>
            <Badge className="bg-muted text-muted-foreground">{memberCount}人</Badge>
            <Separator
              className="h-3 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100"
              orientation="vertical"
            />
            <div className="flex items-center">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="配置"
                      className="pointer-events-none opacity-0 transition-opacity duration-200 group-hover/item:pointer-events-auto group-hover/item:opacity-100"
                      nativeButton={false}
                      render={
                        <Link
                          to="/system/organization/$id"
                          params={{ id }}
                          onClick={(event) => event.stopPropagation()}
                        />
                      }
                    />
                  }
                >
                  <Settings />
                </TooltipTrigger>
                <TooltipContent>配置</TooltipContent>
              </Tooltip>
              <Can permission={PermissionCode.ORG_DELETE}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`删除${name}`}
                        disabled={Boolean(deleteBlockReason)}
                        className="pointer-events-none text-destructive opacity-0 transition-opacity duration-200 hover:text-destructive group-hover/item:pointer-events-auto group-hover/item:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete(data)
                        }}
                      />
                    }
                  >
                    <Trash2 data-icon="inline-start" />
                  </TooltipTrigger>
                  <TooltipContent>{deleteBlockReason ?? '删除组织'}</TooltipContent>
                </Tooltip>
              </Can>
            </div>
          </ItemActions>
        </Item>
      </div>

      {hasChildren ? (
        <CollapsibleContent className="ml-9">
          <div className="flex flex-col gap-1">
            {children?.map((child) => (
              <TreeNode
                data={child}
                key={child.id}
                expandedIds={expandedIds}
                onExpandedChange={onExpandedChange}
                onSelect={onSelect}
                onDelete={onDelete}
                isDragging={isDragging}
                dragOverId={dragOverId}
                canAcceptDraggable={canAcceptDraggable}
              />
            ))}
          </div>
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}

export function OrganizationTree() {
  const {
    currentNode,
    setCurrentNode,
    organizations,
    deleteOrganization,
    moveOrganization,
    isLoading
  } = useOrganizations()
  const { catalog } = useOrganizationTypeCatalog()
  const expandableIds = useMemo(() => collectExpandableIds(organizations), [organizations])
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(collectExpandedIdsToDepth(organizations, DEFAULT_ORGANIZATION_TREE_EXPAND_DEPTH))
  )
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const organizationsSnapshotRef = useRef(organizations)
  // 拖拽结束后浏览器可能仍会触发一次 click，从而误选中。
  // 用“时间窗”来吞掉这类误触发，避免依赖 setTimeout(0) 的不稳定时序。
  const suppressSelectUntilRef = useRef<number>(0)

  // 拖拽起始时固定树快照，保证整个操作使用一致的层级校验依据。
  const canAcceptOrganizationDrop = useCallback(
    (activeId: string, overId: string) =>
      validateOrganizationDrop(organizationsSnapshotRef.current, activeId, overId).isValid,
    []
  )

  const handleExpandedChange = (id: string, nextOpen: boolean) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (nextOpen) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const resetDragState = () => {
    setIsDragging(false)
    setDragOverId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const snapshot = organizationsSnapshotRef.current
    resetDragState()
    // 给一个足够小但稳定的窗口，覆盖“拖拽 mouseup -> click”的延迟链路
    suppressSelectUntilRef.current = Date.now() + 1000

    if (event.canceled) return

    const { source, target } = event.operation
    if (!source || !target) return

    const activeId = String(source.id)
    const overId = String(target.id)
    const validation = validateOrganizationDrop(snapshot, activeId, overId)

    if (!validation.isValid) {
      if (validation.reason !== 'same-organization') {
        toast.error(
          getOrganizationDropRejectionMessage(
            snapshot,
            activeId,
            overId,
            validation.reason,
            catalog
          )
        )
      }
      return
    }

    void moveOrganization(activeId, overId).then((moved) => {
      if (moved) {
        const { destinationParentId } = validation
        setExpandedIds((current) => {
          const next = new Set(current)
          next.add(destinationParentId)
          return next
        })
      }
    })
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation
    if (!source || !target) {
      setDragOverId(null)
      return
    }

    const activeId = String(source.id)
    const overId = String(target.id)
    const snapshot = organizationsSnapshotRef.current
    const validation = validateOrganizationDrop(snapshot, activeId, overId)
    setDragOverId(validation.isValid ? overId : null)
  }

  const handleDelete = async () => {
    const target = deleteTarget
    if (!target || isDeleting) return

    setIsDeleting(true)
    try {
      await deleteOrganization(target.id)
      if (currentNode?.id === target.id) {
        setCurrentNode(null)
      }
      setDeleteTarget(null)
    } catch {
      // 删除失败已由 mutation 提示，保持确认框打开以便用户查看并处理阻塞条件。
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="flex h-full min-h-0 flex-col py-3">
      <CardHeader>
        <CardTitle>组织架构树</CardTitle>
        <CardAction>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="全部展开"
                  onClick={() => setExpandedIds(new Set(expandableIds))}
                />
              }
            >
              <ChevronsUpDown />
            </TooltipTrigger>
            <TooltipContent>全部展开</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="全部收起"
                  onClick={() => setExpandedIds(new Set())}
                />
              }
            >
              <ChevronsDownUp />
            </TooltipTrigger>
            <TooltipContent>全部收起</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">加载组织树…</p>
        ) : organizations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            暂无组织，请先创建根组织
          </p>
        ) : (
          <DragDropProvider
            onDragStart={(event) => {
              const source = event.operation.source
              if (!source) return
              organizationsSnapshotRef.current = organizations
              setIsDragging(true)
              setDragOverId(null)
              // 拖拽开始后先进入抑制态；拖拽结束时会刷新时间窗
              suppressSelectUntilRef.current = Date.now() + 1000
            }}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {organizations.map((item) => (
              <TreeNode
                data={item}
                key={item.id}
                expandedIds={expandedIds}
                onExpandedChange={handleExpandedChange}
                onDelete={setDeleteTarget}
                isDragging={isDragging}
                dragOverId={dragOverId}
                canAcceptDraggable={canAcceptOrganizationDrop}
                onSelect={(node) => {
                  if (Date.now() < suppressSelectUntilRef.current) return
                  if (node.id === currentNode?.id) {
                    setCurrentNode(null)
                  } else {
                    setCurrentNode(node)
                  }
                }}
              />
            ))}

            <DragOverlay dropAnimation={null}>
              {(source) => {
                const node = findOrganization(organizations, String(source.id))
                return node ? (
                  <TreeNodePreview data={node} isBlocked={isDragging && !dragOverId} />
                ) : null
              }}
            </DragOverlay>
          </DragDropProvider>
        )}
      </CardContent>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
        handleConfirm={() => {
          void handleDelete()
        }}
        isLoading={isDeleting}
        title="删除组织"
        desc={
          <div className="flex flex-col gap-3">
            <p>
              确定要删除组织{' '}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>{' '}
              吗？此操作无法撤销。
            </p>
            <p className="text-sm text-muted-foreground">
              仅可删除没有下级组织、成员和岗位的组织。
            </p>
          </div>
        }
        confirmText="删除"
        cancelBtnText="取消"
        destructive
      />
    </Card>
  )
}
