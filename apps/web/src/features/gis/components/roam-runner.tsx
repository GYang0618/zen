import {
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Color,
  ConstantProperty,
  Ellipsoid,
  HeadingPitchRange,
  HeightReference,
  Matrix3,
  Matrix4,
  PerspectiveFrustum,
  PolylineGlowMaterialProperty,
  Quaternion,
  Transforms
} from 'cesium'
import { useEffect, useRef } from 'react'

import { useCesium } from '../cesium-provider'
import { GIS_ACTION_CONFIG, GIS_MODEL_PATHS, GIS_ROAM_CONFIG } from '../constants'
import { createDc10Articulation } from '../lib/dc10-articulation'
import {
  createFlightTrajectory,
  createGroundTrajectory,
  createPatrolTrajectory
} from '../lib/geo-utils'
import { useGisRoamStore } from '../stores/gis-roam'

import type { Entity, Viewer } from 'cesium'
import type { FlightPathSample, GroundPathSample } from '../lib/geo-utils'
import type { GisFlightPhase, GisRoamAction, GisRoamVehicle } from '../stores/gis-roam'

function getModelUri(vehicle: GisRoamVehicle): string {
  switch (vehicle) {
    case 'walk':
      return GIS_MODEL_PATHS.pedestrian
    case 'vehicle':
      return GIS_MODEL_PATHS.vehicle
    case 'plane':
      return GIS_MODEL_PATHS.airplane
    case 'fighter':
      return GIS_MODEL_PATHS.fighter
  }
}

function isAirVehicle(vehicle: GisRoamVehicle): boolean {
  return vehicle === 'plane' || vehicle === 'fighter'
}

// 模块级预分配运算临时变量，严禁在逐帧循环中创建垃圾对象
const scratchPosition = new Cartesian3()
const scratchOrientation = new Quaternion()
const scratchLastOrientation = new Quaternion()
const scratchMatrix3 = new Matrix3()
const scratchLocalOffset = new Cartesian3()
const scratchWorldOffset = new Cartesian3()
const scratchCamPosition = new Cartesian3()
const scratchCartographic = new Cartographic()
const scratchLocalDir = new Cartesian3()
const scratchLocalUp = new Cartesian3()
const scratchWorldDir = new Cartesian3()
const scratchWorldUp = new Cartesian3()
const scratchDir = new Cartesian3()
const scratchUp = new Cartesian3()
const scratchLeft = new Cartesian3()
const scratchLateralVec = new Cartesian3()
const scratchVerticalVec = new Cartesian3()
const scratchRotQuat = new Quaternion()
/** 机体局部轴：+X 前、+Y 左、+Z 上。偏航绕上轴，俯仰绕左轴，坡度绕前轴。 */
const modelAxisForward = new Cartesian3(1, 0, 0)
const modelAxisLeft = new Cartesian3(0, 1, 0)
const modelAxisUp = new Cartesian3(0, 0, 1)
const scratchPrevForward = new Cartesian3()
const scratchTurnAxis = new Cartesian3()
const scratchAdForward = new Cartesian3()
const scratchAdUp = new Cartesian3()
const scratchAdLeft = new Cartesian3()
const scratchMatrix4 = new Matrix4()
const scratchFlightSample: FlightPathSample = {
  position: new Cartesian3(),
  forwardDir: new Cartesian3(),
  altitudeMeters: 0,
  pitchDeg: 0,
  phase: 'taxi_start',
  targetSpeedKmh: 0
}
const scratchGroundSample: GroundPathSample = {
  position: new Cartesian3(),
  forwardDir: new Cartesian3()
}

/** 车轮枢轴绕局部 +X 转。与 glTF Wheel_Roll 同轴，转角由行驶距离决定。 */
const vehicleWheelSpin = {
  translation: new Cartesian3(0, 0, 0),
  rotation: new Quaternion(),
  scale: new Cartesian3(1, 1, 1)
}
const vehicleWheelNodes = liveNodeTransformations({
  Wheel_FL_Pivot: vehicleWheelSpin,
  Wheel_FR_Pivot: vehicleWheelSpin,
  Wheel_BL_Pivot: vehicleWheelSpin,
  Wheel_BR_Pivot: vehicleWheelSpin
})

/**
 * ModelGraphics 会把 nodeTransformations 收成 PropertyBag，并按对象的键当成节点名。
 * 整包 CallbackProperty 的键是内部字段，关节不会被应用到模型。
 * 每个平移、旋转、缩放单独用回调读当前姿态，Cesium 才会每帧取样。
 */
function liveNodeTransformations(
  nodes: Record<string, { translation: Cartesian3; rotation: Quaternion; scale: Cartesian3 }>
) {
  return Object.fromEntries(
    Object.entries(nodes).map(([name, pose]) => [
      name,
      {
        translation: new CallbackProperty((_time, result) => {
          return Cartesian3.clone(
            pose.translation,
            result instanceof Cartesian3 ? result : new Cartesian3()
          )
        }, false),
        rotation: new CallbackProperty((_time, result) => {
          return Quaternion.clone(
            pose.rotation,
            result instanceof Quaternion ? result : new Quaternion()
          )
        }, false),
        scale: new CallbackProperty((_time, result) => {
          return Cartesian3.clone(
            pose.scale,
            result instanceof Cartesian3 ? result : new Cartesian3()
          )
        }, false)
      }
    ])
  )
}

/** 空投模型的上轴对齐当地法线。glTF 的 +Y 经 Cesium 轴修正后是模型 +Z。 */
function syncAirdropOrientation(position: Cartesian3, orientation: Quaternion) {
  const enu = Transforms.eastNorthUpToFixedFrame(position, Ellipsoid.WGS84, scratchMatrix4)
  Matrix4.getMatrix3(enu, scratchMatrix3)
  Quaternion.fromRotationMatrix(scratchMatrix3, orientation)
}

function rejectLookComponent(axis: Cartesian3, lookDir: Cartesian3, result: Cartesian3) {
  const along = Cartesian3.dot(axis, lookDir)
  Cartesian3.multiplyByScalar(lookDir, along, result)
  Cartesian3.subtract(axis, result, result)
}

