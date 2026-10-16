import { Cartesian3, EasingFunction, Math as CesiumMath } from 'cesium'

import { GIS_INITIAL_VIEW } from '../constants'
import { useGisStore } from '../stores/gis'
import { useGisRoamStore } from '../stores/gis-roam'

import type { Viewer } from 'cesium'

/**
 * 飞回场景默认初始视角（南京鸟瞰）。
 * 进行中的漫游会先停下，避免相机被漫游循环抢走。
 */
export function flyToInitialView(viewer: Viewer) {
  if (viewer.isDestroyed()) return

  const phase = useGisRoamStore.getState().phase
  if (phase === 'roaming' || phase === 'paused') {
    useGisRoamStore.getState().stopRoam()
  }
  useGisStore.getState().clearLocateFlash()

  viewer.camera.cancelFlight()
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(
      GIS_INITIAL_VIEW.longitude,
      GIS_INITIAL_VIEW.latitude,
      GIS_INITIAL_VIEW.height
    ),
    orientation: {
      heading: CesiumMath.toRadians(GIS_INITIAL_VIEW.headingDeg),
      pitch: CesiumMath.toRadians(GIS_INITIAL_VIEW.pitchDeg),
      roll: CesiumMath.toRadians(GIS_INITIAL_VIEW.rollDeg)
    },
    duration: GIS_INITIAL_VIEW.flyDurationSec,
    easingFunction: EasingFunction.QUADRATIC_IN_OUT
  })
}
