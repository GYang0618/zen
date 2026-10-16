import { useGisStore } from '../stores/gis'
import { useGisRoamStore } from '../stores/gis-roam'
import { flyToMarker, sampleGroundHeight } from './geo-utils'

import type { Viewer } from 'cesium'

export type LocatePoint = {
  longitude: number
  latitude: number
  height?: number
}

let locateRequestId = 0

/**
 * 飞到指定坐标。高程省略时贴地采样。到达后显示闪烁标记。
 * 新的定位会取消上一次飞行。进行中的漫游会先停下，避免相机被漫游循环抢走。
 * 飞行被取消时返回 null。
 */
export function locateCameraTo(viewer: Viewer, point: LocatePoint): Promise<LocatePoint | null> {
  const requestId = locateRequestId + 1
  locateRequestId = requestId

  const phase = useGisRoamStore.getState().phase
  if (phase === 'roaming' || phase === 'paused') {
    useGisRoamStore.getState().stopRoam()
  }
  useGisStore.getState().clearLocateFlash()

  return resolveAndFly(viewer, point, requestId)
}

async function resolveAndFly(
  viewer: Viewer,
  point: LocatePoint,
  requestId: number
): Promise<LocatePoint | null> {
  const height = point.height ?? (await sampleGroundHeight(viewer, point.longitude, point.latitude))

  if (locateRequestId !== requestId || viewer.isDestroyed()) {
    return null
  }

  const resolved: LocatePoint = {
    longitude: point.longitude,
    latitude: point.latitude,
    height
  }

  return new Promise((resolve) => {
    flyToMarker(viewer, resolved, {
      onComplete: () => {
        if (locateRequestId !== requestId || viewer.isDestroyed()) {
          resolve(null)
          return
        }
        useGisStore.getState().showLocateFlash({
          longitude: resolved.longitude,
          latitude: resolved.latitude,
          height: resolved.height ?? 0
        })
        resolve(resolved)
      },
      onCancel: () => {
        resolve(null)
      }
    })
  })
}
