import { Math as CesiumMath } from 'cesium'

import { GIS_DEPLOY_LOD } from '../constants'
import { calculateHaversineDistance } from './geo-utils'

import type { Viewer } from 'cesium'
import type { GlbBounds } from './glb-bounds'

export type DeploySceneContext = {
  screenHeight: number
  fovyRadians: number
  maximumScreenSpaceError: number
  camera: {
    longitude: number
    latitude: number
    height: number
  }
}

export type DeployLod = {
  scale: number
  diameterMeters: number
  radiusMeters: number
  geometricError: number
  loadDistanceMeters: number
  /** glTF Y 轴向上时，把模型底部放到锚点所需的 ENU Z 平移（米） */
  groundOffset: number
  cameraDistanceMeters: number
  screenSpaceError: number
  loadsAtCurrentView: boolean
}

/** 读取当前画布、视场角和相机位置，供几何误差换算加载距离。 */
export function readDeployScene(viewer: Viewer): DeploySceneContext {
  const frustum = viewer.camera.frustum
  const fovy = 'fovy' in frustum ? frustum.fovy : undefined
  const fovyRadians = typeof fovy === 'number' ? fovy : CesiumMath.toRadians(60)
  const camera = viewer.camera.positionCartographic
  const screenHeight = viewer.scene.canvas.clientHeight

  return {
    screenHeight: screenHeight > 0 ? screenHeight : 1,
    fovyRadians,
    maximumScreenSpaceError: GIS_DEPLOY_LOD.maximumScreenSpaceError,
    camera: {
      longitude: CesiumMath.toDegrees(camera.longitude),
      latitude: CesiumMath.toDegrees(camera.latitude),
      height: camera.height
    }
  }
}

/**
 * 由实测包围盒、部署缩放和当前场景计算瓦片几何误差。
 * 模型直径投影到 {@link GIS_DEPLOY_LOD.targetPixels} 时开始加载。
 */
export function computeDeployLod(
  bounds: GlbBounds,
  scale: number,
  scene: DeploySceneContext,
  anchor: { longitude: number; latitude: number; height: number }
): DeployLod {
  const safeScale = scale > 0 ? scale : 1
  const diameterMeters = Math.max(bounds.size[0], bounds.size[1], bounds.size[2]) * safeScale
  const radiusMeters = bounds.radius * safeScale
  const geometricError =
    (Math.max(diameterMeters, 0.01) * scene.maximumScreenSpaceError) / GIS_DEPLOY_LOD.targetPixels
  const loadDistanceMeters = loadDistanceFor(geometricError, scene)
  const cameraDistanceMeters = distanceToAnchor(scene, anchor)
  const screenSpaceError = screenSpaceErrorAt(geometricError, cameraDistanceMeters, scene)

  return {
    scale: safeScale,
    diameterMeters,
    radiusMeters,
    geometricError,
    loadDistanceMeters,
    groundOffset: -bounds.min[1] * safeScale,
    cameraDistanceMeters,
    screenSpaceError,
    loadsAtCurrentView: screenSpaceError > scene.maximumScreenSpaceError
  }
}

function loadDistanceFor(geometricError: number, scene: DeploySceneContext): number {
  const denominator = 2 * Math.tan(scene.fovyRadians * 0.5)
  return (geometricError * scene.screenHeight) / (scene.maximumScreenSpaceError * denominator)
}

function screenSpaceErrorAt(
  geometricError: number,
  distanceMeters: number,
  scene: DeploySceneContext
): number {
  const denominator = 2 * Math.tan(scene.fovyRadians * 0.5)
  const distance = Math.max(distanceMeters, 1)
  return (geometricError * scene.screenHeight) / (distance * denominator)
}

function distanceToAnchor(
  scene: DeploySceneContext,
  anchor: { longitude: number; latitude: number; height: number }
): number {
  const horizontal = calculateHaversineDistance(
    scene.camera.longitude,
    scene.camera.latitude,
    anchor.longitude,
    anchor.latitude
  )
  return Math.hypot(horizontal, scene.camera.height - anchor.height)
}
