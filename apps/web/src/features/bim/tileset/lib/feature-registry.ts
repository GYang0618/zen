import { Mesh } from 'three'

import { disposeFeatureGeometryCache, getOrCreateFeatureGeometry } from './extract-feature-geometry'
import {
  findMetadataRoot,
  getFeatureProperties,
  getMeshFeatures,
  resolveStableElementId
} from './metadata'
import './setup-bvh'

import type { Object3D } from 'three'

export type TilesetFeatureRef = {
  mesh: Mesh
  featureId: number
}

const refsByElementId = new Map<string, TilesetFeatureRef[]>()
const elementIdByMeshFeature = new Map<string, string>()

function meshFeatureKey(mesh: Mesh, featureId: number): string {
  return `${mesh.uuid}:${featureId}`
}

function addRef(elementId: string, ref: TilesetFeatureRef): void {
  const list = refsByElementId.get(elementId) ?? []
  if (list.some((item) => item.mesh === ref.mesh && item.featureId === ref.featureId)) return
  list.push(ref)
  refsByElementId.set(elementId, list)
  elementIdByMeshFeature.set(meshFeatureKey(ref.mesh, ref.featureId), elementId)
}

export const tilesetFeatureRegistry = {
  /**
   * 瓦片加载时仅做廉价处理：登记本瓦片拥有的 feature mesh，并为其几何构建 BVH 以加速点击拾取。
   * 稳定 ID（GlobalId 等）的解析与属性表解码延迟到拾取时 `registerPick` 执行，
   * 避免在加载期对每个 feature 急切解码结构化元数据（海量构件下成本极高）。
   */
  registerFromRoot(root: Object3D): () => void {
    const ownedMeshes = new Set<Mesh>()

    root.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      if (!getMeshFeatures(mesh)) return

      ownedMeshes.add(mesh)
      if (mesh.geometry && !mesh.geometry.boundsTree) {
        mesh.geometry.computeBoundsTree()
      }
    })

    return () => {
      for (const mesh of ownedMeshes) {
        mesh.geometry?.disposeBoundsTree?.()
        disposeFeatureGeometryCache(mesh.uuid)
        for (const key of [...elementIdByMeshFeature.keys()]) {
          if (!key.startsWith(`${mesh.uuid}:`)) continue
          const elementId = elementIdByMeshFeature.get(key)
          elementIdByMeshFeature.delete(key)
          if (!elementId) continue
          const list = refsByElementId.get(elementId)
          if (!list) continue
          const next = list.filter((ref) => ref.mesh !== mesh)
          if (next.length === 0) refsByElementId.delete(elementId)
          else refsByElementId.set(elementId, next)
        }
      }
    }
  },

  registerPick(mesh: Mesh, featureId: number, metadataRoot: Object3D): string {
    const elementId = resolveStableElementId(mesh, featureId, metadataRoot)
    addRef(elementId, { mesh, featureId })
    return elementId
  },

  getRefs(elementId: string): readonly TilesetFeatureRef[] {
    return refsByElementId.get(elementId) ?? []
  },

  getElementProperties(elementId: string): Record<string, unknown> | undefined {
    const refs = refsByElementId.get(elementId)
    if (!refs?.length) return undefined

    const { mesh, featureId } = refs[0]
    return getFeatureProperties(mesh, featureId, findMetadataRoot(mesh))
  },

  /** 为 Outline / 填充层构建仅含 feature 子几何的临时 Mesh */
  getHighlightMeshes(elementIds: readonly string[]): Mesh[] {
    const meshes: Mesh[] = []

    for (const elementId of elementIds) {
      for (const { mesh, featureId } of tilesetFeatureRegistry.getRefs(elementId)) {
        const geometry = getOrCreateFeatureGeometry(mesh.uuid, mesh.geometry, featureId)
        if (!geometry) continue

        const highlight = new Mesh(geometry)
        highlight.matrix.copy(mesh.matrixWorld)
        highlight.matrixAutoUpdate = false
        highlight.frustumCulled = false
        highlight.renderOrder = 999
        meshes.push(highlight)
      }
    }

    return meshes
  }
}
