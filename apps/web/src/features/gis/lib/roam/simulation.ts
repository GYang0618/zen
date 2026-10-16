import { Cartesian3, PerspectiveFrustum, Quaternion } from 'cesium'

import { GIS_ROAM_CONFIG, GIS_ROAM_SPEED_MULTIPLIER_LIMITS } from '../../constants'
import { useGisRoamStore } from '../../stores/gis-roam'
import { createDc10Articulation } from '../dc10-articulation'
import {
  createFlightTrajectory,
  createGroundTrajectory,
  createPatrolTrajectory
} from '../geo-utils'
import { openRoamAction, stepRoamAction } from './actions'
import { RoamAirdrops } from './airdrop'
import { releaseRoamCamera, updateRoamCamera } from './camera'
import { copyTrajectoryOrigin, sampleRoamGuide } from './guide'
import {
  createRoamEntity,
  isAirVehicle,
  liveNodeTransformations,
  vehicleWheelNodes,
  vehicleWheelSpin,
  writeRoamModelMatrix
} from './model'
import { integrateRoamPose } from './pose'
import { kmhToMps, mpsToKmh } from './units'

import type { Entity, Viewer } from 'cesium'
import type { GisRoamViewMode } from '../../constants'
import type {
  GisAirdropInfo,
  GisFlightPhase,
  GisRoamVehicle,
  GisRoamViewTarget,
  GisWaypoint
} from '../../stores/gis-roam'
import type { RoamActionRuntime } from './actions'
import type { RoamCameraRig } from './camera'
import type { FlightTrajectory, GroundTrajectory } from './guide'
import type { RoamModelPrimitive } from './model'
import type { RoamAttitude } from './pose'

const MIN_FRAME_DT_SEC = 0.001
const MAX_FRAME_DT_SEC = 0.1
const PHYSICS_REPORT_INTERVAL_MS = 100
const UNKNOWN_REMAINING_SEC = 9999
const MIN_ETA_SPEED_MPS = 0.1
const AIRDROP_VIEW_RETURN_DELAY_MS = 2000
const MOVING_SPEED_MPS = 0.05
const CLOCK_SPEED_EPSILON = 0.01
const CAMERA_NEAR_METERS = 0.1

interface RoamMotion {
  targetMps: number
  lateralOffsetM: number
  verticalOffsetM: number
  pitchDeg: number
  yawDeg: number
}

export interface RoamSimulationHooks {
  stopRoam: () => void
  clearAction: () => void
  updatePhysicsState: (params: {
    currentSpeedKmh: number
    remainingRealSeconds: number
    roamProgress: number
    flightPhase?: GisFlightPhase
  }) => void
  setViewTarget: (target: GisRoamViewTarget) => void
  setAirdropInfo: (info: GisAirdropInfo | null) => void
}

/** 启动一趟漫游。路程无效时返回 null，调用方不需要清理。 */
export function startRoamSimulation(input: {
  viewer: Viewer
  vehicleType: GisRoamVehicle
  waypoints: GisWaypoint[]
  entityRef: { current: Entity | null }
  hooks: RoamSimulationHooks
}): (() => void) | null {
  const session = RoamSession.tryCreate(input)
  return session ? () => session.dispose() : null
}

class RoamSession {
  private readonly viewer: Viewer
  private readonly vehicleType: GisRoamVehicle
  private readonly waypoints: GisWaypoint[]
  private readonly entityRef: { current: Entity | null }
  private readonly hooks: RoamSimulationHooks
  private readonly config: (typeof GIS_ROAM_CONFIG)[GisRoamVehicle]
  private readonly isAir: boolean
  private readonly isFighter: boolean
  private readonly flightTraj: FlightTrajectory | null
  private readonly groundTraj: GroundTrajectory | null
  private readonly totalDistance: number
  private readonly position = new Cartesian3()
  private readonly orientation = new Quaternion()
  private readonly forwardDir = new Cartesian3()
  private readonly motion: RoamMotion = {
    targetMps: 0,
    lateralOffsetM: 0,
    verticalOffsetM: 0,
    pitchDeg: 0,
    yawDeg: 0
  }
  private readonly attitude: RoamAttitude = {
    bankDeg: 0,
    hasPrevForward: false,
    prevForward: new Cartesian3(),
    orientationInitialized: false
  }
  private readonly cameraRig: RoamCameraRig
  private readonly airdrops = new RoamAirdrops()
  private readonly timeouts: number[] = []
  private readonly articulation: ReturnType<typeof createDc10Articulation> | null
  private readonly prevClockMultiplier: number
  private readonly prevNear: number

