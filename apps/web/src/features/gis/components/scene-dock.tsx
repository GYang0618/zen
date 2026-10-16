import { Separator } from '@zen/ui'

import { useRoamHotkeys } from '../hooks/use-roam-hotkeys'
import { useGisRoamStore } from '../stores/gis-roam'
import { RoamActionMenu } from './roam-action-menu'
import { RoamSpeedControls } from './roam-speed-controls'
import { RoamStatusCluster } from './roam-status-cluster'
import { RoamProgressBar, RoamTransportControls } from './roam-transport-controls'
import { SceneDockTools } from './scene-dock-tools'
import { SceneListTool } from './scene-list-tool'

export function SceneDock() {
  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 max-w-[calc(100vw-2rem)] -translate-x-1/2 select-none">
      <div className="relative flex shrink-0 flex-nowrap items-center gap-1.5 rounded-full border border-white/30 bg-background/65 px-3 py-2 whitespace-nowrap shadow-[0_16px_40px_0_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent dark:border-white/10 dark:bg-background/45 dark:shadow-[0_20px_50px_0_rgba(0,0,0,0.55)]">
        <SceneDockTools />
        <Separator orientation="vertical" className="mx-1 h-5 shrink-0 bg-border/60" />
        <SceneListTool />
        <RoamDockControls />
      </div>
    </div>
  )
}

function RoamDockControls() {
  const phase = useGisRoamStore((state) => state.phase)
  const active = phase === 'roaming' || phase === 'paused'
  useRoamHotkeys(active)
  if (!active) return null

  return (
    <>
      <Separator orientation="vertical" className="mx-1 h-5 shrink-0 bg-border/60" />
      <div className="relative flex shrink-0 flex-nowrap items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs whitespace-nowrap text-primary ring-1 ring-primary/30">
        <RoamStatusCluster />
        <RoamSpeedControls />
        <RoamActionMenu />
        <RoamTransportControls />
        <RoamProgressBar />
      </div>
    </>
  )
}
