import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { Link } from '@tanstack/react-router'
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
  Folder,
  GripVertical,
  Settings
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { organizationIconConfig, organizationTypeLabels } from '../data/data'
import { useOrganizations } from '../organizations-provider'
import {
  collectExpandableIds,
  collectExpandedIdsToDepth,
  DEFAULT_ORGANIZATION_TREE_EXPAND_DEPTH,
  findOrganization,
  getOrganizationDropRejectionMessage,
  moveOrganizationInTree,
  validateOrganizationDrop
} from '../utils'
import { OrganizationSideOverview } from './organizations-side-overview'

import type { DragEndEvent, DragOverEvent } from '@dnd-kit/react'
import type { Organization } from '../type'
import type { OrganizationDropValidation } from '../utils'

/** 与 OrganizationSideOverview 的 `w-95` 对齐 */
const SIDE_OVERVIEW_WIDTH = '23.75rem'

const sideOverviewMotion = {
  initial: { width: 0, opacity: 0, marginLeft: 0 },
  animate: { width: SIDE_OVERVIEW_WIDTH, opacity: 1, marginLeft: '1.5rem' },
  exit: { width: 0, opacity: 0, marginLeft: 0 },
  transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const }
}

function renderOrgIcon({ type, className }: { type?: string; className?: string }) {
  const normalizedType = (type || '').toUpperCase()
  const config = organizationIconConfig[normalizedType] ?? {
    icon: Folder,
    defaultColor: 'text-muted-foreground'
  }
  const IconComponent = config.icon

  return (
    <IconComponent
      className={cn('size-4 shrink-0 transition-colors', config.defaultColor, className)}
    />
  )
}

interface TreeNodePreviewProps {
  data: Organization
  className?: string
  /** 当前指针下没有可放置的合法目标，用于提示「无法放置」 */
  isBlocked?: boolean
}

function TreeNodePreview({ data, className, isBlocked }: TreeNodePreviewProps) {
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
          {renderOrgIcon({ type })}
        </div>
      </ItemMedia>
      <ItemContent className="gap-0">
        <ItemTitle>{name}</ItemTitle>
        <ItemDescription className="text-xs">
          {organizationTypeLabels[type] ?? type}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge className="bg-muted text-muted-foreground">{memberCount}人</Badge>
      </ItemActions>
    </Item>
  )
}

interface TreeNodeProps {
  data: Organization
  index: number
  expandedIds: Set<string>
  onExpandedChange: (id: string, open: boolean) => void
  onSelect?: (node: Organization) => void
  activeDragId: string | null
  dragOverId: string | null
  dropValidation: OrganizationDropValidation | null
  /** 校验某个正在拖拽的组织是否允许放置到当前节点，用于在碰撞检测阶段直接拒绝非法目标 */
  canAcceptDraggable: (activeId: string, overId: string) => boolean
}

