import { useReactFlow } from '@xyflow/react'
import { cn } from '@zen/ui'

import {
  ORGANIZATION_GRAPH_NODE_HEIGHT,
  ORGANIZATION_GRAPH_NODE_WIDTH
} from '../build-organization-graph'
import { useOrganizationTypeCatalog } from '../queries'
import { getOrganizationTypeIcon } from './organization-icon'

import type { MiniMapNodeProps } from '@xyflow/react'
import type { OrganizationGraphNode } from '../build-organization-graph'

const PADDING = 16
const ICON_BOX = 36
const ICON_SIZE = 20
const NAME_FONT_SIZE = 28
const TYPE_FONT_SIZE = 20

export function OrganizationMiniMapNode({ id, x, y, width, height, selected }: MiniMapNodeProps) {
  const { getNode } = useReactFlow<OrganizationGraphNode>()
  const { getLabel } = useOrganizationTypeCatalog()
  const organization = getNode(id)?.data.organization
  const name = organization?.name ?? ''
  const typeLabel = organization ? getLabel(organization.type) : ''
  const { icon: Icon, defaultColor } = getOrganizationTypeIcon(organization?.type)
  const nodeWidth = width > 1 ? width : ORGANIZATION_GRAPH_NODE_WIDTH
  const nodeHeight = height > 1 ? height : ORGANIZATION_GRAPH_NODE_HEIGHT
  const clipId = `organization-minimap-clip-${id}`
  const iconX = x + PADDING
  const iconY = y + (nodeHeight - ICON_BOX) / 2
  const textX = iconX + ICON_BOX + 12
  const textWidth = Math.max(nodeWidth - (textX - x) - PADDING, 0)

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={textX} y={y} width={textWidth} height={nodeHeight} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={nodeWidth}
        height={nodeHeight}
        rx={12}
        ry={12}
        strokeWidth={4}
        className={cn(selected ? 'fill-primary stroke-primary' : 'fill-card stroke-border')}
      />
      <rect
        x={iconX}
        y={iconY}
        width={ICON_BOX}
        height={ICON_BOX}
        rx={8}
        ry={8}
        className={selected ? 'fill-primary-foreground/20' : 'fill-muted'}
      />
      <Icon
        x={iconX + (ICON_BOX - ICON_SIZE) / 2}
        y={iconY + (ICON_BOX - ICON_SIZE) / 2}
        width={ICON_SIZE}
        height={ICON_SIZE}
        className={cn(selected ? 'text-primary-foreground' : defaultColor)}
      />
      <text
        x={textX}
        y={y + nodeHeight / 2 - 8}
        dominantBaseline="auto"
        clipPath={`url(#${clipId})`}
        className={cn(selected ? 'fill-primary-foreground' : 'fill-foreground')}
        style={{ fontSize: NAME_FONT_SIZE, fontWeight: 600 }}
      >
        {name}
      </text>
      <text
        x={textX}
        y={y + nodeHeight / 2 + 18}
        dominantBaseline="hanging"
        clipPath={`url(#${clipId})`}
        className={cn(selected ? 'fill-primary-foreground/80' : 'fill-muted-foreground')}
        style={{ fontSize: TYPE_FONT_SIZE, fontWeight: 500 }}
      >
        {typeLabel}
      </text>
    </g>
  )
}
