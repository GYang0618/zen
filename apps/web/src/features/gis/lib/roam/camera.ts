import {
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Ellipsoid,
  HeadingPitchRange,
  Matrix3,
  Matrix4,
  Transforms
} from 'cesium'

import { GIS_ACTION_CONFIG } from '../../constants'

import type { Quaternion, Viewer } from 'cesium'
import type { GisRoamViewMode } from '../../constants'
import type { GisRoamViewTarget } from '../../stores/gis-roam'
import type { RoamVehicleConfig } from './model'

const FREE_VIEW_INITIAL_PITCH_DEG = -35
const FREE_VIEW_MIN_RANGE_METERS = 1
const FREE_VIEW_FALLBACK_RATIO = 0.7
const CAMERA_MIN_CLEARANCE_METERS = 1.2
const LOOK_MIN_DISTANCE_SQ = 1
const LOOK_UP_EPSILON_SQ = 1e-4
const LOOK_UP_FALLBACK_EPSILON_SQ = 1e-8

const scratchMatrix3 = new Matrix3()
const scratchMatrix4 = new Matrix4()
const scratchLocalOffset = new Cartesian3()
const scratchWorldOffset = new Cartesian3()
const scratchCamera = new Cartesian3()
const scratchAim = new Cartesian3()
const scratchPlaneUp = new Cartesian3()
const scratchPlaneForward = new Cartesian3()
const scratchLook = new Cartesian3()
const scratchUp = new Cartesian3()
const scratchReject = new Cartesian3()
const scratchLocalDir = new Cartesian3()
const scratchLocalUp = new Cartesian3()
const scratchWorldDir = new Cartesian3()
const scratchWorldUp = new Cartesian3()
const scratchCartographic = new Cartographic()

export interface RoamCameraRig {
  initialized: boolean
  lastViewMode: GisRoamViewMode
  lastTarget: GisRoamViewTarget
}

export function releaseRoamCamera(viewer: Viewer) {
  viewer.camera.lookAtTransform(Matrix4.IDENTITY)
}

export function updateRoamCamera(input: {
  viewer: Viewer
  config: RoamVehicleConfig
  position: Cartesian3
  orientation: Quaternion
  viewMode: GisRoamViewMode
  viewTarget: GisRoamViewTarget
  airdropPosition: Cartesian3 | null
  rig: RoamCameraRig
}) {
  const { viewMode, viewTarget, airdropPosition } = input
  if (viewTarget === 'airdrop' && airdropPosition && viewMode !== 'free') {
    trackAirdrop(input, airdropPosition)
    return
  }
  if (viewMode === 'free') {
    trackFree(input)
    return
  }
  trackChase(input)
}

function trackAirdrop(
  input: {
    viewer: Viewer
    config: RoamVehicleConfig
    position: Cartesian3
    orientation: Quaternion
    rig: RoamCameraRig
  },
  airdropPosition: Cartesian3
) {
  const { viewer, config, rig } = input
  if (rig.lastTarget !== 'airdrop') {
    rig.lastTarget = 'airdrop'
    rig.initialized = false
  }
  if (rig.lastViewMode === 'free') {
    viewer.camera.lookAtTransform(Matrix4.IDENTITY)
    rig.initialized = false
  }

  const rotation = Matrix3.fromQuaternion(input.orientation, scratchMatrix3)
  const seat = config.firstPerson.offset
  const sideOffset = GIS_ACTION_CONFIG.plane.airdrop.cockpitSideOffsetMeters
  scratchLocalOffset.x = seat.x
  scratchLocalOffset.y = seat.y + sideOffset
  scratchLocalOffset.z = seat.z
  Matrix3.multiplyByVector(rotation, scratchLocalOffset, scratchWorldOffset)
  const cockpit = Cartesian3.add(input.position, scratchWorldOffset, scratchCamera)

  const surfaceUp = Ellipsoid.WGS84.geodeticSurfaceNormal(airdropPosition, scratchPlaneUp)
  const canopyOffset = GIS_ACTION_CONFIG.plane.airdrop.canopyHeightMeters * 0.5
  Cartesian3.multiplyByScalar(surfaceUp, canopyOffset, scratchPlaneForward)
  Cartesian3.add(airdropPosition, scratchPlaneForward, scratchAim)
  Matrix3.getColumn(rotation, 2, scratchPlaneUp)
  Matrix3.getColumn(rotation, 0, scratchPlaneForward)
  lookFromCockpitAt(viewer, cockpit, scratchAim, scratchPlaneUp, scratchPlaneForward)
}

