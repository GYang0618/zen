import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@zen/ui'
import {
  Briefcase,
  Building,
  Building2,
  ChevronRightIcon,
  Component,
  Folder,
  FolderTree,
  GripVertical,
  Network,
  UserCircle,
  Users
} from 'lucide-react'

import { useOrganizations } from '../organizations-provider'

import type { LucideIcon } from 'lucide-react'
import type { Organization } from '../type'

interface TreeNodeProps {
  data: Organization
  onSelect?: (node: Organization) => void
}

const orgIconConfig: Record<string, { icon: LucideIcon; defaultColor: string }> = {
  GROUP: { icon: Network, defaultColor: 'text-slate-700 dark:text-slate-300' },
  COMPANY: { icon: Building2, defaultColor: 'text-blue-600 dark:text-blue-400' },
  BRANCH: { icon: Building, defaultColor: 'text-indigo-500' },
  CENTER: { icon: Component, defaultColor: 'text-violet-500' },
  DEPARTMENT: { icon: FolderTree, defaultColor: 'text-amber-500' },
  TEAM: { icon: Users, defaultColor: 'text-emerald-500' },
  POST: { icon: Briefcase, defaultColor: 'text-rose-500' },
  USER: { icon: UserCircle, defaultColor: 'text-slate-500' }
}

const renderOrgIcon = ({ type, className }: { type?: string; className?: string }) => {
  // 容错处理：确保转为大写，处理空值
  const normalizedType = (type || '').toUpperCase()

  // 匹配配置，若匹配不到则使用兜底配置
  const config = orgIconConfig[normalizedType] ?? {
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

function TreeNode({ data, onSelect }: TreeNodeProps) {
  const { id, name, type, memberCount, children } = data
  const hasChildren = children && children.length > 0
  const { currentNode } = useOrganizations()

  const isSelected = currentNode?.id === id

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

export function OrganizationTree({
  data,
  onSelect
}: {
  data: Organization[]
  onSelect?: (node: Organization) => void
}) {
  return (
    <>
      {data.map((item) => (
        <TreeNode data={item} key={item.id} onSelect={onSelect} />
      ))}
    </>
  )
}
