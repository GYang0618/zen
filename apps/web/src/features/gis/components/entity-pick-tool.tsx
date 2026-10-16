import { Button } from '@zen/ui'
import { BoxSelect } from 'lucide-react'

import { useGisStore } from '../stores/gis'
import { dockButtonClass } from './dock-button-class'

export function EntityPickTool() {
  const activeTool = useGisStore((state) => state.activeTool)
  const setActiveTool = useGisStore((state) => state.setActiveTool)
  const active = activeTool === 'select'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setActiveTool(active ? 'none' : 'select')}
      className={dockButtonClass(active)}
    >
      <BoxSelect className={`mr-1.5 size-4 shrink-0 ${active ? 'text-primary' : ''}`} />
      <span className="shrink-0 whitespace-nowrap">实体拾取</span>
      {active ? (
        <span className="ml-1.5 size-1.5 shrink-0 animate-ping rounded-full bg-primary" />
      ) : null}
    </Button>
  )
}
