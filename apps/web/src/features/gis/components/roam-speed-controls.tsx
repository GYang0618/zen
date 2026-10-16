import { Button, Popover, PopoverContent, PopoverTrigger } from '@zen/ui'
import { Gauge, Minus, Plus, Zap } from 'lucide-react'

import { GIS_ROAM_CONFIG, GIS_ROAM_SPEED_MULTIPLIERS } from '../constants'
import { useGisRoamStore } from '../stores/gis-roam'

const SPEED_DELTA_VISIBLE_KMH = 1

export function RoamSpeedControls() {
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const currentSpeedKmh = useGisRoamStore((state) => state.currentSpeedKmh)
  const targetSpeedKmh = useGisRoamStore((state) => state.targetSpeedKmh)
  const speedDown = useGisRoamStore((state) => state.speedDown)
  const speedUp = useGisRoamStore((state) => state.speedUp)
  const resetSpeed = useGisRoamStore((state) => state.resetSpeed)
  const speedMultiplier = useGisRoamStore((state) => state.speedMultiplier)
  const setSpeedMultiplier = useGisRoamStore((state) => state.setSpeedMultiplier)
  const config = GIS_ROAM_CONFIG[vehicleType]
  const showTarget = Math.abs(currentSpeedKmh - targetSpeedKmh) > SPEED_DELTA_VISIBLE_KMH

  return (
    <>
      <div className="ml-1 flex shrink-0 items-center gap-0.5 border-l border-primary/25 pl-1.5 whitespace-nowrap">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={speedDown}
          disabled={targetSpeedKmh <= config.minSpeedKmh}
          title="减速（快捷键 [）"
          className="size-5 shrink-0 p-0 text-primary hover:bg-primary/20"
        >
          <Minus className="size-2.5 shrink-0" />
        </Button>
        <button
          type="button"
          onClick={resetSpeed}
          title="恢复巡航时速（快捷键 \）"
          className="flex shrink-0 items-center gap-1 px-1 font-mono text-[10px] font-semibold whitespace-nowrap text-primary hover:underline"
        >
          <Gauge className="size-2.5 shrink-0 opacity-70" />
          <span className="shrink-0 whitespace-nowrap">{currentSpeedKmh}</span>
          {showTarget ? (
            <span className="shrink-0 whitespace-nowrap text-[9px] opacity-75">
              {currentSpeedKmh < targetSpeedKmh ? '↑' : '↓'}
              {targetSpeedKmh}
            </span>
          ) : null}
          <span className="shrink-0 font-normal whitespace-nowrap text-[9px] opacity-70">km/h</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={speedUp}
          disabled={targetSpeedKmh >= config.maxSpeedKmh}
          title="加速（快捷键 ]）"
          className="size-5 shrink-0 p-0 text-primary hover:bg-primary/20"
        >
          <Plus className="size-2.5 shrink-0" />
        </Button>
      </div>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-0.5 h-6 shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1.5 font-mono text-[10px] font-semibold whitespace-nowrap text-primary hover:bg-primary/25"
            />
          }
        >
          <Zap className="mr-0.5 size-2.5 shrink-0 fill-primary text-primary" />
          <span className="shrink-0 whitespace-nowrap">{speedMultiplier}x</span>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="w-44 rounded-2xl border-white/25 bg-background/90 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10"
        >
          <div className="pb-1.5 text-center text-xs font-semibold text-foreground">
            ⚡ 漫游播放倍速
          </div>
          <div className="grid grid-cols-3 gap-1">
            {GIS_ROAM_SPEED_MULTIPLIERS.map((rate) => (
              <Button
                key={rate}
                type="button"
                variant={speedMultiplier === rate ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSpeedMultiplier(rate)}
                className={`h-6 font-mono text-xs ${
                  speedMultiplier === rate
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/20 hover:text-primary'
                }`}
              >
                {rate}x
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