function trackFree(input: {
  viewer: Viewer
  config: RoamVehicleConfig
  position: Cartesian3
  rig: RoamCameraRig
}) {
  const { viewer, config, rig } = input
  if (rig.lastTarget !== 'vehicle') {
    rig.lastTarget = 'vehicle'
    rig.initialized = false
  }

  const transform = Transforms.eastNorthUpToFixedFrame(
    input.position,
    Ellipsoid.WGS84,
    scratchMatrix4
  )
  if (rig.lastViewMode !== 'free' || !rig.initialized) {
    rig.lastViewMode = 'free'
    rig.initialized = true
    viewer.camera.lookAtTransform(
      transform,
      new HeadingPitchRange(
        viewer.camera.heading,
        CesiumMath.toRadians(FREE_VIEW_INITIAL_PITCH_DEG),
        config.freeOverviewDistanceMeters
      )
    )
    return
  }

  const localOffset = Cartesian3.clone(viewer.camera.position, scratchLocalOffset)
  const distance = Cartesian3.magnitude(localOffset)
  if (distance < FREE_VIEW_MIN_RANGE_METERS || Number.isNaN(distance)) {
    const range = config.freeOverviewDistanceMeters * FREE_VIEW_FALLBACK_RATIO
    localOffset.x = -range
    localOffset.y = 0
    localOffset.z = range
  }
  viewer.camera.lookAtTransform(transform, localOffset)
}

function trackChase(input: {
  viewer: Viewer
  config: RoamVehicleConfig
  position: Cartesian3
  orientation: Quaternion
  viewMode: GisRoamViewMode
  rig: RoamCameraRig
}) {
  const { viewer, config, rig, viewMode } = input
  if (rig.lastViewMode === 'free') {
    viewer.camera.lookAtTransform(Matrix4.IDENTITY)
    rig.initialized = false
  }
  if (rig.lastTarget !== 'vehicle') {
    rig.lastTarget = 'vehicle'
    rig.initialized = false
  }
  if (viewMode !== rig.lastViewMode) {
    rig.lastViewMode = viewMode
    rig.initialized = false
  }

  const rotation = Matrix3.fromQuaternion(input.orientation, scratchMatrix3)
  const cameraConfig = viewMode === 'first_person' ? config.firstPerson : config.thirdPerson
  scratchLocalOffset.x = cameraConfig.offset.x
  scratchLocalOffset.y = cameraConfig.offset.y
  scratchLocalOffset.z = cameraConfig.offset.z
  Matrix3.multiplyByVector(rotation, scratchLocalOffset, scratchWorldOffset)
  const cameraPosition = Cartesian3.add(input.position, scratchWorldOffset, scratchCamera)
  liftCameraAboveGround(viewer, config, cameraPosition, cameraConfig.offset.z)

  const pitch = CesiumMath.toRadians(cameraConfig.pitchDeg)
  scratchLocalDir.x = Math.cos(pitch)
  scratchLocalDir.y = 0
  scratchLocalDir.z = Math.sin(pitch)
  scratchLocalUp.x = -Math.sin(pitch)
  scratchLocalUp.y = 0
  scratchLocalUp.z = Math.cos(pitch)

  const direction = Matrix3.multiplyByVector(rotation, scratchLocalDir, scratchWorldDir)
  const up = Matrix3.multiplyByVector(rotation, scratchLocalUp, scratchWorldUp)
  Cartesian3.normalize(direction, direction)
  Cartesian3.normalize(up, up)
  viewer.camera.setView({
    destination: cameraPosition,
    orientation: { direction, up }
  })
}

function liftCameraAboveGround(
  viewer: Viewer,
  config: RoamVehicleConfig,
  cameraPosition: Cartesian3,
  offsetZ: number
) {
  if (!config.clampToGround || !viewer.scene.globe) return
  const carto = Cartographic.fromCartesian(
    cameraPosition,
    viewer.scene.globe.ellipsoid,
    scratchCartographic
  )
  if (!carto) return

  const terrainHeight = viewer.scene.globe.getHeight(carto) ?? 0
  const minHeight = terrainHeight + Math.max(CAMERA_MIN_CLEARANCE_METERS, offsetZ)
  if (carto.height >= minHeight) return
  carto.height = minHeight
  Cartesian3.fromRadians(
    carto.longitude,
    carto.latitude,
    carto.height,
    viewer.scene.globe.ellipsoid,
    cameraPosition
  )
}

function lookFromCockpitAt(
  viewer: Viewer,
  cockpitPosition: Cartesian3,
  aimPosition: Cartesian3,
  planeUp: Cartesian3,
  planeForward: Cartesian3
) {
  Cartesian3.subtract(aimPosition, cockpitPosition, scratchLook)
  const distanceSq = Cartesian3.magnitudeSquared(scratchLook)
  if (distanceSq < LOOK_MIN_DISTANCE_SQ) return
  Cartesian3.multiplyByScalar(scratchLook, 1 / Math.sqrt(distanceSq), scratchLook)

  rejectLookComponent(planeUp, scratchLook, scratchUp)
  if (Cartesian3.magnitudeSquared(scratchUp) < LOOK_UP_EPSILON_SQ) {
    rejectLookComponent(planeForward, scratchLook, scratchUp)
  }
  if (Cartesian3.magnitudeSquared(scratchUp) < LOOK_UP_FALLBACK_EPSILON_SQ) return
  Cartesian3.normalize(scratchUp, scratchUp)

  viewer.camera.setView({
    destination: cockpitPosition,
    orientation: { direction: scratchLook, up: scratchUp }
  })
}

function rejectLookComponent(axis: Cartesian3, lookDir: Cartesian3, result: Cartesian3) {
  const along = Cartesian3.dot(axis, lookDir)
  Cartesian3.multiplyByScalar(lookDir, along, scratchReject)
  Cartesian3.subtract(axis, scratchReject, result)
}
