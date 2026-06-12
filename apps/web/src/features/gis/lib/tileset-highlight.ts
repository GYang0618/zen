import {
  Cesium3DTileFeature,
  Color,
  defined,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType
} from 'cesium'

import type { Cartesian2, Viewer } from 'cesium'

/** 与 BIM Outline 色系一致的构件高亮色 */
export const TILE_FEATURE_HIGHLIGHT = Color.fromCssColorString('#00e5ff').withAlpha(0.55)

function pickTileFeature(viewer: Viewer, position: Cartesian2): Cesium3DTileFeature | undefined {
  const picked = viewer.scene.pick(position)
  if (defined(picked) && picked instanceof Cesium3DTileFeature) {
    return picked
  }

  const drilled = viewer.scene.drillPick(position)
  return drilled.find((item): item is Cesium3DTileFeature => item instanceof Cesium3DTileFeature)
}

/** 左键拾取 3D Tiles 构件并高亮，返回清理函数 */
export function attachTilesetPickHighlight(viewer: Viewer): () => void {
  let selected: Cesium3DTileFeature | undefined
  const originalColor = new Color()

  const clearHighlight = () => {
    if (!selected) return
    selected.color = Color.clone(originalColor, selected.color)
    selected = undefined
  }

  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
    clearHighlight()
    const feature = pickTileFeature(viewer, movement.position)
    if (!feature) return

    Color.clone(feature.color, originalColor)
    feature.color = Color.clone(TILE_FEATURE_HIGHLIGHT, feature.color)
    selected = feature
  }, ScreenSpaceEventType.LEFT_CLICK)

  return () => {
    clearHighlight()
    handler.destroy()
  }
}
