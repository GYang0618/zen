import { Button, Input } from '@zen/ui'
import { Cartesian3, SceneTransforms } from 'cesium'
import { MapPin, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useCesium } from '../cesium-provider'
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
  onRemove
}: {
  marker: GisMarker
  pos: ScreenPos
  onUpdateName: (id: string, name: string) => void
  onRemove: (id: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(marker.name)

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
        {/* 标签主体 */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/30 bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-transform hover:scale-105 dark:border-white/10 dark:bg-background/80">
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />

          {isEditing ? (
            <Input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={handleKeyDown}
              className="h-5 w-24 border-primary/50 bg-background px-1 py-0 text-xs focus-visible:ring-1"
            />
          ) : (
            <span
              role="button"
              tabIndex={0}
              onDoubleClick={() => {
                setTempName(marker.name)
                setIsEditing(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setTempName(marker.name)
                  setIsEditing(true)
                }
              }}
              title="双击修改名称"
              className="cursor-pointer truncate max-w-[120px] hover:text-primary transition-colors focus:outline-none"
            >
              {marker.name}
            </span>
          )}

          {/* 移除按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(marker.id)}
            title="删除此标记"
            className="size-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>

        {/* 下方针尖指示小三角与脉冲点 */}
        <div className="relative -mt-0.5 flex flex-col items-center">
          <div className="size-0 border-x-4 border-x-transparent border-t-[6px] border-t-background/85 dark:border-t-background/80" />
          <div className="size-1.5 rounded-full bg-primary ring-2 ring-background ring-offset-1 ring-offset-primary/30" />
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
          />
        )
      })}
    </div>
  )
}
