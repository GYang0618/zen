import {
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@zen/ui'
import { List, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useGisStore } from '../stores/gis'
import { DeployedList, MarkerList, PickedList } from './scene-list-sections'

const SCENE_LIST_TABS = ['picked', 'markers', 'deployed'] as const

type SceneListTab = (typeof SCENE_LIST_TABS)[number]

const SCENE_LIST_TAB_LABELS: Record<SceneListTab, string> = {
  picked: '拾取',
  markers: '标记',
  deployed: '部署'
}

const DOCK_BUTTON_CLASS =
  'relative h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-all duration-200'

function isSceneListTab(value: unknown): value is SceneListTab {
  return SCENE_LIST_TABS.some((tab) => tab === value)
}

function dockButtonClass(active: boolean) {
  return active
    ? `${DOCK_BUTTON_CLASS} bg-primary/20 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_12px_rgba(var(--primary),0.35)] ring-1 ring-primary/40`
    : `${DOCK_BUTTON_CLASS} text-foreground/80 hover:bg-white/25 dark:hover:bg-white/10`
}

export function SceneListTool() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<SceneListTab>('picked')
  const pickedCount = useGisStore((state) => state.pickedTargets.length)
  const markerCount = useGisStore((state) => state.markers.length)
  const deployedCount = useGisStore((state) => state.deployedObjects.length)
  const totalCount = pickedCount + markerCount + deployedCount
  const counts: Record<SceneListTab, number> = {
    picked: pickedCount,
    markers: markerCount,
    deployed: deployedCount
  }

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <>
      {open ? <SceneListPanel tab={tab} onTabChange={setTab} counts={counts} /> : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={open}
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
              className={dockButtonClass(open)}
            />
          }
        >
          <List className={`mr-1.5 size-4 shrink-0 ${open ? 'text-primary' : ''}`} />
          <span className="shrink-0 whitespace-nowrap">场景列表</span>
          {totalCount > 0 ? (
            <Badge
              variant="secondary"
              className="ml-1.5 h-4 min-w-4 shrink-0 rounded-full px-1 text-[10px] leading-none whitespace-nowrap"
            >
              {totalCount}
            </Badge>
          ) : null}
          {open ? (
            <span className="ml-1.5 size-1.5 shrink-0 animate-ping rounded-full bg-primary" />
          ) : null}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {open
            ? '已打开场景列表，按 Esc 或再点按钮关闭'
            : '打开场景列表：切换查看拾取、标记和部署'}
        </TooltipContent>
      </Tooltip>
    </>
  )
}

function SceneListPanel({
  tab,
  onTabChange,
  counts
}: {
  tab: SceneListTab
  onTabChange: (tab: SceneListTab) => void
  counts: Record<SceneListTab, number>
}) {
  const clearPickedTargets = useGisStore((state) => state.clearPickedTargets)
  const clearMarkers = useGisStore((state) => state.clearMarkers)
  const clearDeployedObjects = useGisStore((state) => state.clearDeployedObjects)
  const clearByTab: Record<SceneListTab, () => void> = {
    picked: clearPickedTargets,
    markers: clearMarkers,
    deployed: clearDeployedObjects
  }

  return (
    <div className="absolute bottom-full left-1/2 z-30 mb-3 w-80 -translate-x-1/2 rounded-2xl border border-white/25 bg-background/85 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (isSceneListTab(value)) onTabChange(value)
        }}
      >
        <div className="flex items-center gap-1.5">
          <TabsList aria-label="场景列表" className="min-w-0 flex-1">
            {SCENE_LIST_TABS.map((item) => (
              <TabsTrigger key={item} value={item} className="gap-1 px-2 text-xs">
                {SCENE_LIST_TAB_LABELS[item]}
                {counts[item] > 0 ? (
                  <Badge variant="secondary" className="h-4 min-w-4 rounded-full px-1 text-[10px]">
                    {counts[item]}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {counts[tab] > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={clearByTab[tab]}
              title={`清空${SCENE_LIST_TAB_LABELS[tab]}`}
              aria-label={`清空${SCENE_LIST_TAB_LABELS[tab]}`}
              className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
        <TabsContent value="picked">
          <PickedList />
        </TabsContent>
        <TabsContent value="markers">
          <MarkerList />
        </TabsContent>
        <TabsContent value="deployed">
          <DeployedList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
