import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@zen/ui'
import {
  Compass,
  Crosshair,
  Eye,
  Footprints,
  Gauge,
  Layers,
  MapPin,
  Minus,
  Pause,
  Plane,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Timer,
  Trash2,
  Video,
  X,
  Zap
} from 'lucide-react'
import { useEffect } from 'react'

import { useCesium } from '../cesium-provider'
import { GIS_ROAM_CONFIG, GIS_ROAM_SPEED_MULTIPLIERS } from '../constants'
import {
  flyToMarker,
  formatCoordinates,
  formatDistance,
  formatEstimatedArrivalTime
} from '../lib/geo-utils'
import { useGisStore } from '../stores/gis'
import { useGisRoamStore } from '../stores/gis-roam'

import type { GisToolType } from '../stores/gis'

export function SceneDock() {
  const { viewer } = useCesium()
  const activeTool = useGisStore((state) => state.activeTool)
  const setActiveTool = useGisStore((state) => state.setActiveTool)
  const markers = useGisStore((state) => state.markers)
  const removeMarker = useGisStore((state) => state.removeMarker)
  const clearMarkers = useGisStore((state) => state.clearMarkers)

  const phase = useGisRoamStore((state) => state.phase)
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const viewMode = useGisRoamStore((state) => state.viewMode)
  const currentSpeedKmh = useGisRoamStore((state) => state.currentSpeedKmh)
  const targetSpeedKmh = useGisRoamStore((state) => state.targetSpeedKmh)
  const flightPhase = useGisRoamStore((state) => state.flightPhase)
  const activeAction = useGisRoamStore((state) => state.activeAction)
  const totalDistanceMeters = useGisRoamStore((state) => state.totalDistanceMeters)
  const remainingRealSeconds = useGisRoamStore((state) => state.remainingRealSeconds)
  const roamProgress = useGisRoamStore((state) => state.roamProgress)
  const pauseRoam = useGisRoamStore((state) => state.pauseRoam)
  const resumeRoam = useGisRoamStore((state) => state.resumeRoam)
  const restartRoam = useGisRoamStore((state) => state.restartRoam)
  const stopRoam = useGisRoamStore((state) => state.stopRoam)
  const toggleViewMode = useGisRoamStore((state) => state.toggleViewMode)
  const speedUp = useGisRoamStore((state) => state.speedUp)
  const speedDown = useGisRoamStore((state) => state.speedDown)
  const resetSpeed = useGisRoamStore((state) => state.resetSpeed)
  const triggerAction = useGisRoamStore((state) => state.triggerAction)
  const viewTarget = useGisRoamStore((state) => state.viewTarget)
  const setViewTarget = useGisRoamStore((state) => state.setViewTarget)
  const airdropInfo = useGisRoamStore((state) => state.airdropInfo)
  const speedMultiplier = useGisRoamStore((state) => state.speedMultiplier)
  const setSpeedMultiplier = useGisRoamStore((state) => state.setSpeedMultiplier)
  const cycleSpeedMultiplier = useGisRoamStore((state) => state.cycleSpeedMultiplier)

  const isRoaming = phase === 'roaming'
  const isPaused = phase === 'paused'

  // 全局快捷键监听（空格暂停/继续，R 重新开始，V 切换视角，M 切换倍速，[ ] 时速微调，\ 恢复原速）
  useEffect(() => {
    if (!isRoaming && !isPaused) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在输入框中打字时误触发快捷键
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (isRoaming) pauseRoam()
        else if (isPaused) resumeRoam()
      } else if (e.key === 'r' || e.key === 'R') {
        restartRoam()
      } else if (e.key === 'v' || e.key === 'V') {
        toggleViewMode()
      } else if (e.key === 'm' || e.key === 'M') {
        cycleSpeedMultiplier()
      } else if (e.key === '[') {
        speedDown()
      } else if (e.key === ']') {
        speedUp()
      } else if (e.key === '\\') {
        resetSpeed()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isRoaming,
    isPaused,
    toggleViewMode,
    speedUp,
    speedDown,
    resetSpeed,
    pauseRoam,
    resumeRoam,
    restartRoam,
    cycleSpeedMultiplier
  ])

  const toggleTool = (tool: GisToolType) => {
    if (activeTool === tool) {
      setActiveTool('none')
    } else {
      setActiveTool(tool)
    }
  }

  return (
    <TooltipProvider delay={150}>
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 max-w-[calc(100vw-2rem)] -translate-x-1/2 select-none">
        {/* iOS 27 超轻奢未来毛玻璃药丸 Dock 容器 */}
        <div className="relative flex shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap rounded-full border border-white/30 bg-background/65 px-3 py-2 shadow-[0_16px_40px_0_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-background/45 dark:shadow-[0_20px_50px_0_rgba(0,0,0,0.55)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent">
          {/* 1. 标记工具 */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTool('marker')}
                  className={`relative h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTool === 'marker'
                      ? 'bg-primary/20 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_12px_rgba(var(--primary),0.35)] ring-1 ring-primary/40'
                      : 'text-foreground/80 hover:bg-white/25 dark:hover:bg-white/10'
                  }`}
                />
              }
            >
              <MapPin
                className={`mr-1.5 size-4 shrink-0 ${activeTool === 'marker' ? 'text-primary' : ''}`}
              />
              <span className="shrink-0 whitespace-nowrap">标记点位</span>
              {activeTool === 'marker' && (
                <span className="ml-1.5 size-1.5 shrink-0 animate-ping rounded-full bg-primary" />
              )}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {activeTool === 'marker'
                ? '已激活：点击地图打点，双击标签改名（按 Esc 或再点按钮退出）'
                : '激活标记工具：在地图上点击放置标记点'}
            </TooltipContent>
          </Tooltip>

          {/* 2. 坐标拾取 */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTool('picker')}
                  className={`relative h-9 shrink-0 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTool === 'picker'
                      ? 'bg-primary/20 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_12px_rgba(var(--primary),0.35)] ring-1 ring-primary/40'
                      : 'text-foreground/80 hover:bg-white/25 dark:hover:bg-white/10'
                  }`}
                />
              }
            >
              <Crosshair
                className={`mr-1.5 size-4 shrink-0 ${activeTool === 'picker' ? 'text-primary' : ''}`}
              />
              <span className="shrink-0 whitespace-nowrap">坐标拾取</span>
              {activeTool === 'picker' && (
                <span className="ml-1.5 size-1.5 shrink-0 animate-ping rounded-full bg-primary" />
              )}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {activeTool === 'picker'
                ? '已激活：点击地图拾取坐标，在提示框中可手动复制'
                : '激活坐标拾取：点击地图拾取经纬度并在提示中复制'}
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5 shrink-0 bg-border/60" />

          {/* 3. 标记点列表与全局上下文管理 */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="relative h-9 shrink-0 rounded-full px-3 text-xs text-foreground/80 whitespace-nowrap hover:bg-white/25 dark:hover:bg-white/10"
                />
              }
            >
              <Layers className="mr-1.5 size-4 shrink-0" />
              <span className="shrink-0 whitespace-nowrap">标记列表</span>
              {markers.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 min-w-4 shrink-0 rounded-full px-1 text-[10px] leading-none whitespace-nowrap"
                >
                  {markers.length}
                </Badge>
              )}
            </PopoverTrigger>

            <PopoverContent
              side="top"
              align="center"
              className="w-80 rounded-2xl border-white/25 bg-background/85 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10"
            >
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground">全局标记点列表</span>
                  <Badge variant="outline" className="text-[10px]">
                    {markers.length} 个
                  </Badge>
                </div>
                {markers.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={clearMarkers}
                    title="清空所有标记"
                    className="size-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>

              {markers.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-xs">
                  暂无标记点，可点击「标记点位」在场景中打点
                </div>
              ) : (
                <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1 text-xs">
                  {markers.map((marker, index) => (
                    <li
                      key={marker.id}
                      className="group flex items-center justify-between rounded-xl border border-border/50 bg-muted/40 px-2.5 py-1.5 transition-colors hover:bg-muted/70"
                    >
                      <button
                        type="button"
                        onClick={() => flyToMarker(viewer, marker)}
                        title="点击定位到该点位"
                        className="flex flex-1 flex-col overflow-hidden pr-2 text-left focus:outline-none"
                      >
                        <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                          {index + 1}. {marker.name}
                        </span>
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {formatCoordinates(marker.longitude, marker.latitude, marker.height)}
                        </span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeMarker(marker.id)}
                        title="删除此标记"
                        className="size-5 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>

          {/* 4. 漫游进行时的浮动控制 */}
          {(isRoaming || isPaused) && (
            <>
              <Separator orientation="vertical" className="mx-1 h-5 shrink-0 bg-border/60" />
              <div className="relative flex shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary ring-1 ring-primary/30">
                {vehicleType === 'plane' ? (
                  <Plane className="size-3.5 shrink-0 animate-pulse" />
                ) : (
                  <Footprints className="size-3.5 shrink-0 animate-pulse" />
                )}
                <span className="shrink-0 whitespace-nowrap font-medium text-[11px]">
                  {vehicleType === 'walk'
                    ? '步行漫游中'
                    : vehicleType === 'vehicle'
                      ? '车辆巡航中'
                      : '飞机飞行中'}
                </span>
                {totalDistanceMeters > 0 && (
                  <span className="shrink-0 whitespace-nowrap font-mono text-[10px] opacity-80">
                    ({formatDistance(totalDistanceMeters)})
                  </span>
                )}

                {/* 实时预计到达时间（ETA） */}
                {typeof remainingRealSeconds === 'number' && (
                  <div
                    className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-primary/30"
                    title={`当前漫游进度：${Math.round(roamProgress * 100)}%`}
                  >
                    <Timer className="size-3 shrink-0 animate-pulse text-primary" />
                    <span className="shrink-0 whitespace-nowrap">
                      {formatEstimatedArrivalTime(remainingRealSeconds)}
                    </span>
                  </div>
                )}

                {/* 视角切换（第一人称 / 第三人称 / 自由视角） */}
                <div className="ml-1 flex shrink-0 items-center border-l border-primary/25 pl-1.5 whitespace-nowrap">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={toggleViewMode}
                          className="h-6 shrink-0 rounded-full px-2 text-[10px] font-medium text-primary whitespace-nowrap hover:bg-primary/20"
                        />
                      }
                    >
                      {viewMode === 'first_person' ? (
                        <Eye className="mr-1 size-3 shrink-0" />
                      ) : viewMode === 'third_person' ? (
                        <Video className="mr-1 size-3 shrink-0" />
                      ) : (
                        <Compass className="mr-1 size-3 shrink-0" />
                      )}
                      <span className="shrink-0 whitespace-nowrap">
                        {viewMode === 'first_person'
                          ? '第一人称'
                          : viewMode === 'third_person'
                            ? '第三人称'
                            : '自由视角'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {viewMode === 'first_person'
                        ? '当前为第一人称主观视角（前方露出车头/机头）。点击或按键盘 V 键切换为第三人称跟随视角'
                        : viewMode === 'third_person'
                          ? '当前为第三人称跟随视角。点击或按键盘 V 键切换为自由俯视视角'
                          : '当前为自由视角（默认鸟瞰俯视，可使用鼠标随意旋转缩放拖拽）。点击或按键盘 V 键切换为第一人称视角'}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* 飞机飞行阶段标签 */}
                {vehicleType === 'plane' && flightPhase && (
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/25 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                    {flightPhase === 'taxi_start'
                      ? '起飞滑跑'
                      : flightPhase === 'climb'
                        ? '仰角爬升'
                        : flightPhase === 'cruise'
                          ? '万米巡航'
                          : flightPhase === 'descent'
                            ? '进近下滑'
                            : flightPhase === 'taxi_end'
                              ? '着陆滑跑'
                              : '终点停机'}
                  </span>
                )}

                {/* 空投箱追随视角切换药丸按钮 */}
                {airdropInfo?.isDescending && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = viewTarget === 'airdrop' ? 'vehicle' : 'airdrop'
                      setViewTarget(next)
                    }}
                    title={
                      viewTarget === 'airdrop'
                        ? '当前从驾驶舱看向空投。点击返回飞机视角'
                        : '空投正在降落。点击从驾驶舱看向空投'
                    }
                    className={`h-6 shrink-0 rounded-full border px-2 text-[10px] font-medium whitespace-nowrap transition-all ${
                      viewTarget === 'airdrop'
                        ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:bg-amber-500/30'
                        : 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25 animate-pulse'
                    }`}
                  >
                    {viewTarget === 'airdrop' ? (
                      <>
                        <Plane className="mr-1 size-3 shrink-0" />
                        <span className="shrink-0 whitespace-nowrap">
                          返回飞机 (距地
                          {Math.max(
                            0,
                            Math.round(airdropInfo.altitudeMeters - airdropInfo.groundHeight)
                          )}
                          m)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mr-1 text-xs shrink-0">🪂</span>
                        <span className="shrink-0 whitespace-nowrap">
                          跟踪空投 (距地
                          {Math.max(
                            0,
                            Math.round(airdropInfo.altitudeMeters - airdropInfo.groundHeight)
                          )}
                          m)
                        </span>
                      </>
                    )}
                  </Button>
                )}

                {/* 实时物理时速 (km/h) 调节与加速度仪表 */}
                <div className="ml-1 flex shrink-0 items-center gap-0.5 border-l border-primary/25 pl-1.5 whitespace-nowrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={speedDown}
                    disabled={targetSpeedKmh <= GIS_ROAM_CONFIG[vehicleType].minSpeedKmh}
                    title={`减速（步长 -${GIS_ROAM_CONFIG[vehicleType].speedStepKmh} km/h，快捷键 [）`}
                    className="size-5 shrink-0 p-0 hover:bg-primary/20 text-primary"
                  >
                    <Minus className="size-2.5 shrink-0" />
                  </Button>

                  <button
                    type="button"
                    onClick={resetSpeed}
                    title={`当前物理时速：${currentSpeedKmh} km/h，目标时速：${targetSpeedKmh} km/h。点击恢复巡航时速（${GIS_ROAM_CONFIG[vehicleType].cruiseSpeedKmh} km/h，快捷键 \\）`}
                    className="flex shrink-0 items-center gap-1 px-1 font-mono text-[10px] font-semibold text-primary whitespace-nowrap hover:underline"
                  >
                    <Gauge className="size-2.5 shrink-0 opacity-70" />
                    <span className="shrink-0 whitespace-nowrap">{currentSpeedKmh}</span>
                    {Math.abs(currentSpeedKmh - targetSpeedKmh) > 1 && (
                      <span className="shrink-0 whitespace-nowrap text-[9px] opacity-75">
                        {currentSpeedKmh < targetSpeedKmh ? '↑' : '↓'}
                        {targetSpeedKmh}
                      </span>
                    )}
                    <span className="shrink-0 whitespace-nowrap text-[9px] opacity-70 font-normal">
                      km/h
                    </span>
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={speedUp}
                    disabled={targetSpeedKmh >= GIS_ROAM_CONFIG[vehicleType].maxSpeedKmh}
                    title={`加速（步长 +${GIS_ROAM_CONFIG[vehicleType].speedStepKmh} km/h，快捷键 ]）`}
                    className="size-5 shrink-0 p-0 hover:bg-primary/20 text-primary"
                  >
                    <Plus className="size-2.5 shrink-0" />
                  </Button>
                </div>

                {/* 漫游播放倍速调节 (0.5x, 1x, 2x, 4x, 8x, 16x) */}
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title={`漫游播放倍速：${speedMultiplier}x（点击切换倍速，快捷键 M）`}
                        className="ml-0.5 h-6 shrink-0 rounded-full border border-primary/30 bg-primary/10 px-1.5 text-[10px] font-mono font-semibold text-primary whitespace-nowrap hover:bg-primary/25"
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
                          key={`speed-mult-${rate}`}
                          type="button"
                          variant={speedMultiplier === rate ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => {
                            setSpeedMultiplier(rate)
                          }}
                          className={`h-6 text-xs font-mono ${
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

                {/* 载具特技与实时指令操作面板 */}
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-6 shrink-0 rounded-full border border-primary/30 bg-primary/15 px-2 text-[10px] font-medium text-primary whitespace-nowrap hover:bg-primary/25"
                      />
                    }
                  >
                    <Sparkles className="mr-1 size-3 shrink-0 animate-spin text-primary" />
                    <span className="shrink-0 whitespace-nowrap">
                      {activeAction
                        ? activeAction.type === 'jump'
                          ? '跳跃中'
                          : activeAction.type === 'pause_briefly'
                            ? '驻留中'
                            : activeAction.type === 'lane_change_left'
                              ? '左变道超车'
                              : activeAction.type === 'lane_change_right'
                                ? '右变道超车'
                                : activeAction.type === 'airdrop'
                                  ? '空投释放'
                                  : activeAction.type === 'pitch_up'
                                    ? '俯冲爬升'
                                    : activeAction.type === 'pitch_down'
                                      ? '进近下滑'
                                      : '盘旋中'
                        : '实时指令'}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="center"
                    className={`${vehicleType === 'plane' ? 'w-64' : 'w-56'} rounded-2xl border-white/25 bg-background/90 p-2.5 shadow-2xl backdrop-blur-xl dark:border-white/10`}
                  >
                    <div className="pb-1.5 text-xs font-semibold text-foreground">
                      {vehicleType === 'walk'
                        ? '行人实时指令'
                        : vehicleType === 'vehicle'
                          ? '车辆驾驶指令'
                          : '客机飞行指令'}
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {vehicleType === 'walk' && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              triggerAction({ type: 'jump' })
                            }}
                            className="h-7 justify-start text-xs text-foreground/80 hover:bg-primary/10 hover:text-primary"
                          >
                            <span>🦘 垂直跳跃 (抛物线落地)</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              triggerAction({ type: 'pause_briefly', durationSeconds: 3 })
                            }}
                            className="h-7 justify-start text-xs text-foreground/80 hover:bg-primary/10 hover:text-primary"
                          >
                            <span>⏱️ 原地驻留 3 秒后继续</span>
                          </Button>
                        </>
                      )}

                      {vehicleType === 'vehicle' && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              triggerAction({ type: 'lane_change_left' })
                            }}
                            className="h-7 justify-start text-xs text-foreground/80 hover:bg-primary/10 hover:text-primary"
                          >
                            <span>🚗⬅️ 向左变道超车并回归</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              triggerAction({ type: 'lane_change_right' })
                            }}
                            className="h-7 justify-start text-xs text-foreground/80 hover:bg-primary/10 hover:text-primary"
                          >
                            <span>🚗➡️ 向右变道超车并回归</span>
                          </Button>
                        </>
                      )}

                      {vehicleType === 'plane' && (
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              triggerAction({ type: 'airdrop' })
                            }}
                            className="h-7 justify-start text-xs text-foreground/80 hover:bg-primary/10 hover:text-primary"
                          >
                            <span>📦 投掷空投物资箱 (带降落伞)</span>
                          </Button>

                          {/* 仰角爬升与高差选择 */}
                          <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-1.5 border border-white/10">
                            <span className="text-[11px] font-medium text-foreground/75">
                              ✈️ 仰角爬升（指定高差）
                            </span>
                            <div className="grid grid-cols-3 gap-1">
                              {[200, 500, 1000].map((alt) => (
                                <Button
                                  key={`climb-${alt}`}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    triggerAction({
                                      type: 'pitch_up',
                                      deltaAltitude: alt,
                                      speedBoostKmh: 50
                                    })
                                  }}
                                  className="h-6 px-1 text-[11px] hover:bg-primary/20 hover:text-primary"
                                >
                                  +{alt}m
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* 下滑俯冲与高差选择 */}
                          <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-1.5 border border-white/10">
                            <span className="text-[11px] font-medium text-foreground/75">
                              ✈️ 俯冲下滑（指定高差）
                            </span>
                            <div className="grid grid-cols-3 gap-1">
                              {[200, 500, 1000].map((alt) => (
                                <Button
                                  key={`dive-${alt}`}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    triggerAction({
                                      type: 'pitch_down',
                                      deltaAltitude: alt,
                                      speedBoostKmh: 30
                                    })
                                  }}
                                  className="h-6 px-1 text-[11px] hover:bg-primary/20 hover:text-primary"
                                >
                                  -{alt}m
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* 左盘旋角度 */}
                          <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-1.5 border border-white/10">
                            <span className="text-[11px] font-medium text-foreground/75">
                              🔄 左盘旋（机头左转后回正）
                            </span>
                            <div className="grid grid-cols-4 gap-1">
                              {[15, 30, 45, 60].map((deg) => (
                                <Button
                                  key={`roll-left-${deg}`}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    triggerAction({
                                      type: 'roll_turn',
                                      deltaHeadingDeg: -deg,
                                      speedBoostKmh: 50
                                    })
                                  }}
                                  className="h-6 px-0.5 text-[11px] hover:bg-primary/20 hover:text-primary"
                                >
                                  左{deg}°
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* 右盘旋角度 */}
                          <div className="flex flex-col gap-1 rounded-xl bg-white/5 p-1.5 border border-white/10">
                            <span className="text-[11px] font-medium text-foreground/75">
                              🔄 右盘旋（机头右转后回正）
                            </span>
                            <div className="grid grid-cols-4 gap-1">
                              {[15, 30, 45, 60].map((deg) => (
                                <Button
                                  key={`roll-right-${deg}`}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    triggerAction({
                                      type: 'roll_turn',
                                      deltaHeadingDeg: deg,
                                      speedBoostKmh: 50
                                    })
                                  }}
                                  className="h-6 px-0.5 text-[11px] hover:bg-primary/20 hover:text-primary"
                                >
                                  右{deg}°
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="ml-1 flex shrink-0 items-center gap-1 border-l border-primary/25 pl-1.5 whitespace-nowrap">
                  {isRoaming ? (
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
                    className="size-5 shrink-0 p-0 hover:bg-primary/20 text-primary"
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

                {/* 漫游细微进度条 */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-primary/20">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_6px_rgba(var(--primary),0.8)]"
                    style={{ width: `${Math.round(roamProgress * 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
