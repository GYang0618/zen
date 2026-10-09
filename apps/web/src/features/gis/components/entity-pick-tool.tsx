import { Button } from '@zen/ui'
import { BoxSelect } from 'lucide-react'

import { useGisStore } from '../stores/gis'

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
      className={`relative h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
        active
          ? 'bg-primary/20 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_12px_rgba(var(--primary),0.35)] ring-1 ring-primary/40'
          : 'text-foreground/80 hover:bg-white/25 dark:hover:bg-white/10'
      }`}
    >
      <BoxSelect className={`mr-1.5 size-4 shrink-0 ${active ? 'text-primary' : ''}`} />
      <span className="shrink-0 whitespace-nowrap">实体拾取</span>
      {active ? (
        <span className="ml-1.5 size-1.5 shrink-0 animate-ping rounded-full bg-primary" />
      ) : null}
    </Button>
  )
}
