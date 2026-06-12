import { DRAG_THRESHOLD_PX } from '../constants'
import { getFeatureProperties } from './get-feature-properties'
import { tilesetFeatureRegistry } from './feature-registry'
import { readFeatureIdAt } from './read-feature-id'

import type { ThreeEvent } from '@react-three/fiber'
import type { MeshFeatures } from '3d-tiles-renderer/plugins'
import type { Mesh, Object3D, Vector3 } from 'three'

type MeshFeatureChannel = {
  attribute?: number
}

export type TilesetPickResult = {
  elementId: string
  mesh: Mesh
  featureId: number
  faceIndex: number
  barycoord: Vector3
}

export type TilesetFeaturePropertiesResult = TilesetPickResult & {
  properties: Record<string, unknown> | undefined
}

function getMeshFeatures(mesh: Mesh): MeshFeatures | undefined {
  return mesh.userData.meshFeatures as MeshFeatures | undefined
}

function isPickableMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true && getMeshFeatures(object as Mesh) !== undefined
}

function readFeatureId(mesh: Mesh, faceIndex: number, barycoord: Vector3): number | null {
  const meshFeatures = getMeshFeatures(mesh)
  if (!meshFeatures) return null

  const featureInfos = meshFeatures.getFeatureInfo()
  for (let i = 0; i < featureInfos.length; i++) {
    const info = featureInfos[i] as MeshFeatureChannel
    const attributeIndex = info.attribute ?? i
    const featureId = readFeatureIdAt(mesh, attributeIndex, faceIndex, barycoord)
    if (featureId != null) return featureId
  }

  const [fallback] = meshFeatures.getFeatures(faceIndex, barycoord)
  return fallback ?? null
}

export function pickTilesetFeature(event: ThreeEvent<PointerEvent>): TilesetPickResult | null {
  const intersections = event.intersections ?? []

  for (const { object, faceIndex, barycoord } of intersections) {
    if (!isPickableMesh(object)) continue
    if (faceIndex == null || !barycoord) continue

    const meshFeatures = getMeshFeatures(object)
    if (!meshFeatures) continue

    const featureId = readFeatureId(object, faceIndex, barycoord)
    if (featureId === null) continue

    const elementId = tilesetFeatureRegistry.registerPick(object, featureId)

    return { elementId, mesh: object, featureId, faceIndex, barycoord }
  }

  return null
}

/** 从 R3F 点击事件拾取 3D Tiles feature 并读取 property table 中的 BIM 属性 */
export function pickFeatureProperties(
  event: ThreeEvent<PointerEvent>
): TilesetFeaturePropertiesResult | null {
  const picked = pickTilesetFeature(event)
  if (!picked) return null

  return {
    ...picked,
    properties: getFeatureProperties(picked.mesh, picked.featureId)
  }
}

type SelectElement = (id: string, options?: { multi?: boolean; append?: boolean }) => void

/** 3D Tiles 左键拾取：feature 级选中，并返回拾取结果与属性 */
export function handleTilesetPointerClick(
  event: ThreeEvent<PointerEvent>,
  selectElement: SelectElement
): TilesetFeaturePropertiesResult | null {
  if (event.button !== 0) return null
  if (event.delta > DRAG_THRESHOLD_PX) return null

  const picked = pickFeatureProperties(event)
  if (!picked) return null

  event.stopPropagation()
  selectElement(picked.elementId, { multi: event.shiftKey })
  return picked
}
