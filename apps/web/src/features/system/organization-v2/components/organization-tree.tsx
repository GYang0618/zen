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
  ChevronRightIcon,
  ChevronsDownUp,
  ChevronsUpDown,
  Folder,
  GripVertical,
  Settings
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'

import { organizationIconConfig, organizationTypeLabels } from '../data/data'
import { useOrganizations } from '../organizations-provider'
import { OrganizationSideOverview } from './organizations-side-overview'

import type { Organization } from '../type'

/** 与 OrganizationSideOverview 的 `w-95` 对齐 */
const SIDE_OVERVIEW_WIDTH = '23.75rem'

const sideOverviewMotion = {
  initial: { width: 0, opacity: 0, marginLeft: 0 },
  animate: { width: SIDE_OVERVIEW_WIDTH, opacity: 1, marginLeft: '1.5rem' },
  exit: { width: 0, opacity: 0, marginLeft: 0 },
  transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const }
}

function collectExpandableIds(nodes: Organization[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.children?.length ? [node.id] : []),
    ...collectExpandableIds(node.children ?? [])
  ])
}

interface TreeNodeProps {
  data: Organization
  expandedIds: Set<string>
  onExpandedChange: (id: string, open: boolean) => void
  onSelect?: (node: Organization) => void
}

function TreeNode({ data, expandedIds, onExpandedChange, onSelect }: TreeNodeProps) {
  const { id, name, type, memberCount, children } = data
  const hasChildren = Boolean(children?.length)
  const { currentNode } = useOrganizations()
  const open = expandedIds.has(id)

  const isSelected = currentNode?.id === id

  const renderOrgIcon = ({ type, className }: { type?: string; className?: string }) => {
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

  return (
    <Collapsible
      open={hasChildren ? open : undefined}
      onOpenChange={hasChildren ? (nextOpen) => onExpandedChange(id, nextOpen) : undefined}
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
            variant="ghost"
            className="pointer-events-none size-7 text-muted-foreground/50 opacity-0 transition-opacity duration-200 hover:cursor-grab hover:text-muted-foreground group-hover/item:pointer-events-auto group-hover/item:opacity-100"
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
                  to="/system/organization-v2/$id"
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
              />
            ))}
          </div>
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}

export function OrganizationTree() {
  const { currentNode, setCurrentNode, organizations } = useOrganizations()
  const expandableIds = useMemo(() => collectExpandableIds(organizations), [organizations])
  const [expandedIds, setExpandedIds] = useState(() => new Set(expandableIds))

  const handleExpandedChange = (id: string, nextOpen: boolean) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (nextOpen) next.add(id)
      else next.delete(id)
      return next
    })
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
            {organizations.map((item) => (
              <TreeNode
                data={item}
                key={item.id}
                expandedIds={expandedIds}
                onExpandedChange={handleExpandedChange}
                onSelect={(node) => {
                  if (node.id === currentNode?.id) {
                    setCurrentNode(null)
                  } else {
                    setCurrentNode(node)
                  }
                }}
              />
            ))}
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