  private distanceTraveled = 0
  private currentSpeedMps = 0
  private heldBankDeg = 0
  private flightPhase: GisFlightPhase
  private guideTargetKmh = 0
  private lastTerrainHeight: number | undefined
  private lastFrameTime = performance.now()
  private lastReportedKmh = -1
  private lastReportedSec = -1
  private lastReportAt = 0
  private runtime: RoamActionRuntime | null = null
  private modelPrimitive: RoamModelPrimitive | undefined
  private entity: Entity | null = null
  private removeListener: (() => void) | null = null
  private disposed = false

  private constructor(
    viewer: Viewer,
    vehicleType: GisRoamVehicle,
    waypoints: GisWaypoint[],
    entityRef: { current: Entity | null },
    hooks: RoamSimulationHooks,
    config: (typeof GIS_ROAM_CONFIG)[GisRoamVehicle],
    isAir: boolean,
    isFighter: boolean,
    flightTraj: FlightTrajectory | null,
    groundTraj: GroundTrajectory | null,
    totalDistance: number
  ) {
    this.viewer = viewer
    this.vehicleType = vehicleType
    this.waypoints = waypoints
    this.entityRef = entityRef
    this.hooks = hooks
    this.config = config
    this.isAir = isAir
    this.isFighter = isFighter
    this.flightTraj = flightTraj
    this.groundTraj = groundTraj
    this.totalDistance = totalDistance
    this.flightPhase = isFighter ? 'patrol' : isAir ? 'taxi_start' : 'cruise'
    this.cameraRig = {
      initialized: false,
      lastViewMode: useGisRoamStore.getState().viewMode,
      lastTarget: 'vehicle'
    }
    this.articulation = vehicleType === 'plane' ? createDc10Articulation() : null
    this.prevClockMultiplier = viewer.clock.multiplier
    this.prevNear =
      viewer.camera.frustum instanceof PerspectiveFrustum ? viewer.camera.frustum.near : 1
  }

  static tryCreate(input: {
    viewer: Viewer
    vehicleType: GisRoamVehicle
    waypoints: GisWaypoint[]
    entityRef: { current: Entity | null }
    hooks: RoamSimulationHooks
  }): RoamSession | null {
    const isFighter = input.vehicleType === 'fighter'
    const isAir = isAirVehicle(input.vehicleType)
    const groundTraj = isAir ? null : createGroundTrajectory(input.waypoints)
    const flightTraj = isFighter
      ? createPatrolTrajectory(input.waypoints)
      : isAir
        ? createFlightTrajectory(input.waypoints)
        : null
    const totalDistance = isAir
      ? (flightTraj?.totalDistance ?? 0)
      : (groundTraj?.totalDistance ?? 0)
    if (totalDistance <= 0) return null

    const session = new RoamSession(
      input.viewer,
      input.vehicleType,
      input.waypoints,
      input.entityRef,
      input.hooks,
      GIS_ROAM_CONFIG[input.vehicleType],
      isAir,
      isFighter,
      flightTraj,
      groundTraj,
      totalDistance
    )
    session.mount()
    return session
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.removeListener?.()
    for (const timeoutId of this.timeouts) window.clearTimeout(timeoutId)
    this.viewer.clock.multiplier = this.prevClockMultiplier
    this.viewer.clock.shouldAnimate = false
    releaseRoamCamera(this.viewer)
    this.restoreNearPlane()
    if (this.entityRef.current) {
      this.viewer.entities.remove(this.entityRef.current)
      this.entityRef.current = null
    }
    this.entity = null
    this.airdrops.clear(this.viewer)
    this.hooks.setAirdropInfo(null)
  }

  private mount() {
    copyTrajectoryOrigin(this.isAir, this.flightTraj, this.groundTraj, this.position)
    const nodeTransformations =
      this.vehicleType === 'vehicle'
        ? vehicleWheelNodes
        : this.articulation
          ? liveNodeTransformations(this.articulation.nodes)
          : undefined
    this.entity = createRoamEntity({
      viewer: this.viewer,
      vehicleType: this.vehicleType,
      viewMode: useGisRoamStore.getState().viewMode,
      position: this.position,
      orientation: this.orientation,
      nodeTransformations
    })
    this.entityRef.current = this.entity
    if (this.viewer.trackedEntity) this.viewer.trackedEntity = undefined
    if (this.viewer.camera.frustum instanceof PerspectiveFrustum) {
      this.viewer.camera.frustum.near = CAMERA_NEAR_METERS
    }
    this.removeListener = this.viewer.scene.preUpdate.addEventListener(this.tick)
  }

