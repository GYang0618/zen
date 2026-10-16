import {
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Ellipsoid,
  Matrix3,
  Quaternion
} from 'cesium'

import { GIS_ROAM_CONFIG } from '../../constants'
import { modelAxisForward, modelAxisLeft, modelAxisUp } from './model'
import { clampCartesianToTerrain, liftAboveTerrain } from './terrain'

import type { FlightPathSample, GroundPathSample } from '../geo-utils'
import type { FlightTrajectory, GroundTrajectory } from './guide'
import type { RoamVehicleConfig } from './model'
import type { GlobeHeightSource } from './terrain'

const FIGHTER_BANK_MIN_SPEED_MPS = 30
const GRAVITY_MPS2 = 9.81
const FIGHTER_BANK_LIMIT_RAD = 1.05
const FIGHTER_BANK_RESPONSE = 4
const ORIENTATION_RESPONSE = 16
const MAX_SMOOTH_DT_SEC = 0.2
const AXIS_EPSILON_DEG = 0.01
const ROLL_EPSILON_DEG = 0.05

const scratchFlight: FlightPathSample = {
  position: new Cartesian3(),
  forwardDir: new Cartesian3(),
  altitudeMeters: 0,
  pitchDeg: 0,
  phase: 'taxi_start',
  targetSpeedKmh: 0
}
const scratchGround: GroundPathSample = {
  position: new Cartesian3(),
  forwardDir: new Cartesian3()
}
const scratchForward = new Cartesian3()
const scratchUp = new Cartesian3()
const scratchLeft = new Cartesian3()
const scratchLateral = new Cartesian3()
const scratchVertical = new Cartesian3()
const scratchReject = new Cartesian3()
const scratchTurnAxis = new Cartesian3()
const scratchBasis = new Matrix3()
const scratchOrientation = new Quaternion()
const scratchSpin = new Quaternion()
const scratchCartographic = new Cartographic()

export interface RoamAttitude {
  bankDeg: number
  hasPrevForward: boolean
  prevForward: Cartesian3
  orientationInitialized: boolean
}

export interface RoamPoseInput {
  isAir: boolean
  isFighter: boolean
  flightTraj: FlightTrajectory | null
  groundTraj: GroundTrajectory | null
  distanceTraveled: number
  dt: number
  currentSpeedMps: number
  pathPitchDeg: number
  lateralOffsetM: number
  verticalOffsetM: number
  actionPitchDeg: number
  actionYawDeg: number
  heldBankDeg: number
  headingOffsetDeg: number
  forwardDir: Cartesian3
  config: RoamVehicleConfig
  globe: GlobeHeightSource | undefined
  position: Cartesian3
  orientation: Quaternion
  attitude: RoamAttitude
  lastTerrainHeight: number | undefined
}

/** 把弧长采样、贴地和机体姿态写进 position / orientation。返回本帧地形高。 */
export function integrateRoamPose(input: RoamPoseInput): number | undefined {
  const rawPosition = sampleRawPosition(input)
  const forward = Cartesian3.clone(input.forwardDir, scratchForward)
  const up = alignUp(rawPosition, forward)
  Cartesian3.cross(up, forward, scratchLeft)
  Cartesian3.normalize(scratchLeft, scratchLeft)

  // Cesium 的 +Y 是左侧。指令里向左为负，所以横向位移沿 -Left。
  Cartesian3.multiplyByScalar(scratchLeft, -input.lateralOffsetM, scratchLateral)
  Cartesian3.multiplyByScalar(up, input.verticalOffsetM, scratchVertical)
  Cartesian3.add(rawPosition, scratchLateral, input.position)

  let terrainHeight = input.lastTerrainHeight
  if (input.config.clampToGround) {
    terrainHeight = placeOnGround(input, terrainHeight)
  } else if (input.isAir) {
    const clearance = input.isFighter
      ? GIS_ROAM_CONFIG.fighter.altitudeOffset
      : GIS_ROAM_CONFIG.plane.gearHeightMeters
    terrainHeight = liftAboveTerrain(input.globe, input.position, clearance, terrainHeight)
  }
  Cartesian3.add(input.position, scratchVertical, input.position)

  const pathBank = fighterPathBank(input, forward, up)
  writeOrientation(input, forward, scratchLeft, up, pathBank)
  return terrainHeight
}

function sampleRawPosition(input: RoamPoseInput): Cartesian3 {
  if (input.isAir && input.flightTraj) {
    const sample = input.flightTraj.sampleAtDistance(input.distanceTraveled, scratchFlight)
    return sample.position
  }
  if (input.groundTraj) {
    const sample = input.groundTraj.sampleAtDistance(input.distanceTraveled, scratchGround)
    return sample.position
  }
  return input.position
}

