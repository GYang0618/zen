import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@zen/ui'
import { BoxSelect } from 'lucide-react'

import { useGisStore } from '../stores/gis'

export function EntityPickTool() {
  const activeTool = useGisStore((state) => state.activeTool)
  const setActiveTool = useGisStore((state) => state.setActiveTool)
  const active = activeTool === 'select'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
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
          />
        }
      >
        <BoxSelect className={`mr-1.5 size-4 shrink-0 ${active ? 'text-primary' : ''}`} />
        <span className="shrink-0 whitespace-nowrap">实体拾取</span>
        {active ? (
          <span className="ml-1.5 size-1.5 shrink-0 animate-ping rounded-full bg-primary" />
        ) : null}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {active
          ? '已激活：点击选中并高亮。按住 Shift 多选，按住 Alt 拖拽框选'
          : '激活实体拾取：选中模型、实体或图元，并写入助手上下文'}
      </TooltipContent>
    </Tooltip>
  )
}