/**
 * 相机停在驾驶舱，看向空投。上方向取飞机上轴并去掉沿视线的分量，地平线跟随机身，不再摆动。
 */
function lookFromCockpitAt(
  viewer: Viewer,
  cockpitPosition: Cartesian3,
  aimPosition: Cartesian3,
  planeUp: Cartesian3,
  planeForward: Cartesian3
) {
  Cartesian3.subtract(aimPosition, cockpitPosition, scratchWorldDir)
  const distSq = Cartesian3.magnitudeSquared(scratchWorldDir)
  if (distSq < 1) {
    return
  }
  Cartesian3.multiplyByScalar(scratchWorldDir, 1 / Math.sqrt(distSq), scratchWorldDir)

  rejectLookComponent(planeUp, scratchWorldDir, scratchWorldUp)
  if (Cartesian3.magnitudeSquared(scratchWorldUp) < 1e-4) {
    rejectLookComponent(planeForward, scratchWorldDir, scratchWorldUp)
  }
  if (Cartesian3.magnitudeSquared(scratchWorldUp) < 1e-8) {
    return
  }
  Cartesian3.normalize(scratchWorldUp, scratchWorldUp)

  viewer.camera.setView({
    destination: cockpitPosition,
    orientation: {
      direction: scratchWorldDir,
      up: scratchWorldUp
    }
  })
}

type GlobeHeightSource = {
  getHeight(cartographic: Cartographic): number | undefined
}

type RoamModelPrimitive = {
  id?: Entity
  modelMatrix: Matrix4
  isDestroyed?: () => boolean
}

function isRoamModelPrimitive(value: unknown, entity: Entity): value is RoamModelPrimitive {
  if (typeof value !== 'object' || value === null) return false
  if (!('modelMatrix' in value) || !('id' in value)) return false
  return value.id === entity && value.modelMatrix instanceof Matrix4
}

function findRoamModel(viewer: Viewer, entity: Entity): RoamModelPrimitive | undefined {
  const primitives = viewer.scene.primitives
  for (let index = 0; index < primitives.length; index += 1) {
    const candidate: unknown = primitives.get(index)
    if (isRoamModelPrimitive(candidate, entity)) return candidate
  }
  return undefined
}

/**
 * 用当前地形网格的精确高度替换原点高程，水平位置保持本帧模拟结果。
 * 采不到地形时沿用上一帧，避免掉回椭球面后再弹起。
 */
function clampCartesianToTerrain(
  globe: GlobeHeightSource | undefined,
  position: Cartesian3,
  lastHeight: number | undefined
): number | undefined {
  if (!globe) return lastHeight

  const carto = Cartographic.fromCartesian(position, Ellipsoid.WGS84, scratchCartographic)
  if (!carto) return lastHeight

  const sampled = globe.getHeight(carto)
  const height = typeof sampled === 'number' ? sampled : lastHeight
  if (typeof height !== 'number') return lastHeight

  Cartesian3.fromRadians(carto.longitude, carto.latitude, height, Ellipsoid.WGS84, position)
  return typeof sampled === 'number' ? sampled : lastHeight
}

/** 飞机低于地形加起落架高度时抬升。巡航高于该面时保持飞行包线高度。 */
function liftAboveTerrain(
  globe: GlobeHeightSource | undefined,
  position: Cartesian3,
  clearanceMeters: number,
  lastTerrainHeight: number | undefined
): number | undefined {
  if (!globe) return lastTerrainHeight

  const carto = Cartographic.fromCartesian(position, Ellipsoid.WGS84, scratchCartographic)
  if (!carto) return lastTerrainHeight

  const sampled = globe.getHeight(carto)
  const terrainHeight = typeof sampled === 'number' ? sampled : lastTerrainHeight
  if (typeof terrainHeight !== 'number') return lastTerrainHeight

  const minHeight = terrainHeight + clearanceMeters
  if (carto.height < minHeight) {
    Cartesian3.fromRadians(carto.longitude, carto.latitude, minHeight, Ellipsoid.WGS84, position)
  }
  return typeof sampled === 'number' ? sampled : lastTerrainHeight
}

interface ActiveActionRuntime {
  action: GisRoamAction
  elapsedSec: number
  startSpeedBoost?: number
  /** 绕航线滚转开始时的坡度，用来平滑转到目标坡度 */
  startBankDeg?: number
}

interface AirdropEntityRuntime {
  entity: Entity
  position: Cartesian3
  orientation: Quaternion
  fallSpeedMps: number
  groundHeight: number
  elapsedSec: number
}

