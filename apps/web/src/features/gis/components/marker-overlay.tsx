import { Button, Input } from '@zen/ui'
import { Cartesian3, SceneTransforms } from 'cesium'
import { MapPin, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useCesium } from '../cesium-provider'
import { flyToMarker } from '../lib/geo-utils'
import { useGisStore } from '../stores/gis'

import type { GisMarker } from '../stores/gis'

type ScreenPos = {
  x: number
  y: number
  visible: boolean
}

function MarkerItem({
  marker,
  pos,
  onUpdateName,
  onRemove,
  onLocate
}: {
  marker: GisMarker
  pos: ScreenPos
  onUpdateName: (id: string, name: string) => void
  onRemove: (id: string) => void
  onLocate: (marker: GisMarker) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(marker.name)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleSubmit = () => {
    const trimmed = tempName.trim()
    if (trimmed) {
      onUpdateName(marker.id, trimmed)
    } else {
      setTempName(marker.name)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      setTempName(marker.name)
      setIsEditing(false)
    }
  }

  const handleClickLabel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    timerRef.current = setTimeout(() => {
      onLocate(marker)
      timerRef.current = null
    }, 220)
  }

  const handleDoubleClickLabel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setTempName(marker.name)
    setIsEditing(true)
  }

  if (!pos.visible) return null

  return (
    <div
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full select-none"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`
      }}
    >
      <div className="group flex flex-col items-center">
        {/* 1. 高端毛玻璃科技 HUD 标签卡片 */}
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-background/85 px-3 py-1.5 text-xs text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.18),0_0_12px_rgba(56,189,248,0.2)] backdrop-blur-md transition-all hover:scale-105 hover:border-primary/60 hover:shadow-[0_4px_24px_rgba(0,0,0,0.25),0_0_18px_rgba(56,189,248,0.35)] dark:border-primary/40 dark:bg-zinc-950/85">
          {/* 左侧发光定位 Pin 按钮 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onLocate(marker)
            }}
            title="点击快速定位到此点位"
            className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors focus:outline-none"
          >
            <MapPin className="size-3.5" aria-hidden />
          </button>

          {/* 中部名称与微型坐标展示 */}
          <div className="flex flex-col min-w-0 pr-1">
            {isEditing ? (
              <Input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={handleKeyDown}
                className="h-5 w-28 border-primary/50 bg-background px-1.5 py-0 text-xs focus-visible:ring-1"
              />
            ) : (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClickLabel}
                onDoubleClick={handleDoubleClickLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTempName(marker.name)
                    setIsEditing(true)
                  } else if (e.key === ' ') {
                    onLocate(marker)
                  }
                }}
                title="单击定位到该点位，双击修改名称"
                className="max-w-32.5 truncate font-semibold text-xs text-foreground hover:text-primary transition-colors cursor-pointer focus:outline-none"
              >
                {marker.name}
              </span>
            )}
            <span className="font-mono text-[9px] text-muted-foreground/80 leading-tight">
              {marker.longitude.toFixed(4)}°, {marker.latitude.toFixed(4)}°
            </span>
          </div>

          {/* 右侧删除按钮（悬停浮现） */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(marker.id)
            }}
            title="删除此标记"
            className="size-4.5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>

        {/* 2. 垂直发光引线针（连接 HUD 标签与地表锚点） */}
        <div className="h-6 w-0.5 bg-linear-to-t from-primary via-primary/75 to-primary/25 shadow-[0_0_8px_var(--color-primary)]" />

        {/* 3. 地表接触点动态涟漪脉冲光圈（消除浮空感，紧扣地面） */}
        <div className="relative flex items-center justify-center">
          {/* 动态扩散光环 */}
          <span className="absolute size-4.5 rounded-full bg-primary/30 animate-ping opacity-75" />
          {/* 静态微光外圈 */}
          <span className="absolute size-3.5 rounded-full border border-primary/60 bg-primary/20 shadow-[0_0_8px_var(--color-primary)]" />
          {/* 地面接触核心光核 */}
          <span className="size-1.5 rounded-full bg-primary ring-2 ring-background shadow" />
        </div>
      </div>
    </div>
  )
}

export function MarkerOverlay() {
  const { viewer } = useCesium()
  const markers = useGisStore((state) => state.markers)
  const updateMarkerName = useGisStore((state) => state.updateMarkerName)
  const removeMarker = useGisStore((state) => state.removeMarker)

  const [positions, setPositions] = useState<Record<string, ScreenPos>>({})
  const cartesianCacheRef = useRef<Map<string, Cartesian3>>(new Map())

  useEffect(() => {
    // 缓存 Cartesian3 避免每帧重复计算
    const cache = cartesianCacheRef.current
    const currentIds = new Set(markers.map((m) => m.id))

    for (const id of cache.keys()) {
      if (!currentIds.has(id)) {
        cache.delete(id)
      }
    }

    for (const marker of markers) {
      if (!cache.has(marker.id)) {
        cache.set(
          marker.id,
          Cartesian3.fromDegrees(marker.longitude, marker.latitude, marker.height)
        )
      }
    }
  }, [markers])

  useEffect(() => {
    const scene = viewer.scene

    const updateScreenPositions = () => {
      const cache = cartesianCacheRef.current
      const nextPositions: Record<string, ScreenPos> = {}
      const cameraPosition = viewer.camera.position

      for (const marker of markers) {
        const cartesian = cache.get(marker.id)
        if (!cartesian) continue

        // 背面裁剪：判断相机与点的朝向
        const toMarker = Cartesian3.subtract(cartesian, cameraPosition, new Cartesian3())
        const dot = Cartesian3.dot(toMarker, viewer.camera.direction)
        if (dot <= 0) {
          nextPositions[marker.id] = { x: 0, y: 0, visible: false }
          continue
        }

        const windowPos = SceneTransforms.worldToWindowCoordinates(scene, cartesian)
        if (windowPos) {
          nextPositions[marker.id] = {
            x: windowPos.x,
            y: windowPos.y,
            visible: true
          }
        } else {
          nextPositions[marker.id] = { x: 0, y: 0, visible: false }
        }
      }

      setPositions(nextPositions)
    }

    const removeListener = scene.postRender.addEventListener(updateScreenPositions)
    updateScreenPositions()

    return () => {
      removeListener()
    }
  }, [viewer, markers])

  if (markers.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden">
      {markers.map((marker) => {
        const pos = positions[marker.id] ?? { x: 0, y: 0, visible: false }
        return (
          <MarkerItem
            key={marker.id}
            marker={marker}
            pos={pos}
            onUpdateName={updateMarkerName}
            onRemove={removeMarker}
            onLocate={(m) => flyToMarker(viewer, m)}
          />
        )
      })}
    </div>
  )
}
