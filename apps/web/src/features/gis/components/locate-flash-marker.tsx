import { Cartesian3, SceneTransforms } from 'cesium'
import { useEffect, useRef } from 'react'

import { useCesium } from '../cesium-provider'
import { GIS_LOCATE_FLASH_DURATION_MS } from '../constants'
import { formatCoordinates } from '../lib/geo-utils'
import { useGisStore } from '../stores/gis'

export function LocateFlashMarker() {
  const { viewer } = useCesium()
  const locateFlash = useGisStore((state) => state.locateFlash)
  const clearLocateFlash = useGisStore((state) => state.clearLocateFlash)
  const markerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!locateFlash) return

    const timer = window.setTimeout(() => {
      clearLocateFlash()
    }, GIS_LOCATE_FLASH_DURATION_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [locateFlash, clearLocateFlash])

  useEffect(() => {
    if (!locateFlash) return

    const cartesian = Cartesian3.fromDegrees(
      locateFlash.longitude,
      locateFlash.latitude,
      locateFlash.height
    )
    const scratch = new Cartesian3()
    const scene = viewer.scene

    const updateScreenPosition = () => {
      const element = markerRef.current
      if (!element) return

      const toMarker = Cartesian3.subtract(cartesian, viewer.camera.position, scratch)
      const facing = Cartesian3.dot(toMarker, viewer.camera.direction)
      if (facing <= 0) {
        element.style.visibility = 'hidden'
        return
      }

      const windowPosition = SceneTransforms.worldToWindowCoordinates(scene, cartesian)
      if (!windowPosition) {
        element.style.visibility = 'hidden'
        return
      }

      element.style.visibility = 'visible'
      element.style.left = `${windowPosition.x}px`
      element.style.top = `${windowPosition.y}px`
    }

    const removeListener = scene.postRender.addEventListener(updateScreenPosition)
    updateScreenPosition()

    return () => {
      removeListener()
    }
  }, [viewer, locateFlash])

  if (!locateFlash) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden">
      <div ref={markerRef} className="invisible absolute -translate-x-1/2 -translate-y-full">
        <div className="flex animate-pulse flex-col items-center">
          <div className="rounded-xl border border-primary/50 bg-background/90 px-2.5 py-1 text-xs shadow-[0_0_16px_rgba(56,189,248,0.45)] backdrop-blur-md">
            <div className="font-semibold text-primary">定位点</div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {formatCoordinates(locateFlash.longitude, locateFlash.latitude, locateFlash.height)}
            </div>
          </div>
          <div className="h-6 w-0.5 bg-linear-to-t from-primary via-primary/75 to-primary/25 shadow-[0_0_8px_var(--color-primary)]" />
          <div className="relative flex items-center justify-center">
            <span className="absolute size-8 rounded-full bg-primary/35 animate-ping" />
            <span className="absolute size-4 rounded-full border border-primary/70 bg-primary/25 shadow-[0_0_8px_var(--color-primary)]" />
            <span className="size-2 rounded-full bg-primary ring-2 ring-background" />
          </div>
        </div>
      </div>
    </div>
  )
}
