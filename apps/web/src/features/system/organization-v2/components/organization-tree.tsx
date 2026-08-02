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

import { organizationIconConfig } from '../data/data'
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

interface TreeNodeProps {
  data: Organization
  onSelect?: (node: Organization) => void
}

function TreeNode({ data, onSelect }: TreeNodeProps) {
  const { id, name, type, memberCount, children } = data
  const hasChildren = children && children.length > 0
  const { currentNode } = useOrganizations()

  const isSelected = currentNode?.id === id

  const renderOrgIcon = ({ type, className }: { type?: string; className?: string }) => {
    // 容错处理：确保转为大写，处理空值
    const normalizedType = (type || '').toUpperCase()

    // 匹配配置，若匹配不到则使用兜底配置
    const config = organizationIconConfig[normalizedType] ?? {
      icon: Folder,
      defaultColor: 'text-muted-foreground'
    }

    const IconComponent = config.icon

    return (
      <IconComponent
        className={cn(
          'size-4 shrink-0 transition-colors', // 基础样式：固定大小、防挤压、增加颜色过渡动画
          config.defaultColor, // 默认主题色
          className // 允许外部传入 className 进行覆盖
        )}
      />
    )
  }

  return (
    <Collapsible key={id}>
      <Item
        size="xs"
        className={cn(
          'group/item px-2 py-1.5 hover:bg-muted/50 my-0.5',
          isSelected && 'bg-muted/50 border-muted '
        )}
        onClick={() => onSelect?.(data)}
      >
        <ItemMedia>
          <Button
            variant="ghost"
            className="pointer-events-none text-muted-foreground/50 hover:text-muted-foreground size-7 opacity-0 transition-opacity duration-200 hover:cursor-grab group-hover/item:pointer-events-auto group-hover/item:opacity-100"
          >
            <GripVertical />
          </Button>

          {hasChildren && (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="group size-7"
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
              </Button>
            </CollapsibleTrigger>
          )}
          <div className="size-8 bg-muted rounded-lg flex justify-center items-center text-muted-foreground">
            {renderOrgIcon({ type })}
          </div>
        </ItemMedia>
        <ItemContent className="gap-0">
          <ItemTitle>{name}</ItemTitle>
          <ItemDescription className="text-xs">{type}</ItemDescription>
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

      {hasChildren && (
        <CollapsibleContent className="ml-9">
          <div className="flex flex-col gap-1">
            {children.map((child) => (
              <TreeNode data={child} onSelect={onSelect} key={child.id} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export function OrganizationTree({ data }: { data: Organization[] }) {
  const { currentNode, setCurrentNode } = useOrganizations()

  return (
    <div className="flex">
      <section className="min-w-0 flex-1">
        <Card className="py-3">
          <CardHeader>
            <CardTitle>组织架构树</CardTitle>
            <CardAction>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="全部展开">
                    <ChevronsUpDown />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全部展开</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="全部收起">
                    <ChevronsDownUp />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全部收起</TooltipContent>
              </Tooltip>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2">
            {data.map((item) => (
              <TreeNode
                data={item}
                key={item.id}
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
