import { Cesium3DTileset, Ion, Viewer } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { useEffect, useRef } from 'react'

import { BEIJING_CAPITAL, BIM_TILESET_URL } from '../constants'
import { placeTilesetAt } from '../lib/place-tileset'
import { attachTilesetPickHighlight } from '../lib/tileset-highlight'

Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ODkxNWM4NS0xN2U4LTQxMzYtYmNiYy01OGQ0NjU3ZDIwOGIiLCJpZCI6NDM5Njk5LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODA0NTYzNDJ9.ygKlNYZXO8nDpzqU1Q7u9vSzntiAEPK1z_Ideqnfyng'

const VIEWER_OPTIONS = {
  animation: false,
  timeline: false,
  fullscreenButton: false,
  vrButton: false,
  geocoder: false,
  navigationHelpButton: false,
  infoBox: false,
  selectionIndicator: false
} as const

export function Scene() {
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = viewerRef.current
    if (!container) return

    let cancelled = false
    const viewer = new Viewer(container, VIEWER_OPTIONS)
    let tileset: Cesium3DTileset | undefined
    let detachHighlight: (() => void) | undefined

    const isViewerAlive = () => !cancelled && !viewer.isDestroyed()

    const loadTileset = async () => {
      try {
        const loadedTileset = await Cesium3DTileset.fromUrl(BIM_TILESET_URL)
        if (!isViewerAlive()) {
          loadedTileset.destroy()
          return
        }

        tileset = loadedTileset
        placeTilesetAt(tileset, BEIJING_CAPITAL)
        viewer.scene.primitives.add(tileset)
        await viewer.zoomTo(tileset)
        if (!isViewerAlive()) return

        detachHighlight = attachTilesetPickHighlight(viewer)
      } catch (error) {
        if (!isViewerAlive()) return
        console.error('[GIS] Failed to load 3D Tileset:', error)
      }
    }

    void loadTileset()

    return () => {
      cancelled = true
      detachHighlight?.()
      if (tileset && !viewer.isDestroyed()) {
        viewer.scene.primitives.remove(tileset)
      }
      if (!viewer.isDestroyed()) {
        viewer.destroy()
      }
    }
  }, [])

  return (
    <div
      ref={viewerRef}
      className="size-full"
      role="application"
      aria-label="Cesium GIS 三维场景"
    />
  )
}
