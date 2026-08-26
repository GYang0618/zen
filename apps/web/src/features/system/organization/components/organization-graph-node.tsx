import { Link } from '@tanstack/react-router'
import { Handle, Position } from '@xyflow/react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { ChevronRight, Settings, Users } from 'lucide-react'

import { useOrganizationTypeCatalog } from '../queries'
import { useOrganizationGraphActions } from './organization-graph-context'
import { OrganizationTypeIcon } from './organization-icon'

import type { NodeProps } from '@xyflow/react'
import type { OrganizationGraphNode as OrganizationGraphFlowNode } from '../build-organization-graph'

export function OrganizationGraphNode({ data, selected }: NodeProps<OrganizationGraphFlowNode>) {
  const { getLabel } = useOrganizationTypeCatalog()
  const { onToggleExpand, rankdir } = useOrganizationGraphActions()
  const { organization, hasChildren, isExpanded, hiddenChildCount } = data
  const { id, name, type, memberCount, leader } = organization
  const isHorizontal = rankdir === 'LR'
  const typeLabel = getLabel(type)

  return (
    <div
      className={cn(
        'group/org-node relative flex h-full w-full flex-col gap-2.5 overflow-hidden rounded-xl bg-card p-3 text-left shadow-xs ring-1 ring-foreground/10',
        'transition-[box-shadow,background-color] duration-200 ease-out',
        'hover:shadow-md hover:ring-foreground/15',
        selected && 'bg-primary/5 shadow-md ring-2 ring-primary/40'
      )}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        isConnectable={false}
        className="size-2 border-0 bg-border opacity-0"
      />

      <div className="flex min-w-0 items-start gap-2">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-foreground/10 transition-colors duration-200',
            selected && 'bg-primary/10 ring-primary/20'
          )}
        >
          <OrganizationTypeIcon type={type} />
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <p className="truncate text-sm font-medium tracking-tight" title={name}>
            {name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{typeLabel}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`配置${name}`}
              className={cn(
                'nodrag nopan absolute top-2 right-2 pointer-events-none opacity-0 transition-opacity duration-200',
                'group-hover/org-node:pointer-events-auto group-hover/org-node:opacity-100',
                'focus-visible:pointer-events-auto focus-visible:opacity-100'
              )}
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
      </div>

      <div className="mt-auto flex min-w-0 items-center gap-2">
        {leader ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Avatar size="sm">
              <AvatarImage src={leader.avatar ?? undefined} alt={leader.name} />
              <AvatarFallback>{leader.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">{leader.name}</span>
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            未指定负责人
          </span>
        )}
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          <Users data-icon="inline-start" />
          {memberCount}人
        </Badge>
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="nodrag nopan text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? `收起${name}的下级` : `展开${name}的下级`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpand(id)
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <ChevronRight
              className={cn('transition-transform duration-200', isExpanded && 'rotate-90')}
            />
            {isExpanded ? '收起' : `+${hiddenChildCount}`}
          </Button>
        ) : null}
      </div>

      <Handle
        type="source"
        position={isHorizontal ? Position.Right : Position.Bottom}
        isConnectable={false}
        className="size-2 border-0 bg-border opacity-0"
      />
    </div>
  )
}