  private tick = () => {
    if (this.disposed) return
    const now = performance.now()
    const dt = this.readDt(now)
    const { min, max } = GIS_ROAM_SPEED_MULTIPLIER_LIMITS
    const multiplier = Math.max(min, Math.min(max, useGisRoamStore.getState().speedMultiplier || 1))
    const phase = useGisRoamStore.getState().phase
    if (phase !== 'roaming' && phase !== 'paused') return

    const paused = phase === 'paused'
    if (!this.advance(dt * multiplier, paused)) return
    this.syncPresentation(dt * multiplier, paused, multiplier)
    this.report(now, multiplier, paused)
  }

  private readDt(now: number): number {
    const dt = Math.min(
      MAX_FRAME_DT_SEC,
      Math.max(MIN_FRAME_DT_SEC, (now - this.lastFrameTime) / 1000)
    )
    this.lastFrameTime = now
    return dt
  }

  private advance(dt: number, paused: boolean): boolean {
    const store = useGisRoamStore.getState()
    const guide = sampleRoamGuide({
      isAir: this.isAir,
      flightTraj: this.flightTraj,
      groundTraj: this.groundTraj,
      distanceTraveled: this.distanceTraveled,
      flightPhase: this.flightPhase,
      targetKmh: store.targetSpeedKmh,
      forwardDir: this.forwardDir
    })
    this.flightPhase = guide.flightPhase
    this.guideTargetKmh = guide.targetKmh
    this.consumeAction(store.activeAction, kmhToMps(guide.targetKmh), dt, store.viewMode)

    if (!paused) this.integrateSpeed(this.motion.targetMps, dt)
    if (!paused && this.currentSpeedMps > 0) this.distanceTraveled += this.currentSpeedMps * dt
    this.articulation?.update(
      this.flightPhase,
      paused ? 0 : dt,
      this.currentSpeedMps,
      !paused && this.currentSpeedMps > MOVING_SPEED_MPS
    )
    if (this.distanceTraveled >= this.totalDistance) {
      this.hooks.stopRoam()
      return false
    }

    this.lastTerrainHeight = integrateRoamPose({
      isAir: this.isAir,
      isFighter: this.isFighter,
      flightTraj: this.flightTraj,
      groundTraj: this.groundTraj,
      distanceTraveled: this.distanceTraveled,
      dt,
      currentSpeedMps: this.currentSpeedMps,
      pathPitchDeg: guide.pitchDeg,
      lateralOffsetM: this.motion.lateralOffsetM,
      verticalOffsetM: this.motion.verticalOffsetM,
      actionPitchDeg: this.motion.pitchDeg,
      actionYawDeg: this.motion.yawDeg,
      heldBankDeg: this.heldBankDeg,
      headingOffsetDeg: store.headingOffsetDeg,
      forwardDir: this.forwardDir,
      config: this.config,
      globe: this.viewer.scene.globe,
      position: this.position,
      orientation: this.orientation,
      attitude: this.attitude,
      lastTerrainHeight: this.lastTerrainHeight
    })
    return true
  }

  private consumeAction(
    action: ReturnType<typeof useGisRoamStore.getState>['activeAction'],
    targetMps: number,
    dt: number,
    viewMode: GisRoamViewMode
  ) {
    this.motion.targetMps = targetMps
    this.motion.lateralOffsetM = 0
    this.motion.verticalOffsetM = 0
    this.motion.pitchDeg = 0
    this.motion.yawDeg = 0
    if (action && (!this.runtime || this.runtime.action !== action)) {
      this.runtime = openRoamAction(action, this.heldBankDeg)
      if (action.type === 'airdrop' && this.vehicleType === 'plane') this.releaseAirdrop(viewMode)
    }
    if (!this.runtime) return

    const stepped = stepRoamAction(this.runtime, dt, targetMps, this.heldBankDeg, this.isFighter)
    this.motion.targetMps = stepped.targetMps
    this.motion.lateralOffsetM = stepped.lateralOffsetM
    this.motion.verticalOffsetM = stepped.verticalOffsetM
    this.motion.pitchDeg = stepped.pitchDeg
    this.motion.yawDeg = stepped.yawDeg
    this.heldBankDeg = stepped.heldBankDeg
    if (!stepped.done) return
    this.runtime = null
    this.hooks.clearAction()
  }

