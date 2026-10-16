import {
  BoundingSphere,
  Cartesian3,
  Math as CesiumMath,
  HeadingPitchRoll,
  Matrix4,
  Transforms
} from 'cesium'

import { GIS_DEPLOY_LOD } from '../constants'

import type { GisDeployedObject } from '../stores/gis'

type TilesetJson = {
  asset: { version: '1.1' }
  geometricError: number
  root: TileJson
}

/** 写在内容瓦片 extras 上，拾取时据此还原部署实例 id。 */
export const GIS_DEPLOY_OBJECT_EXTRA_KEY = 'gisObjectId'

/** 瓦片 JSON 结构版本。变更后已加载的格子会按新 extras 重建。 */
export const GIS_DEPLOY_TILESET_REVISION = 2

type TileJson = {
  boundingVolume: { region: number[] } | { sphere: number[] }
  geometricError: number
  refine?: 'ADD'
  transform?: number[]
  content?: { uri: string }
  extras?: Record<string, string>
  children?: TileJson[]
}

/** 把同一格子里的部署实例编译成 3D Tiles 1.1。GLB 挂在子瓦片上，父瓦片的几何误差控制加载时机。 */
export function buildDeployTileset(objects: GisDeployedObject[]): TilesetJson {
  return {
    asset: { version: '1.1' },
    geometricError: GIS_DEPLOY_LOD.cellGeometricError,
    root: {
      boundingVolume: { region: cellRegion(objects) },
      geometricError: GIS_DEPLOY_LOD.cellGeometricError,
      refine: 'ADD',
      children: objects.map(modelTile)
    }
  }
}

export function createTilesetBlobUrl(tileset: TilesetJson): string {
  const blob = new Blob([JSON.stringify(tileset)], { type: 'application/json' })
  return URL.createObjectURL(blob)
}

export function toAbsoluteAssetUrl(uri: string): string {
  return new URL(uri, window.location.origin).href
}

/** 部署实例在地固系中的包围球，与瓦片包围体使用同一中心和半径。 */
export function deployedObjectBoundingSphere(object: GisDeployedObject): BoundingSphere {
  const transform = placementMatrix(object)
  const localCenter = gltfCenterToZUp(object.bounds.center)
  const center = Matrix4.multiplyByPoint(transform, localCenter, new Cartesian3())
  return new BoundingSphere(center, Math.max(object.radiusMeters, 0.01))
}

function modelTile(object: GisDeployedObject): TileJson {
  const sphere = deployedObjectBoundingSphere(object)
  const transform = placementMatrix(object)
  const localCenter = gltfCenterToZUp(object.bounds.center)

  return {
    boundingVolume: { sphere: [...cartesianToArray(sphere.center), sphere.radius] },
    geometricError: object.geometricError,
    refine: 'ADD',
    children: [
      {
        boundingVolume: {
          sphere: [...cartesianToArray(localCenter), object.bounds.radius]
        },
        geometricError: 0,
        transform: Matrix4.toArray(transform),
        extras: { [GIS_DEPLOY_OBJECT_EXTRA_KEY]: object.id },
        content: { uri: toAbsoluteAssetUrl(object.modelUri) }
      }
    ]
  }
}

function placementMatrix(object: GisDeployedObject): Matrix4 {
  const anchor = Cartesian3.fromDegrees(object.longitude, object.latitude, object.height)
  const orientation = new HeadingPitchRoll(CesiumMath.toRadians(object.heading), 0, 0)
  const frame = Transforms.headingPitchRollToFixedFrame(anchor, orientation)
  const lift = Matrix4.fromTranslation(new Cartesian3(0, 0, object.groundOffset))
  const scaled = Matrix4.multiply(lift, Matrix4.fromUniformScale(object.scale), new Matrix4())
  return Matrix4.multiply(frame, scaled, new Matrix4())
}

function cellRegion(objects: GisDeployedObject[]): number[] {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  let minHeight = Infinity
  let maxHeight = -Infinity

  for (const object of objects) {
    const pad = metersToDegrees(object.radiusMeters, object.latitude)
    west = Math.min(west, object.longitude - pad.longitude)
    east = Math.max(east, object.longitude + pad.longitude)
    south = Math.min(south, object.latitude - pad.latitude)
    north = Math.max(north, object.latitude + pad.latitude)
    minHeight = Math.min(minHeight, object.height + object.groundOffset)
    maxHeight = Math.max(maxHeight, object.height + object.groundOffset + object.diameterMeters)
  }

  return [
    CesiumMath.toRadians(west),
    CesiumMath.toRadians(south),
    CesiumMath.toRadians(east),
    CesiumMath.toRadians(north),
    minHeight,
    maxHeight
  ]
}

function metersToDegrees(
  meters: number,
  latitude: number
): { longitude: number; latitude: number } {
  const latitudeDegrees = meters / 111_320
  const cosine = Math.cos(CesiumMath.toRadians(latitude))
  const longitudeDegrees = meters / (111_320 * Math.max(Math.abs(cosine), 0.01))
  return { longitude: longitudeDegrees, latitude: latitudeDegrees }
}

/** glTF Y-up 转到 3D Tiles Z-up：(x, y, z) -> (x, -z, y) */
function gltfCenterToZUp(center: [number, number, number]): Cartesian3 {
  return new Cartesian3(center[0], -center[2], center[1])
}

function cartesianToArray(value: Cartesian3): [number, number, number] {
  return [value.x, value.y, value.z]
}
