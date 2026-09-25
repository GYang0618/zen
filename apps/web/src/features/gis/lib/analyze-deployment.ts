import { findSceneModel } from '../constants'
import { encodeDeployCell } from './deploy-cell'
import { computeDeployLod, readDeployScene } from './deploy-lod'
import { sampleGroundHeight } from './geo-utils'
import { measureGlb } from './glb-bounds'

import type { Viewer } from 'cesium'
import type { GisSceneModelId } from '../constants'
import type { DeployLod } from './deploy-lod'
import type { GlbBounds } from './glb-bounds'

export type DeploymentAnalysis = DeployLod & {
  modelId: GisSceneModelId
  label: string
  modelUri: string
  longitude: number
  latitude: number
  height: number
  heading: number
  cellId: string
  bounds: GlbBounds
}

export type AnalyzeDeploymentInput = {
  modelId: string
  longitude: number
  latitude: number
  height?: number
  heading?: number
  scale?: number
}

/** 按 GLB 实测尺寸、部署位置和当前相机计算包围盒与加载距离。 */
export async function analyzeDeployment(
  viewer: Viewer,
  input: AnalyzeDeploymentInput
): Promise<DeploymentAnalysis> {
  const model = findSceneModel(input.modelId)
  if (!model) {
    throw new Error(`目录中没有模型 ${input.modelId}`)
  }

  const bounds = await measureGlb(model.uri)
  const height = input.height ?? (await sampleGroundHeight(viewer, input.longitude, input.latitude))
  const anchor = { longitude: input.longitude, latitude: input.latitude, height }
  const lod = computeDeployLod(bounds, input.scale ?? 1, readDeployScene(viewer), anchor)

  return {
    ...lod,
    modelId: model.id,
    label: model.label,
    modelUri: model.uri,
    longitude: anchor.longitude,
    latitude: anchor.latitude,
    height,
    heading: input.heading ?? 0,
    cellId: encodeDeployCell(anchor.latitude, anchor.longitude),
    bounds
  }
}