  private integrateSpeed(targetMps: number, dt: number) {
    const { accelerationMps2, decelerationMps2 } = this.config
    if (this.currentSpeedMps < targetMps) {
      this.currentSpeedMps = Math.min(targetMps, this.currentSpeedMps + accelerationMps2 * dt)
      return
    }
    if (this.currentSpeedMps > targetMps) {
      this.currentSpeedMps = Math.max(targetMps, this.currentSpeedMps - decelerationMps2 * dt)
    }
  }

  private releaseAirdrop(viewMode: GisRoamViewMode) {
    this.airdrops.spawn(this.viewer, this.position, this.waypoints[0]?.height ?? 0)
    if (viewMode !== 'free') this.hooks.setViewTarget('airdrop')
  }

  private syncPresentation(dt: number, paused: boolean, multiplier: number) {
    if (this.entity) {
      this.modelPrimitive = writeRoamModelMatrix({
        viewer: this.viewer,
        entity: this.entity,
        position: this.position,
        orientation: this.orientation,
        headingCorrectionDeg: this.config.headingCorrectionDeg,
        primitive: this.modelPrimitive
      })
    }
    this.syncClock(paused, multiplier)
    this.airdrops.step(dt, () => this.scheduleViewReturn())
    this.airdrops.publish(this.hooks.setAirdropInfo)
    const state = useGisRoamStore.getState()
    updateRoamCamera({
      viewer: this.viewer,
      config: this.config,
      position: this.position,
      orientation: this.orientation,
      viewMode: state.viewMode,
      viewTarget: state.viewTarget,
      airdropPosition: this.airdrops.latestPosition(),
      rig: this.cameraRig
    })
  }

  private syncClock(paused: boolean, multiplier: number) {
    if (this.vehicleType === 'vehicle') {
      const spin = this.distanceTraveled / GIS_ROAM_CONFIG.vehicle.wheelRadiusMeters
      Quaternion.fromAxisAngle(Cartesian3.UNIT_X, spin, vehicleWheelSpin.rotation)
      this.viewer.clock.multiplier = 1
      this.viewer.clock.shouldAnimate = false
      return
    }
    const cruise = Math.max(1, this.config.cruiseSpeedKmh)
    const ratio = Math.max(CLOCK_SPEED_EPSILON, mpsToKmh(this.currentSpeedMps) / cruise)
    this.viewer.clock.multiplier = ratio * multiplier
    this.viewer.clock.shouldAnimate = !paused && this.currentSpeedMps > MOVING_SPEED_MPS
  }

  private scheduleViewReturn() {
    if (useGisRoamStore.getState().viewTarget !== 'airdrop') return
    const timeoutId = window.setTimeout(() => {
      if (useGisRoamStore.getState().viewTarget === 'airdrop') this.hooks.setViewTarget('vehicle')
    }, AIRDROP_VIEW_RETURN_DELAY_MS)
    this.timeouts.push(timeoutId)
  }

  private report(now: number, multiplier: number, paused: boolean) {
    const remainingDist = Math.max(0, this.totalDistance - this.distanceTraveled)
    const currentKmh = Math.round(mpsToKmh(this.currentSpeedMps))
    const effectiveSpeed = this.currentSpeedMps * multiplier
    const remainingSec =
      effectiveSpeed > MIN_ETA_SPEED_MPS
        ? Math.round(remainingDist / effectiveSpeed)
        : UNKNOWN_REMAINING_SEC
    const progress = Math.min(1, Math.max(0, this.distanceTraveled / this.totalDistance))
    const changed = currentKmh !== this.lastReportedKmh || remainingSec !== this.lastReportedSec
    const due =
      now - this.lastReportAt > PHYSICS_REPORT_INTERVAL_MS ||
      currentKmh === Math.round(this.guideTargetKmh) ||
      paused
    if (!changed || !due) return

    this.lastReportedKmh = currentKmh
    this.lastReportedSec = remainingSec
    this.lastReportAt = now
    this.hooks.updatePhysicsState({
      currentSpeedKmh: currentKmh,
      remainingRealSeconds: remainingSec,
      roamProgress: progress,
      flightPhase: this.isAir ? this.flightPhase : undefined
    })
  }

  private restoreNearPlane() {
    if (this.viewer.camera.frustum instanceof PerspectiveFrustum) {
      this.viewer.camera.frustum.near = this.prevNear
    }
  }
}
