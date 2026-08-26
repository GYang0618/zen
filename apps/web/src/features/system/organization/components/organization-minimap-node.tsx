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

const NODE_RADIUS = 12
const PADDING = 16
const ICON_BOX = 36
const ICON_RADIUS = 8
const ICON_SIZE = 20
const GAP = 12
const NAME_FONT_SIZE = 28
const TYPE_FONT_SIZE = 20
const TEXT_GAP = 8

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
  const textX = iconX + ICON_BOX + GAP
  const textWidth = Math.max(nodeWidth - (textX - x) - PADDING, 0)
  const textBlockHeight = NAME_FONT_SIZE + TEXT_GAP + TYPE_FONT_SIZE
  const nameY = y + (nodeHeight - textBlockHeight) / 2
  const typeY = nameY + NAME_FONT_SIZE + TEXT_GAP

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={textX} y={nameY} width={textWidth} height={textBlockHeight} />
        </clipPath>
      </defs>
      <rect
        x={x}
        y={y}
        width={nodeWidth}
        height={nodeHeight}
        rx={NODE_RADIUS}
        ry={NODE_RADIUS}
        strokeWidth={selected ? 5 : 2}
        className={cn(selected ? 'fill-primary/10 stroke-primary' : 'fill-card stroke-border')}
      />
      <rect
        x={iconX}
        y={iconY}
        width={ICON_BOX}
        height={ICON_BOX}
        rx={ICON_RADIUS}
        ry={ICON_RADIUS}
        className={selected ? 'fill-primary/15' : 'fill-muted'}
      />
      <Icon
        x={iconX + (ICON_BOX - ICON_SIZE) / 2}
        y={iconY + (ICON_BOX - ICON_SIZE) / 2}
        width={ICON_SIZE}
        height={ICON_SIZE}
        className={defaultColor}
      />
      <text
        x={textX}
        y={nameY}
        dominantBaseline="hanging"
        clipPath={`url(#${clipId})`}
        className="fill-foreground"
        style={{ fontSize: NAME_FONT_SIZE, fontWeight: 500 }}
      >
        {name}
      </text>
      <text
        x={textX}
        y={typeY}
        dominantBaseline="hanging"
        clipPath={`url(#${clipId})`}
        className="fill-muted-foreground"
        style={{ fontSize: TYPE_FONT_SIZE, fontWeight: 400 }}
      >
        {typeLabel}
      </text>
    </g>
  )
}