export function RoamRunner() {
  const { viewer } = useCesium()
  const phase = useGisRoamStore((state) => state.phase)
  const waypoints = useGisRoamStore((state) => state.waypoints)
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const viewMode = useGisRoamStore((state) => state.viewMode)
  const restartCount = useGisRoamStore((state) => state.restartCount)
  const stopRoam = useGisRoamStore((state) => state.stopRoam)
  const clearAction = useGisRoamStore((state) => state.clearAction)
  const updatePhysicsState = useGisRoamStore((state) => state.updatePhysicsState)

  const viewTarget = useGisRoamStore((state) => state.viewTarget)
  const viewTargetRef = useRef(viewTarget)
  viewTargetRef.current = viewTarget
  const setViewTarget = useGisRoamStore((state) => state.setViewTarget)
  const setAirdropInfo = useGisRoamStore((state) => state.setAirdropInfo)

  const isRoaming = phase === 'roaming'
  const isPaused = phase === 'paused'
  const isActive = isRoaming || isPaused

  const entityRef = useRef<Entity | null>(null)
  const routePolylineRef = useRef<Entity | null>(null)
  const viewModeRef = useRef(viewMode)
  viewModeRef.current = viewMode

  const airdropsRef = useRef<AirdropEntityRuntime[]>([])
  const airdropEntitiesRef = useRef<Entity[]>([])

  // 1. 全程高质感导航路线（地面发光导航线 / 飞机全包线高空走廊）
  useEffect(() => {
    if (phase === 'idle' || waypoints.length < 2) {
      if (routePolylineRef.current) {
        viewer.entities.remove(routePolylineRef.current)
        routePolylineRef.current = null
      }
      return
    }

    const isAir = isAirVehicle(vehicleType)
    let positions: Cartesian3[] = []

    if (vehicleType === 'fighter') {
      const patrolTraj = createPatrolTrajectory(waypoints)
      positions = patrolTraj?.positions ?? []
    } else if (isAir) {
      const flightTraj = createFlightTrajectory(waypoints)
      positions = flightTraj?.positions ?? []
    } else {
      const groundTraj = createGroundTrajectory(waypoints)
      positions = groundTraj?.positions ?? []
    }

    if (positions.length < 2) return

    const material = isAir
      ? new PolylineGlowMaterialProperty({
          glowPower: 0.25,
          color: Color.fromCssColorString('#38bdf8')
        })
      : new PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Color.fromCssColorString('#06b6d4')
        })

    const width = isAir ? 6 : 8
    const clampToGround = !isAir

    if (!routePolylineRef.current) {
      routePolylineRef.current = viewer.entities.add({
        id: 'gis_roam_route',
        name: '漫游路线',
        polyline: {
          positions,
          width,
          material,
          clampToGround
        }
      })
    } else {
      const poly = routePolylineRef.current.polyline
      if (poly) {
        ;(poly as unknown as { positions: unknown }).positions = positions
        ;(poly as unknown as { width: unknown }).width = width
        ;(poly as unknown as { material: unknown }).material = material
        ;(poly as unknown as { clampToGround: unknown }).clampToGround = clampToGround
      }
    }

    return () => {
      if (routePolylineRef.current) {
        viewer.entities.remove(routePolylineRef.current)
        routePolylineRef.current = null
      }
    }
  }, [viewer, phase, waypoints, vehicleType])

  // 2. 视角切换时同步模型可见性：步行第一人称隐藏自身模型，避免视口穿模
  useEffect(() => {
    if (entityRef.current?.model) {
      const hidePedestrian = vehicleType === 'walk' && viewMode === 'first_person'
      entityRef.current.model.show = new ConstantProperty(!hidePedestrian)
    }
  }, [viewMode, vehicleType])

  // 3. 核心物理动力学模拟与逐帧运行引擎
  useEffect(() => {
    // 显式引用 restartCount，当点击重新漫游时驱动动力学积分与相机状态机完全重置
    void restartCount

    if (!isActive || waypoints.length < 2) {
      viewer.camera.lookAtTransform(Matrix4.IDENTITY)
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current)
        entityRef.current = null
      }
      if (viewer.trackedEntity) {
        viewer.trackedEntity = undefined
      }
      return
    }

    const config = GIS_ROAM_CONFIG[vehicleType]
    const modelUri = getModelUri(vehicleType)
    const isFighter = vehicleType === 'fighter'
    const isAir = isAirVehicle(vehicleType)

    // 构建路径积分轨迹
    const groundTraj = !isAir ? createGroundTrajectory(waypoints) : null
    const flightTraj = isFighter
      ? createPatrolTrajectory(waypoints)
      : isAir
        ? createFlightTrajectory(waypoints)
        : null

    const totalDistance = isAir
      ? (flightTraj?.totalDistance ?? 0)
      : (groundTraj?.totalDistance ?? 0)
    if (totalDistance <= 0) return

    // 动力学内部状态（严格从 0 m/s 初始静止起步）
    let distanceTraveled = 0
    let currentSpeedMps = 0
    let lastFrameTime = performance.now()
    let hasOrientation = false
    let isOrientationInitialized = false
    let isCameraInitialized = false
    let lastViewModeForCamera = viewModeRef.current
    let lastTrackedTarget: 'vehicle' | 'airdrop' = 'vehicle'
    let lastReportedAirdropAlt = -1
    let currentFlightPhase: GisFlightPhase = isFighter ? 'patrol' : isAir ? 'taxi_start' : 'cruise'
    let bankDeg = 0
    let heldBankDeg = 0
    let hasPrevForward = false

    const simPosition = new Cartesian3()
    const simOrientation = new Quaternion()

    // 初始位置设定
    if (isAir && flightTraj) {
      const initSample = flightTraj.sampleAtDistance(0, scratchFlightSample)
      Cartesian3.clone(initSample.position, simPosition)
    } else if (groundTraj) {
      const initSample = groundTraj.sampleAtDistance(0, scratchGroundSample)
      Cartesian3.clone(initSample.position, simPosition)
    }
    Cartesian3.clone(simPosition, scratchPosition)

    const planeArticulation = vehicleType === 'plane' ? createDc10Articulation() : null

    // 创建动态回调驱动的模型实体
    const roamEntity = viewer.entities.add({
      id: `gis_roam_${vehicleType}`,
      name: config.label,
      position: new CallbackPositionProperty(() => simPosition, false),
      orientation: new CallbackProperty(() => simOrientation, false),
      model: {
        uri: modelUri,
        minimumPixelSize: 64,
        maximumScale: 100,
        scale: 'modelScale' in config ? config.modelScale : 1,
        // 车辆轮转由行驶距离写入枢轴，不用时钟动画，否则匀速时转速不跟随时速。
        // 客机的起落架和风扇在同一段一次性动画里，跟着时钟播会在滑跑时收起起落架。
        runAnimations: vehicleType === 'walk',
        clampAnimations: false,
        nodeTransformations:
          vehicleType === 'vehicle'
            ? vehicleWheelNodes
            : planeArticulation
              ? liveNodeTransformations(planeArticulation.nodes)
              : undefined,
        // 运动模型禁止 CLAMP_TO_GROUND。Cesium 贴地会把经纬度量化到地形瓦片网格后再覆盖平移，
        // 模型会钉在格子上再跳到下一格；速度越快、瓦片越粗，步长越大。高度在模拟循环里逐帧写入。
        heightReference: HeightReference.NONE
      }
    })

    entityRef.current = roamEntity
    if (viewer.trackedEntity) {
      viewer.trackedEntity = undefined
    }

    // 优化相机近剪裁面
    const prevClockMultiplier = viewer.clock.multiplier
    const prevNear =
      viewer.camera.frustum instanceof PerspectiveFrustum ? viewer.camera.frustum.near : 1.0
    if (viewer.camera.frustum instanceof PerspectiveFrustum) {
      viewer.camera.frustum.near = 0.1
    }

    // 实时动作状态机
    let runtimeAction: ActiveActionRuntime | null = null
    let lastReportedSec = -1
    let lastReportedKmh = -1
    let lastStateUpdateTime = 0
    let lastTerrainHeight: number | undefined
    let roamModelPrimitive: RoamModelPrimitive | undefined

    // 逐帧物理积分与相机追踪
    const onPreUpdateListener = () => {
      const now = performance.now()
      const rawDt = Math.min(0.1, Math.max(0.001, (now - lastFrameTime) / 1000))
      lastFrameTime = now

      const multiplier = Math.max(
        0.1,
        Math.min(32, useGisRoamStore.getState().speedMultiplier || 1)
      )
      const dt = rawDt * multiplier

      const currentPhase = useGisRoamStore.getState().phase
      const isPausedNow = currentPhase === 'paused'

      // 1. 动力学加减速计算
      let targetKmh = useGisRoamStore.getState().targetSpeedKmh
      const accel = config.accelerationMps2
      const decel = config.decelerationMps2

      // 飞机在起飞滑跑/进近着陆时由飞行包线提供拟真引导航速
      let samplePitchDeg = 0
      const baseDir = scratchDir

      if (isAir && flightTraj) {
        const sample = flightTraj.sampleAtDistance(distanceTraveled, scratchFlightSample)
        currentFlightPhase = sample.phase
        samplePitchDeg = sample.pitchDeg
        Cartesian3.clone(sample.forwardDir, baseDir)

        // 若处于滑跑阶段，自动匹配起飞或减速速度，并支持用户手动加速
        if (currentFlightPhase === 'taxi_start') {
          targetKmh = Math.max(sample.targetSpeedKmh, useGisRoamStore.getState().targetSpeedKmh)
        } else if (currentFlightPhase === 'taxi_end') {
          targetKmh = sample.targetSpeedKmh
        }
      } else if (groundTraj) {
        const sample = groundTraj.sampleAtDistance(distanceTraveled, scratchGroundSample)
        Cartesian3.clone(sample.forwardDir, baseDir)
      }

      // 暂停只冻结当前时速，不把目标打成 0。继续时从暂停前的速度接着积分。
      let effectiveTargetMps = targetKmh / 3.6

      // 动作处理逻辑 (跳跃 / 驻留 / 变道超车 / 俯冲爬升 / 旋转30度 / 空投)
      const currentActionFromStore = useGisRoamStore.getState().activeAction
      if (
        currentActionFromStore &&
        (!runtimeAction || runtimeAction.action !== currentActionFromStore)
      ) {
        runtimeAction = {
          action: currentActionFromStore,
          elapsedSec: 0,
          startBankDeg: heldBankDeg
        }
        // 若为变道超车，临时增加提速推力
        if (
          currentActionFromStore.type === 'lane_change_left' ||
          currentActionFromStore.type === 'lane_change_right'
        ) {
          const boost =
            currentActionFromStore.speedBoostKmh ??
            GIS_ACTION_CONFIG.vehicle.laneChange.overtakeSpeedBoostKmh
          runtimeAction.startSpeedBoost = boost / 3.6
        }
        // 若为空投指令，立即生成空投物资箱物理实体
        if (currentActionFromStore.type === 'airdrop' && vehicleType === 'plane') {
          const dropPos = Cartesian3.clone(simPosition, new Cartesian3())
          const orientation = new Quaternion()
          const groundH = waypoints[0].height ?? 0
          syncAirdropOrientation(dropPos, orientation)

          const dropEntity = viewer.entities.add({
            id: `gis_airdrop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: '空投',
            position: new CallbackPositionProperty(() => dropPos, false),
            orientation: new CallbackProperty(() => orientation, false),
            model: {
              uri: GIS_MODEL_PATHS.airdrop,
              heightReference: HeightReference.NONE
            }
          })
          airdropEntitiesRef.current.push(dropEntity)

          airdropsRef.current.push({
            entity: dropEntity,
            position: dropPos,
            orientation,
            fallSpeedMps: GIS_ACTION_CONFIG.plane.airdrop.terminalVelocityMps,
            groundHeight: groundH,
            elapsedSec: 0
          })

          if (viewModeRef.current !== 'free') {
            viewTargetRef.current = 'airdrop'
            setViewTarget('airdrop')
          }
        }
      }

      let actionLateralOffsetM = 0
      let actionVerticalOffsetM = 0
      let actionPitchDeg = 0
      let actionYawDeg = 0
      const actionRollDeg = 0

      if (runtimeAction) {
        runtimeAction.elapsedSec += dt
        const t = runtimeAction.elapsedSec

        switch (runtimeAction.action.type) {
          case 'jump': {
            const duration = GIS_ACTION_CONFIG.walk.jump.durationSec
            if (t <= duration) {
              const normT = t / duration
              actionVerticalOffsetM =
                4 * GIS_ACTION_CONFIG.walk.jump.maxHeightMeters * normT * (1 - normT)
            } else {
              runtimeAction = null
              clearAction()
            }
            break
          }
          case 'pause_briefly': {
            const pauseDuration =
              runtimeAction.action.durationSeconds ?? GIS_ACTION_CONFIG.walk.pause.durationSec
            effectiveTargetMps = 0 // 停步
            if (t >= pauseDuration) {
              runtimeAction = null
              clearAction()
            }
            break
          }
          case 'lane_change_left':
          case 'lane_change_right': {
            const isLeft = runtimeAction.action.type === 'lane_change_left'
            const sign = isLeft ? -1 : 1
            const cfg = GIS_ACTION_CONFIG.vehicle.laneChange
            const totalDuration = cfg.shiftDurationSec * 2 + cfg.holdDurationSec
            const maxLat = cfg.lateralOffsetMeters

            if (t <= cfg.shiftDurationSec) {
              // 变出
              const s = t / cfg.shiftDurationSec
              const curve = s * s * (3 - 2 * s)
              actionLateralOffsetM = sign * maxLat * curve
            } else if (t <= cfg.shiftDurationSec + cfg.holdDurationSec) {
              // 超车保持，同时享受临时推背加速
              actionLateralOffsetM = sign * maxLat
              effectiveTargetMps += runtimeAction.startSpeedBoost ?? 0
            } else if (t <= totalDuration) {
              // 变回
              const s = (t - (cfg.shiftDurationSec + cfg.holdDurationSec)) / cfg.shiftDurationSec
              const curve = 1 - s * s * (3 - 2 * s)
              actionLateralOffsetM = sign * maxLat * curve
            } else {
              actionLateralOffsetM = 0
              runtimeAction = null
              clearAction()
            }
            break
          }
          case 'pitch_up':
          case 'pitch_down': {
            const isUp = runtimeAction.action.type === 'pitch_up'
            const sign = isUp ? 1 : -1
            const cfg = isFighter
              ? GIS_ACTION_CONFIG.fighter.diveClimb
              : GIS_ACTION_CONFIG.plane.diveClimb
            const pitchCap = isFighter ? 40 : 25
            const duration = runtimeAction.action.durationSec ?? cfg.durationSec
            const deltaH = runtimeAction.action.deltaAltitude ?? cfg.deltaAltitudeMeters
            const boostKmh = runtimeAction.action.speedBoostKmh ?? 0

            if (t <= duration) {
              const normT = t / duration
              // 垂直高差正弦平滑过渡
              actionVerticalOffsetM = sign * deltaH * Math.sin(normT * Math.PI)
              // 俯仰角根据高差动态成比例调整
              const maxPitch = Math.min(pitchCap, Math.max(8, (deltaH / 500) * cfg.pitchAngleDeg))
              actionPitchDeg = sign * maxPitch * Math.sin(normT * Math.PI)
              if (boostKmh > 0) {
                effectiveTargetMps += (boostKmh / 3.6) * Math.sin(normT * Math.PI)
              }
            } else {
              runtimeAction = null
              clearAction()
            }
            break
          }
          case 'roll_turn': {
            const cfg = GIS_ACTION_CONFIG.plane.rollTurn
            const deltaH = runtimeAction.action.deltaHeadingDeg
            const absDeltaH = Math.abs(deltaH)
            const duration =
              runtimeAction.action.durationSec ?? Math.max(3.0, (absDeltaH / 30) * cfg.durationSec)
            const boostKmh = runtimeAction.action.speedBoostKmh ?? 0

            if (t <= duration) {
              const normT = t / duration
              const envelope = Math.sin(normT * Math.PI)
              // 绕机体上轴偏航：机头在水平面转向，机尾跟随摆动，机翼保持水平。
              // 包络从 0 到峰值再回到 0，动作结束时机头重新贴回航线切线。
              actionYawDeg = deltaH * envelope
              if (boostKmh > 0) {
                effectiveTargetMps += (boostKmh / 3.6) * envelope
              }
            } else {
              runtimeAction = null
              clearAction()
            }
            break
          }
          case 'roll_axis': {
            const cfg = GIS_ACTION_CONFIG.fighter.rollAxis
            const duration = runtimeAction.action.durationSec ?? cfg.durationSec
            const startBank = runtimeAction.startBankDeg ?? 0
            const targetBank = Math.max(
              -cfg.maxBankDeg,
              Math.min(cfg.maxBankDeg, runtimeAction.action.bankDeg)
            )
            if (t <= duration) {
              const s = t / duration
              const curve = s * s * (3 - 2 * s)
              heldBankDeg = startBank + (targetBank - startBank) * curve
            } else {
              heldBankDeg = targetBank
              runtimeAction = null
              clearAction()
            }
            break
          }
          case 'airdrop': {
            // 空投指令已在触发时刻释放，在此清除
            runtimeAction = null
            clearAction()
            break
          }
        }
      }

      // 暂停时不积分，时速保持按下暂停那一帧的值
      if (!isPausedNow) {
        if (currentSpeedMps < effectiveTargetMps) {
          currentSpeedMps = Math.min(effectiveTargetMps, currentSpeedMps + accel * dt)
        } else if (currentSpeedMps > effectiveTargetMps) {
          currentSpeedMps = Math.max(effectiveTargetMps, currentSpeedMps - decel * dt)
        }
      }

      // 漫游步进距离累加
      if (!isPausedNow && currentSpeedMps > 0) {
        distanceTraveled += currentSpeedMps * dt
      }
      if (planeArticulation && isAir) {
        planeArticulation.update(
          currentFlightPhase,
          isPausedNow ? 0 : dt,
          currentSpeedMps,
          !isPausedNow && currentSpeedMps > 0.05
        )
      }

      // 抵达终点判定
      if (distanceTraveled >= totalDistance) {
        stopRoam()
        return
      }

      // 2. 轨迹坐标与朝向四元数求值
      const rawPos = scratchPosition
      if (isAir && flightTraj) {
        const sample = flightTraj.sampleAtDistance(distanceTraveled, scratchFlightSample)
        Cartesian3.clone(sample.position, rawPos)
      } else if (groundTraj) {
        const sample = groundTraj.sampleAtDistance(distanceTraveled, scratchGroundSample)
        Cartesian3.clone(sample.position, rawPos)
      }

      // 正交姿态基向量构建（保证完全对齐 Cesium 坐标范式：+X 为前进航向，+Z 为地面上矢，+Y 为左侧矢）
      const normalUp = Ellipsoid.WGS84.geodeticSurfaceNormal(rawPos, scratchUp)
      const forwardT = Cartesian3.clone(baseDir, scratchDir)

      // Gram-Schmidt 正交化 Up
      const dotUpDir = Cartesian3.dot(normalUp, forwardT)
      Cartesian3.subtract(
        normalUp,
        Cartesian3.multiplyByScalar(forwardT, dotUpDir, scratchLocalUp),
        scratchUp
      )
      Cartesian3.normalize(scratchUp, scratchUp)

      // Left = Up × Forward
      Cartesian3.cross(scratchUp, forwardT, scratchLeft)
      Cartesian3.normalize(scratchLeft, scratchLeft)

      // 施加横向位移与垂向位移
      // 注：Cesium 中 +Y 为 Left，因此横向偏移 actionLateralOffsetM（向左为负，向右为正）需沿 -Left 方向
      Cartesian3.multiplyByScalar(scratchLeft, -actionLateralOffsetM, scratchLateralVec)
      Cartesian3.multiplyByScalar(scratchUp, actionVerticalOffsetM, scratchVerticalVec)

      const finalPos = Cartesian3.add(rawPos, scratchLateralVec, simPosition)
      if (config.clampToGround) {
        lastTerrainHeight = clampCartesianToTerrain(viewer.scene.globe, finalPos, lastTerrainHeight)
        if (
          'originLiftMeters' in config &&
          config.originLiftMeters > 0 &&
          lastTerrainHeight !== undefined
        ) {
          const carto = Cartographic.fromCartesian(finalPos, Ellipsoid.WGS84, scratchCartographic)
          if (carto) {
            carto.height += config.originLiftMeters
            Cartesian3.fromRadians(
              carto.longitude,
              carto.latitude,
              carto.height,
              Ellipsoid.WGS84,
              finalPos
            )
          }
        }
      } else if (isAir) {
        const clearance = isFighter
          ? GIS_ROAM_CONFIG.fighter.altitudeOffset
          : GIS_ROAM_CONFIG.plane.gearHeightMeters
        lastTerrainHeight = liftAboveTerrain(
          viewer.scene.globe,
          finalPos,
          clearance,
          lastTerrainHeight
        )
      }
      Cartesian3.add(finalPos, scratchVerticalVec, finalPos)
      Cartesian3.clone(finalPos, scratchPosition)

      // 姿态旋转复合：先对齐航线，再绕机体轴偏航 / 俯仰 / 坡度。
      // 后乘是局部轴旋转：偏航绕上轴，俯仰绕左轴。歼-20 转弯再绕前轴压坡。
      const totalPitch = samplePitchDeg + actionPitchDeg
      const totalYaw = useGisRoamStore.getState().headingOffsetDeg + actionYawDeg

      let pathBankDeg = 0
      if (isFighter && hasPrevForward && dt > 0 && currentSpeedMps > 30) {
        Cartesian3.cross(scratchPrevForward, forwardT, scratchTurnAxis)
        const sinTurn = Cartesian3.dot(scratchTurnAxis, scratchUp)
        const omega = Math.asin(Math.max(-1, Math.min(1, sinTurn))) / dt
        const coordBank = Math.atan2(currentSpeedMps * omega, 9.81)
        pathBankDeg = CesiumMath.toDegrees(Math.max(-1.05, Math.min(1.05, -coordBank)))
      }
      if (isFighter) {
        const bankAlpha = 1 - Math.exp(-4 * Math.min(0.2, dt))
        bankDeg += (pathBankDeg - bankDeg) * bankAlpha
        Cartesian3.clone(forwardT, scratchPrevForward)
        hasPrevForward = true
      }
      const totalRoll = bankDeg + heldBankDeg + actionRollDeg

      // 基础正交矩阵
      Matrix3.fromColumnMajorArray(
        [
          forwardT.x,
          forwardT.y,
          forwardT.z,
          scratchLeft.x,
          scratchLeft.y,
          scratchLeft.z,
          scratchUp.x,
          scratchUp.y,
          scratchUp.z
        ],
        scratchMatrix3
      )

      let finalOrient = Quaternion.fromRotationMatrix(scratchMatrix3, scratchOrientation)

      if (Math.abs(totalYaw) > 0.01) {
        // 局部 +Z 正转把机头拨向左侧（+Y）。指令里负角度表示向左，因此取反。
        Quaternion.fromAxisAngle(modelAxisUp, CesiumMath.toRadians(-totalYaw), scratchRotQuat)
        finalOrient = Quaternion.multiply(finalOrient, scratchRotQuat, finalOrient)
      }
      if (Math.abs(totalPitch) > 0.01) {
        Quaternion.fromAxisAngle(modelAxisLeft, CesiumMath.toRadians(-totalPitch), scratchRotQuat)
        finalOrient = Quaternion.multiply(finalOrient, scratchRotQuat, finalOrient)
      }
      if (Math.abs(totalRoll) > 0.05) {
        Quaternion.fromAxisAngle(modelAxisForward, CesiumMath.toRadians(totalRoll), scratchRotQuat)
        finalOrient = Quaternion.multiply(finalOrient, scratchRotQuat, finalOrient)
      }

      if (!isOrientationInitialized) {
        Quaternion.clone(finalOrient, simOrientation)
        isOrientationInitialized = true
      } else {
        // 临界阻尼四元数平滑 (1 - e^(-16 * dt))，高灵敏度同时彻底平抑微小角速度毛刺
        const orientAlpha = 1.0 - Math.exp(-16.0 * Math.min(0.2, dt))
        Quaternion.slerp(simOrientation, finalOrient, orientAlpha, simOrientation)
      }

      Quaternion.clone(simOrientation, scratchLastOrientation)
      hasOrientation = true

      // 实体矩阵要等下一帧的 dataSourceDisplay 才会写到 Model。
      // 相机在本帧 preUpdate 里已经对准新位置，模型若仍停在上一帧，就会相对镜头窜动；速度越快越明显。
      if (
        !roamModelPrimitive ||
        roamModelPrimitive.isDestroyed?.() ||
        roamModelPrimitive.id !== roamEntity
      ) {
        roamModelPrimitive = findRoamModel(viewer, roamEntity)
      }
      if (roamModelPrimitive) {
        Quaternion.clone(simOrientation, scratchOrientation)
        if (Math.abs(config.headingCorrectionDeg) > 0.01) {
          Quaternion.fromAxisAngle(
            modelAxisUp,
            CesiumMath.toRadians(-config.headingCorrectionDeg),
            scratchRotQuat
          )
          Quaternion.multiply(scratchOrientation, scratchRotQuat, scratchOrientation)
        }
        Matrix4.fromRotationTranslation(
          Matrix3.fromQuaternion(scratchOrientation, scratchMatrix3),
          simPosition,
          roamModelPrimitive.modelMatrix
        )
      }

      // 3. 车轮转角 = 行驶距离 / 半径，暂停时距离不动，转速与地面速度一致。
      if (vehicleType === 'vehicle') {
        const spinAngle = distanceTraveled / GIS_ROAM_CONFIG.vehicle.wheelRadiusMeters
        Quaternion.fromAxisAngle(Cartesian3.UNIT_X, spinAngle, vehicleWheelSpin.rotation)
        viewer.clock.multiplier = 1
        viewer.clock.shouldAnimate = false
      } else {
        const baseCruiseKmh = Math.max(1, config.cruiseSpeedKmh)
        const speedRatio = Math.max(0.01, (currentSpeedMps * 3.6) / baseCruiseKmh)
        viewer.clock.multiplier = speedRatio * multiplier
        viewer.clock.shouldAnimate = !isPausedNow && currentSpeedMps > 0.05
      }

      // 4. 空投箱伞降物理更新
      let latestAirdropInfo: {
        isDescending: boolean
        altitudeMeters: number
        groundHeight: number
        etaSeconds: number
      } | null = null

      for (let i = airdropsRef.current.length - 1; i >= 0; i--) {
        const ad = airdropsRef.current[i]
        ad.elapsedSec += dt
        const carto = Cartographic.fromCartesian(ad.position, Ellipsoid.WGS84, scratchCartographic)
        if (carto) {
          const dropDelta = ad.fallSpeedMps * dt
          if (carto.height > ad.groundHeight + 2) {
            carto.height -= dropDelta
            Cartesian3.fromRadians(
              carto.longitude,
              carto.latitude,
              carto.height,
              Ellipsoid.WGS84,
              ad.position
            )
            syncAirdropOrientation(ad.position, ad.orientation)

            const remainingH = Math.max(0, carto.height - ad.groundHeight)
            const eta = Math.round(remainingH / ad.fallSpeedMps)
            latestAirdropInfo = {
              isDescending: true,
              altitudeMeters: Math.round(carto.height),
              groundHeight: Math.round(ad.groundHeight),
              etaSeconds: eta
            }
          } else {
            // 已着陆，物资箱留在落点
            airdropsRef.current.splice(i, 1)

            if (viewTargetRef.current === 'airdrop') {
              setTimeout(() => {
                if (useGisRoamStore.getState().viewTarget === 'airdrop') {
                  setViewTarget('vehicle')
                }
              }, 2000)
            }
          }
        }
      }

      // 实时同步空投状态至 Store
      if (
        (latestAirdropInfo?.altitudeMeters ?? -1) !== lastReportedAirdropAlt ||
        (latestAirdropInfo === null && lastReportedAirdropAlt !== -1)
      ) {
        lastReportedAirdropAlt = latestAirdropInfo?.altitudeMeters ?? -1
        setAirdropInfo(latestAirdropInfo)
      }

      // 5. 视角追踪相机更新
      const currentViewMode = viewModeRef.current
      const currentViewTarget = viewTargetRef.current
      const activeAirdrop =
        airdropsRef.current.length > 0 ? airdropsRef.current[airdropsRef.current.length - 1] : null

      if (
        currentViewTarget === 'airdrop' &&
        activeAirdrop &&
        currentViewMode !== 'free' &&
        hasOrientation
      ) {
        if (lastTrackedTarget !== 'airdrop') {
          lastTrackedTarget = 'airdrop'
          isCameraInitialized = false
        }
        if (lastViewModeForCamera === 'free') {
          viewer.camera.lookAtTransform(Matrix4.IDENTITY)
          isCameraInitialized = false
        }

        const rotMatrix = Matrix3.fromQuaternion(scratchLastOrientation, scratchMatrix3)
        const seat = config.firstPerson.offset
        scratchLocalOffset.x = seat.x
        scratchLocalOffset.y = seat.y + GIS_ACTION_CONFIG.plane.airdrop.cockpitSideOffsetMeters
        scratchLocalOffset.z = seat.z
        Matrix3.multiplyByVector(rotMatrix, scratchLocalOffset, scratchWorldOffset)
        const cockpitPos = Cartesian3.add(finalPos, scratchWorldOffset, scratchCamPosition)

        const boxUp = Ellipsoid.WGS84.geodeticSurfaceNormal(activeAirdrop.position, scratchAdUp)
        Cartesian3.multiplyByScalar(
          boxUp,
          GIS_ACTION_CONFIG.plane.airdrop.canopyHeightMeters * 0.5,
          scratchAdForward
        )
        const aim = Cartesian3.add(activeAirdrop.position, scratchAdForward, scratchAdLeft)
        Matrix3.getColumn(rotMatrix, 2, scratchAdUp)
        Matrix3.getColumn(rotMatrix, 0, scratchAdForward)
        lookFromCockpitAt(viewer, cockpitPos, aim, scratchAdUp, scratchAdForward)
      } else if (currentViewMode === 'free' && hasOrientation) {
        if (lastTrackedTarget !== 'vehicle') {
          lastTrackedTarget = 'vehicle'
          isCameraInitialized = false
        }

        const transform = Transforms.eastNorthUpToFixedFrame(
          finalPos,
          Ellipsoid.WGS84,
          scratchMatrix4
        )

        if (lastViewModeForCamera !== 'free' || !isCameraInitialized) {
          lastViewModeForCamera = 'free'
          isCameraInitialized = true
          // 初次切入自由视角：以模型中心为锚点，设定俯视环视距离与仰俯角
          const overviewDist = config.freeOverviewDistanceMeters
          const initialOffset = new HeadingPitchRange(
            viewer.camera.heading,
            CesiumMath.toRadians(-35),
            overviewDist
          )
          viewer.camera.lookAtTransform(transform, initialOffset)
        } else {
          // 连续帧平移动态中心，锁定模型在屏幕中央，完全保留用户实时鼠标 360° 环绕角度与滚轮缩放距离
          const localOffset = Cartesian3.clone(viewer.camera.position, scratchLocalOffset)
          const dist = Cartesian3.magnitude(localOffset)
          if (dist < 1.0 || Number.isNaN(dist)) {
            localOffset.x = -config.freeOverviewDistanceMeters * 0.7
            localOffset.y = 0
            localOffset.z = config.freeOverviewDistanceMeters * 0.7
          }
          viewer.camera.lookAtTransform(transform, localOffset)
        }
      } else if (currentViewMode !== 'free' && hasOrientation) {
        if (lastViewModeForCamera === 'free') {
          // 从自由环视切回常规第一/第三人称时释放局部锁定系
          viewer.camera.lookAtTransform(Matrix4.IDENTITY)
          isCameraInitialized = false
        }
        if (lastTrackedTarget !== 'vehicle') {
          lastTrackedTarget = 'vehicle'
          isCameraInitialized = false
        }

        if (currentViewMode !== lastViewModeForCamera) {
          lastViewModeForCamera = currentViewMode
          isCameraInitialized = false
        }

        const rotMatrix = Matrix3.fromQuaternion(scratchLastOrientation, scratchMatrix3)
        const camConfig =
          currentViewMode === 'first_person' ? config.firstPerson : config.thirdPerson

        scratchLocalOffset.x = camConfig.offset.x
        scratchLocalOffset.y = camConfig.offset.y
        scratchLocalOffset.z = camConfig.offset.z

        const worldOffset = Matrix3.multiplyByVector(
          rotMatrix,
          scratchLocalOffset,
          scratchWorldOffset
        )
        const targetCamPos = Cartesian3.add(finalPos, worldOffset, scratchCamPosition)

        // 地面防穿模高度约束
        if (config.clampToGround && viewer.scene.globe) {
          const camCarto = Cartographic.fromCartesian(
            targetCamPos,
            viewer.scene.globe.ellipsoid,
            scratchCartographic
          )
          if (camCarto) {
            const terrainHeight = viewer.scene.globe.getHeight(camCarto) ?? 0
            const minHeight = terrainHeight + Math.max(1.2, camConfig.offset.z)
            if (camCarto.height < minHeight) {
              camCarto.height = minHeight
              Cartesian3.fromRadians(
                camCarto.longitude,
                camCarto.latitude,
                camCarto.height,
                viewer.scene.globe.ellipsoid,
                targetCamPos
              )
            }
          }
        }

        const pitchRad = CesiumMath.toRadians(camConfig.pitchDeg)
        scratchLocalDir.x = Math.cos(pitchRad)
        scratchLocalDir.y = 0
        scratchLocalDir.z = Math.sin(pitchRad)

        scratchLocalUp.x = -Math.sin(pitchRad)
        scratchLocalUp.y = 0
        scratchLocalUp.z = Math.cos(pitchRad)

        const targetWorldDir = Matrix3.multiplyByVector(rotMatrix, scratchLocalDir, scratchWorldDir)
        const targetWorldUp = Matrix3.multiplyByVector(rotMatrix, scratchLocalUp, scratchWorldUp)
        Cartesian3.normalize(targetWorldDir, targetWorldDir)
        Cartesian3.normalize(targetWorldUp, targetWorldUp)

        viewer.camera.setView({
          destination: targetCamPos,
          orientation: {
            direction: targetWorldDir,
            up: targetWorldUp
          }
        })
      }

      // 6. 定期同步物理时速与预计剩余到达时间至 Store
      const remainingDist = Math.max(0, totalDistance - distanceTraveled)
      const currentKmh = Math.round(currentSpeedMps * 3.6)
      const effectiveSpeedMps = currentSpeedMps * multiplier
      const remainingRealSec =
        effectiveSpeedMps > 0.1 ? Math.round(remainingDist / effectiveSpeedMps) : 9999
      const progress = Math.min(1, Math.max(0, distanceTraveled / totalDistance))

      if (
        (currentKmh !== lastReportedKmh || remainingRealSec !== lastReportedSec) &&
        (now - lastStateUpdateTime > 100 || currentKmh === Math.round(targetKmh) || isPausedNow)
      ) {
        lastReportedKmh = currentKmh
        lastReportedSec = remainingRealSec
        lastStateUpdateTime = now
        updatePhysicsState({
          currentSpeedKmh: currentKmh,
          remainingRealSeconds: remainingRealSec,
          roamProgress: progress,
          flightPhase: isAir ? currentFlightPhase : undefined
        })
      }
    }

    const removePreUpdateListener = viewer.scene.preUpdate.addEventListener(onPreUpdateListener)

    return () => {
      removePreUpdateListener()
      viewer.clock.multiplier = prevClockMultiplier
      viewer.clock.shouldAnimate = false
      viewer.camera.lookAtTransform(Matrix4.IDENTITY)
      if (viewer.camera.frustum instanceof PerspectiveFrustum) {
        viewer.camera.frustum.near = prevNear
      }
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current)
        entityRef.current = null
      }
      // 清理残留空投实体
      airdropEntitiesRef.current.forEach((entity) => {
        viewer.entities.remove(entity)
      })
      airdropEntitiesRef.current = []
      airdropsRef.current = []
      setAirdropInfo(null)
    }
  }, [
    viewer,
    isActive,
    waypoints,
    vehicleType,
    restartCount,
    stopRoam,
    clearAction,
    updatePhysicsState,
    setViewTarget,
    setAirdropInfo
  ])

  return null
}
