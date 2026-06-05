import { DRAG_THRESHOLD_PX } from '../constants'
import { tilesetFeatureRegistry } from './feature-registry'
import { findMetadataRoot, getFeaturePropertiesWithParseError, getMeshFeatures } from './metadata'

import type { ThreeEvent } from '@react-three/fiber'
import type { MeshFeatures } from '3d-tiles-renderer/plugins'
import type { Mesh, Object3D, Vector3 } from 'three'

export type TilesetPickResult = {
  elementId: string
  mesh: Mesh
  featureId: number
  properties: Record<string, unknown> | undefined
  propertyParseError: unknown | null
}

function isPickableMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true && getMeshFeatures(object as Mesh) !== undefined
}

function readFeatureId(
  meshFeatures: MeshFeatures,
  faceIndex: number,
  barycoord: Vector3
): number | null {
  const [featureId] = meshFeatures.getFeatures(faceIndex, barycoord)
  return featureId ?? null
}

export function pickTilesetFeature(event: ThreeEvent<PointerEvent>): TilesetPickResult | null {
  const intersections = event.intersections ?? []

  for (const { object, faceIndex, barycoord } of intersections) {
    if (!isPickableMesh(object)) continue
    if (faceIndex == null || !barycoord) continue

    const meshFeatures = object.userData.meshFeatures as MeshFeatures
    const featureId = readFeatureId(meshFeatures, faceIndex, barycoord)
    if (featureId === null) continue

    const metadataRoot = findMetadataRoot(object)
    const elementId = tilesetFeatureRegistry.registerPick(object, featureId, metadataRoot)
    const { properties, parseError: propertyParseError } = getFeaturePropertiesWithParseError(
      object,
      featureId,
      metadataRoot
    )

    return { elementId, mesh: object, featureId, properties, propertyParseError }
  }

  return null
}

type SelectElement = (
  id: string,
  options?: { multi?: boolean; append?: boolean; properties?: Record<string, unknown> }
) => void

/** 3D Tiles 左键拾取：feature 级选中 */
export function handleTilesetPointerClick(
  event: ThreeEvent<PointerEvent>,
  selectElement: SelectElement
): void {
  if (event.button !== 0) return
  if (event.delta > DRAG_THRESHOLD_PX) return

  const picked = pickTilesetFeature(event)
  if (!picked) return

  if (import.meta.env.DEV) {
    void import('./debug-tileset-pick').then(({ logTilesetPickDebug }) => {
      logTilesetPickDebug(picked)
    })
  }

  event.stopPropagation()
  selectElement(picked.elementId, {
    multi: event.shiftKey,
    properties: picked.properties
  })
}
