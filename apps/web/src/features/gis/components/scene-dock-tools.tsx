import { Button } from '@zen/ui'
import { Crosshair, MapPin } from 'lucide-react'

import { useGisStore } from '../stores/gis'
import { dockButtonClass } from './dock-button-class'
import { EntityPickTool } from './entity-pick-tool'

import type { GisToolType } from '../stores/gis'

const DOCK_TOOLS = [
  { id: 'marker', label: '标记点位', icon: MapPin },
  { id: 'picker', label: '坐标拾取', icon: Crosshair }
] as const satisfies ReadonlyArray<{ id: GisToolType; label: string; icon: typeof MapPin }>

export function SceneDockTools() {
  const activeTool = useGisStore((state) => state.activeTool)
  const setActiveTool = useGisStore((state) => state.setActiveTool)

  return (
    <>
      {DOCK_TOOLS.map((tool) => {
        const active = activeTool === tool.id
        const Icon = tool.icon
        return (
          <Button
            key={tool.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setActiveTool(active ? 'none' : tool.id)}
            className={dockButtonClass(active)}
          >
            <Icon className={`mr-1.5 size-4 shrink-0 ${active ? 'text-primary' : ''}`} />
            <span className="shrink-0 whitespace-nowrap">{tool.label}</span>
            {active ? (
              <span className="ml-1.5 size-1.5 shrink-0 animate-ping rounded-full bg-primary" />
            ) : null}
          </Button>
        )
      })}
      <EntityPickTool />
    </>
  )
}
