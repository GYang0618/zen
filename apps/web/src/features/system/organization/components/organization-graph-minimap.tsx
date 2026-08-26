import { MiniMap, Panel } from '@xyflow/react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { MapIcon, Minimize2 } from 'lucide-react'
import { useState } from 'react'

import { OrganizationMiniMapNode } from './organization-minimap-node'

import type { OrganizationGraphNode } from '../build-organization-graph'

export function OrganizationGraphMiniMap() {
  const [open, setOpen] = useState(false)

  return (
    <Panel position="bottom-right" className="organization-graph-minimap nowheel nopan m-3">
      {open ? (
        <div className="relative">
          <MiniMap<OrganizationGraphNode>
            pannable
            zoomable
            ariaLabel="组织图谱缩略图"
            nodeComponent={OrganizationMiniMapNode}
            style={{ width: 280, height: 200 }}
            className="static m-0 overflow-hidden rounded-xl border border-border bg-muted shadow-xs"
            bgColor="transparent"
            maskColor="color-mix(in oklab, var(--foreground) 16%, transparent)"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                aria-label="收起缩略图"
                aria-expanded
                className="absolute top-1.5 right-1.5 bg-background"
                onClick={() => setOpen(false)}
              >
                <Minimize2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>收起缩略图</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="展开缩略图"
              aria-expanded={false}
              className="bg-background"
              onClick={() => setOpen(true)}
            >
              <MapIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>展开缩略图</TooltipContent>
        </Tooltip>
      )}
    </Panel>
  )
}
