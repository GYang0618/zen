import { Cartesian3, HeadingPitchRoll, Transforms } from 'cesium'

import type { Cesium3DTileset } from 'cesium'

export type GeoAnchor = {
  longitude: number
  latitude: number
  height: number
}

/** 将未配准的 3D Tileset 锚定到指定经纬度（本地坐标原点对齐锚点） */
export function placeTilesetAt(tileset: Cesium3DTileset, anchor: GeoAnchor): void {
  const position = Cartesian3.fromDegrees(anchor.longitude, anchor.latitude, anchor.height)
  const orientation = new HeadingPitchRoll(0, 0, 0)
  tileset.modelMatrix = Transforms.headingPitchRollToFixedFrame(position, orientation)
}
