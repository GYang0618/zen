import { Link } from '@tanstack/react-router'
import { Handle, Position } from '@xyflow/react'
import { Badge, Button, cn, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { ChevronDown, ChevronRight, Settings, Users } from 'lucide-react'

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

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col gap-2 overflow-hidden rounded-xl border bg-card p-3 text-left shadow-xs',
        selected && 'border-primary ring-2 ring-primary/20'
      )}
    >
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        isConnectable={false}
        className="size-2 border-0 bg-border opacity-0"
      />

      <div className="flex min-w-0 items-start gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <OrganizationTypeIcon type={type} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{getLabel(type)}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`配置${name}`}
              className="nodrag nopan"
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

      <div className="mt-auto flex items-center gap-2">
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          <Users data-icon="inline-start" />
          {memberCount}人
        </Badge>
        {leader ? (
          <span className="min-w-0 truncate text-xs text-muted-foreground">{leader.name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">未指定负责人</span>
        )}
        {hasChildren ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="nodrag nopan ml-auto"
            aria-label={isExpanded ? `收起${name}的下级` : `展开${name}的下级`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpand(id)
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
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