function alignUp(position: Cartesian3, forward: Cartesian3): Cartesian3 {
  const normal = Ellipsoid.WGS84.geodeticSurfaceNormal(position, scratchUp)
  const along = Cartesian3.dot(normal, forward)
  Cartesian3.multiplyByScalar(forward, along, scratchReject)
  Cartesian3.subtract(normal, scratchReject, scratchUp)
  return Cartesian3.normalize(scratchUp, scratchUp)
}

function placeOnGround(
  input: RoamPoseInput,
  terrainHeight: number | undefined
): number | undefined {
  const nextHeight = clampCartesianToTerrain(input.globe, input.position, terrainHeight)
  const { config } = input
  if (!('originLiftMeters' in config) || config.originLiftMeters <= 0 || nextHeight === undefined) {
    return nextHeight
  }

  const carto = Cartographic.fromCartesian(input.position, Ellipsoid.WGS84, scratchCartographic)
  if (!carto) return nextHeight
  carto.height += config.originLiftMeters
  Cartesian3.fromRadians(
    carto.longitude,
    carto.latitude,
    carto.height,
    Ellipsoid.WGS84,
    input.position
  )
  return nextHeight
}

function fighterPathBank(input: RoamPoseInput, forward: Cartesian3, up: Cartesian3): number {
  if (!input.isFighter) return 0
  const { attitude } = input
  let pathBankDeg = 0
  if (
    attitude.hasPrevForward &&
    input.dt > 0 &&
    input.currentSpeedMps > FIGHTER_BANK_MIN_SPEED_MPS
  ) {
    Cartesian3.cross(attitude.prevForward, forward, scratchTurnAxis)
    const sinTurn = Cartesian3.dot(scratchTurnAxis, up)
    const omega = Math.asin(Math.max(-1, Math.min(1, sinTurn))) / input.dt
    const coordBank = Math.atan2(input.currentSpeedMps * omega, GRAVITY_MPS2)
    pathBankDeg = CesiumMath.toDegrees(
      Math.max(-FIGHTER_BANK_LIMIT_RAD, Math.min(FIGHTER_BANK_LIMIT_RAD, -coordBank))
    )
  }
  const alpha = 1 - Math.exp(-FIGHTER_BANK_RESPONSE * Math.min(MAX_SMOOTH_DT_SEC, input.dt))
  attitude.bankDeg += (pathBankDeg - attitude.bankDeg) * alpha
  Cartesian3.clone(forward, attitude.prevForward)
  attitude.hasPrevForward = true
  return attitude.bankDeg
}

function writeOrientation(
  input: RoamPoseInput,
  forward: Cartesian3,
  left: Cartesian3,
  up: Cartesian3,
  pathBankDeg: number
) {
  Matrix3.fromColumnMajorArray(
    [forward.x, forward.y, forward.z, left.x, left.y, left.z, up.x, up.y, up.z],
    scratchBasis
  )
  const target = Quaternion.fromRotationMatrix(scratchBasis, scratchOrientation)
  applyLocalAxes(target, input, pathBankDeg)

  if (!input.attitude.orientationInitialized) {
    Quaternion.clone(target, input.orientation)
    input.attitude.orientationInitialized = true
    return
  }

  const alpha = 1 - Math.exp(-ORIENTATION_RESPONSE * Math.min(MAX_SMOOTH_DT_SEC, input.dt))
  Quaternion.slerp(input.orientation, target, alpha, input.orientation)
}

function applyLocalAxes(orientation: Quaternion, input: RoamPoseInput, pathBankDeg: number) {
  const totalYaw = input.headingOffsetDeg + input.actionYawDeg
  const totalPitch = input.pathPitchDeg + input.actionPitchDeg
  const totalRoll = pathBankDeg + input.heldBankDeg

  if (Math.abs(totalYaw) > AXIS_EPSILON_DEG) {
    // 局部 +Z 正转把机头拨向左侧。指令里负角度表示向左，因此取反。
    Quaternion.fromAxisAngle(modelAxisUp, CesiumMath.toRadians(-totalYaw), scratchSpin)
    Quaternion.multiply(orientation, scratchSpin, orientation)
  }
  if (Math.abs(totalPitch) > AXIS_EPSILON_DEG) {
    Quaternion.fromAxisAngle(modelAxisLeft, CesiumMath.toRadians(-totalPitch), scratchSpin)
    Quaternion.multiply(orientation, scratchSpin, orientation)
  }
  if (Math.abs(totalRoll) > ROLL_EPSILON_DEG) {
    Quaternion.fromAxisAngle(modelAxisForward, CesiumMath.toRadians(totalRoll), scratchSpin)
    Quaternion.multiply(orientation, scratchSpin, orientation)
  }
}