function TreeNode({
  data,
  index,
  expandedIds,
  onExpandedChange,
  onSelect,
  activeDragId,
  dragOverId,
  dropValidation,
  canAcceptDraggable
}: TreeNodeProps) {
  const { id, name, type, memberCount, children, parentId } = data
  const hasChildren = Boolean(children?.length)
  const { currentNode } = useOrganizations()
  const open = expandedIds.has(id)
  const isSelected = currentNode?.id === id

  // 顶层可能存在多个根组织（如多个集团），因此根节点同样可拖拽以调整彼此间的排序，
  // 具体能否落到某个目标节点由 canAcceptDraggable / validateOrganizationDrop 统一校验
  const { isDragging, isDropTarget, handleRef, ref } = useSortable({
    id,
    index,
    group: parentId ?? 'root',
    // 碰撞检测阶段即拒绝不满足层级规则的目标，避免 dnd-kit 对非法跨组拖放做出真实 DOM 位移
    accept: (source) => {
      const sourceId = String(source.id)
      return sourceId !== id && canAcceptDraggable(sourceId, id)
    },
    transition: { duration: 250, easing: 'ease', idle: true }
  })

  const canAcceptDrop = Boolean(activeDragId) && isDropTarget && dragOverId === id

  return (
    <Collapsible
      open={hasChildren ? open : undefined}
      onOpenChange={hasChildren ? (nextOpen) => onExpandedChange(id, nextOpen) : undefined}
    >
      <div
        ref={ref}
        className={cn(
          'rounded-lg transition-colors',
          isDragging && 'opacity-40',
          canAcceptDrop && !isDragging && 'bg-primary/5 ring-1 ring-primary/30'
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
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="group size-7"
                  onClick={(event) => event.stopPropagation()}
                  aria-label={open ? `收起${name}` : `展开${name}`}
                >
                  <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
                </Button>
              </CollapsibleTrigger>
            ) : null}
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {renderOrgIcon({ type })}
            </div>
          </ItemMedia>
          <ItemContent className="gap-0">
            <ItemTitle>{name}</ItemTitle>
            <ItemDescription className="text-xs">
              {organizationTypeLabels[type] ?? type}
            </ItemDescription>
          </ItemContent>

          <ItemActions>
            <Badge className="bg-muted text-muted-foreground">{memberCount}人</Badge>
            <Separator
              className="h-3 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100"
              orientation="vertical"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="配置"
                  className="pointer-events-none opacity-0 transition-opacity duration-200 group-hover/item:pointer-events-auto group-hover/item:opacity-100"
                  asChild
                >
                  <Link
                    to="/system/organization/$id"
                    params={{ id }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Settings />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>配置</TooltipContent>
            </Tooltip>
          </ItemActions>
        </Item>
      </div>

      {hasChildren ? (
        <CollapsibleContent className="ml-9">
          <div className="flex flex-col gap-1">
            {children?.map((child, childIndex) => (
              <TreeNode
                data={child}
                key={child.id}
                index={childIndex}
                expandedIds={expandedIds}
                onExpandedChange={onExpandedChange}
                onSelect={onSelect}
                activeDragId={activeDragId}
                dragOverId={dragOverId}
                dropValidation={dropValidation}
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
  const { currentNode, setCurrentNode, organizations, moveOrganization, isLoading } =
    useOrganizations()
  const expandableIds = useMemo(() => collectExpandableIds(organizations), [organizations])
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(collectExpandedIdsToDepth(organizations, DEFAULT_ORGANIZATION_TREE_EXPAND_DEPTH))
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropValidation, setDropValidation] = useState<OrganizationDropValidation | null>(null)
  const [previewOrganizations, setPreviewOrganizations] = useState(organizations)
  const organizationsSnapshotRef = useRef(organizations)
  // 拖拽结束后浏览器可能仍会触发一次 click，从而误选中。
  // 用“时间窗”来吞掉这类误触发，避免依赖 setTimeout(0) 的不稳定时序。
  const suppressSelectUntilRef = useRef<number>(0)
  const stableDragOverTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const stableDragOverSeqRef = useRef(0)
  const lastStableOverIdRef = useRef<string | null>(null)

  // 拖拽起始时的树快照作为唯一校验依据，避免预览态的中间结构影响碰撞判定
  const canAcceptOrganizationDrop = useCallback(
    (activeId: string, overId: string) =>
      validateOrganizationDrop(organizationsSnapshotRef.current, activeId, overId).isValid,
    []
  )

  useEffect(() => {
    if (!isDragging) {
      setPreviewOrganizations(organizations)
    }
  }, [organizations, isDragging])

  const displayOrganizations = isDragging ? previewOrganizations : organizations

  const handleExpandedChange = (id: string, nextOpen: boolean) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (nextOpen) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const resetDragState = () => {
    if (stableDragOverTimerRef.current) {
      window.clearTimeout(stableDragOverTimerRef.current)
      stableDragOverTimerRef.current = null
    }
    setIsDragging(false)
    setActiveId(null)
    setDragOverId(null)
    setDropValidation(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const snapshot = organizationsSnapshotRef.current
    // 先读取稳定落点（resetDragState 里不再清理它），避免 dragEnd 误用抖动的 target.id
    const stableOverId = lastStableOverIdRef.current
    resetDragState()
    // 给一个足够小但稳定的窗口，覆盖“拖拽 mouseup -> click”的延迟链路
    suppressSelectUntilRef.current = Date.now() + 1000

    if (event.canceled) {
      setPreviewOrganizations(snapshot)
      return
    }

    const { source, target } = event.operation
    if (!source || !target) {
      setPreviewOrganizations(snapshot)
      return
    }

    const activeId = String(source.id)
    // 用稳定落点替换可能抖动的 target.id，避免 overId 被误判成自身
    const overId = stableOverId ?? String(target.id)
    const validation = validateOrganizationDrop(snapshot, activeId, overId)

    if (!validation.isValid) {
      setPreviewOrganizations(snapshot)
      // 拖拽结束时如果判定为 same-organization，通常是 overId 抖动造成的“误判落点”
      // 这里不 toast，直接回退即可，避免“提示完数据就坏了”的体验问题。
      if (validation.reason !== 'same-organization') {
        toast.error(getOrganizationDropRejectionMessage(snapshot, activeId, overId, validation.reason))
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
      } else {
        setPreviewOrganizations(snapshot)
      }
    })

    // 清理稳定落点，避免下一次拖拽误用
    lastStableOverIdRef.current = null
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { source, target } = event.operation
    if (!source || !target) {
      if (stableDragOverTimerRef.current) {
        window.clearTimeout(stableDragOverTimerRef.current)
        stableDragOverTimerRef.current = null
      }
      setDragOverId(null)
      setDropValidation(null)
      setPreviewOrganizations(organizationsSnapshotRef.current)
      return
    }

    const activeId = String(source.id)
    const overId = String(target.id)
    const snapshot = organizationsSnapshotRef.current
    const validation = validateOrganizationDrop(snapshot, activeId, overId)

    // 边缘抖动时 dnd-kit 的 overId 会在相邻节点之间频繁切换，
    // 从而触发高亮样式（dragOverId）和预览树结构（previewOrganizations）不断重排，表现为闪烁。
    // 使用短暂“稳定延迟”：只有在 overId 连续一小段时间保持一致时才更新 UI。
    stableDragOverSeqRef.current += 1
    const seq = stableDragOverSeqRef.current
    const nextOverId = overId

    if (stableDragOverTimerRef.current) {
      window.clearTimeout(stableDragOverTimerRef.current)
      stableDragOverTimerRef.current = null
    }

    stableDragOverTimerRef.current = window.setTimeout(() => {
      if (stableDragOverSeqRef.current !== seq) return

      setDragOverId(nextOverId)
      setDropValidation(validation)
      lastStableOverIdRef.current = nextOverId

      if (!validation.isValid) {
        setPreviewOrganizations(snapshot)
        return
      }

      // 拖拽悬停稳定后，进行“占位预览 -> 实时排序”（确保 DOM/碰撞结果和数据一致），
      // 避免 dnd-kit 在跨层情况下产生半透明幽灵节点。
      const next = moveOrganizationInTree(snapshot, activeId, nextOverId)
      setPreviewOrganizations(next ?? snapshot)
    }, 80)
  }

  return (
    <div className="flex">
      <section className="min-w-0 flex-1">
        <Card className="py-3">
          <CardHeader>
            <CardTitle>组织架构树</CardTitle>
            <CardAction>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="全部展开"
                    onClick={() => setExpandedIds(new Set(expandableIds))}
                  >
                    <ChevronsUpDown />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全部展开</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="全部收起"
                    onClick={() => setExpandedIds(new Set())}
                  >
                    <ChevronsDownUp />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全部收起</TooltipContent>
              </Tooltip>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2">
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">加载组织树…</p>
            ) : displayOrganizations.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                暂无组织，请先创建根组织
              </p>
            ) : (
              <DragDropProvider
                onDragStart={(event) => {
                  const source = event.operation.source
                  if (!source) return
                  organizationsSnapshotRef.current = organizations
                  setPreviewOrganizations(organizations)
                  setIsDragging(true)
                  setActiveId(String(source.id))
                  setDragOverId(null)
                  setDropValidation(null)
                  lastStableOverIdRef.current = null
                  // 拖拽开始后先进入抑制态；拖拽结束时会刷新时间窗
                  suppressSelectUntilRef.current = Date.now() + 1000
                }}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {displayOrganizations.map((item, index) => (
                  <TreeNode
                    data={item}
                    key={item.id}
                    index={index}
                    expandedIds={expandedIds}
                    onExpandedChange={handleExpandedChange}
                    activeDragId={activeId}
                    dragOverId={dragOverId}
                    dropValidation={dropValidation}
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
                    const node = findOrganization(displayOrganizations, String(source.id))
                    return node ? (
                      <TreeNodePreview data={node} isBlocked={isDragging && !dragOverId} />
                    ) : null
                  }}
                </DragOverlay>
              </DragDropProvider>
            )}
          </CardContent>
        </Card>
      </section>

      <AnimatePresence initial={false}>
        {currentNode ? (
          <motion.div
            key="organization-side-overview"
            initial={sideOverviewMotion.initial}
            animate={sideOverviewMotion.animate}
            exit={sideOverviewMotion.exit}
            transition={sideOverviewMotion.transition}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-95">
              <OrganizationSideOverview />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
