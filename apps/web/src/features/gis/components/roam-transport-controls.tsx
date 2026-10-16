import { Button } from '@zen/ui'
import { Pause, Play, RotateCcw, Square } from 'lucide-react'

import { useGisRoamStore } from '../stores/gis-roam'

export function RoamTransportControls() {
  const phase = useGisRoamStore((state) => state.phase)
  const pauseRoam = useGisRoamStore((state) => state.pauseRoam)
  const resumeRoam = useGisRoamStore((state) => state.resumeRoam)
  const restartRoam = useGisRoamStore((state) => state.restartRoam)
  const stopRoam = useGisRoamStore((state) => state.stopRoam)
  const roaming = phase === 'roaming'

  return (
    <div className="ml-1 flex shrink-0 items-center gap-1 border-l border-primary/25 pl-1.5 whitespace-nowrap">
      {roaming ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={pauseRoam}
          title="暂停漫游（快捷键 空格）"
          className="size-5 shrink-0 p-0 hover:bg-primary/20"
        >
          <Pause className="size-3 shrink-0" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={resumeRoam}
          title="继续漫游（快捷键 空格）"
          className="size-5 shrink-0 p-0 hover:bg-primary/20"
        >
          <Play className="size-3 shrink-0" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={restartRoam}
        title="重新开始漫游（从起点播放，快捷键 R）"
        className="size-5 shrink-0 p-0 text-primary hover:bg-primary/20"
      >
        <RotateCcw className="size-3 shrink-0" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={stopRoam}
        title="停止漫游"
        className="size-5 shrink-0 p-0 hover:bg-destructive/20 hover:text-destructive"
      >
        <Square className="size-3 shrink-0" />
      </Button>
    </div>
  )
}

export function RoamProgressBar() {
  const roamProgress = useGisRoamStore((state) => state.roamProgress)
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-primary/20">
      <div
        className="h-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.8)] transition-all duration-300 ease-out"
        style={{ width: `${Math.round(roamProgress * 100)}%` }}
      />
    </div>
  )
}
