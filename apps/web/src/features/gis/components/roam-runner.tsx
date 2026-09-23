import {
  BoundingSphere,
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
  PerspectiveFrustum,
  PolylineGlowMaterialProperty,
  Quaternion
} from 'cesium'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useCesium } from '../cesium-provider'
import { GIS_ACTION_CONFIG, GIS_MODEL_PATHS, GIS_ROAM_CONFIG } from '../constants'
import { createFlightTrajectory, createGroundTrajectory } from '../lib/geo-utils'
import { useGisRoamStore } from '../stores/gis-roam'

import type { Entity } from 'cesium'
import type { GisFlightPhase, GisRoamAction, GisRoamVehicle } from '../stores/gis-roam'

function getModelUri(vehicle: GisRoamVehicle): string {
  switch (vehicle) {
    case 'walk':
      return GIS_MODEL_PATHS.pedestrian
    case 'vehicle':
      return GIS_MODEL_PATHS.vehicle
    case 'plane':
      return GIS_MODEL_PATHS.airplane
  }
}

// 模块级预分配运算临时变量，严禁在 preRender 逐帧循环中创建垃圾对象
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
const scratchAdForward = new Cartesian3()
const scratchAdUp = new Cartesian3()
const scratchAdLeft = new Cartesian3()

interface ActiveActionRuntime {
  action: GisRoamAction
  elapsedSec: number
  startSpeedBoost?: number
}

interface AirdropEntityRuntime {
  entity: Entity
  parachuteEntity: Entity
  position: Cartesian3
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

  // 1. 全程高质感导航路线（地面发光导航线 / 飞机全包线高空走廊）
  useEffect(() => {
    if (phase === 'idle' || waypoints.length < 2) {
      if (routePolylineRef.current) {
        viewer.entities.remove(routePolylineRef.current)
        routePolylineRef.current = null
      }
      return
    }

    const isAir = vehicleType === 'plane'
    let positions: Cartesian3[] = []

    if (isAir) {
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

  // 2. 自由视角切换时，平滑飞行至默认高空鸟瞰视角
  const lastViewModeRef = useRef(viewMode)
  useEffect(() => {
    const prevMode = lastViewModeRef.current
    lastViewModeRef.current = viewMode

    if (!isActive) return
    if (viewMode !== 'free' || prevMode === 'free') return
    if (!entityRef.current) return

    const currentPos = scratchPosition
    if (Cartesian3.equals(currentPos, Cartesian3.ZERO)) return

    const config = GIS_ROAM_CONFIG[vehicleType]
    const overviewDist = config.freeOverviewDistanceMeters

    const sphere = new BoundingSphere(currentPos, overviewDist)
    viewer.camera.flyToBoundingSphere(sphere, {
      offset: new HeadingPitchRange(
        viewer.camera.heading,
        CesiumMath.toRadians(-55),
        overviewDist * 1.8
      ),
      duration: 1.2
    })
  }, [viewer, viewMode, isActive, vehicleType])

  // 视角切换时同步模型可见性：步行第一人称隐藏自身模型，避免视口穿模
  useEffect(() => {
    if (entityRef.current?.model) {
      const hidePedestrian = vehicleType === 'walk' && viewMode === 'first_person'
      entityRef.current.model.show = new ConstantProperty(!hidePedestrian)
    }
  }, [viewMode, vehicleType])

  // 3. 核心物理动力学模拟与逐帧运行引擎
  useEffect(() => {
    if (!isActive || waypoints.length < 2) {
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
    const isAir = vehicleType === 'plane'

    // 构建路径积分轨迹
    const groundTraj = !isAir ? createGroundTrajectory(waypoints) : null
    const flightTraj = isAir ? createFlightTrajectory(waypoints) : null

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
    const smoothCamPos = new Cartesian3()
    const smoothCamDir = new Cartesian3()
    const smoothCamUp = new Cartesian3()
    let currentFlightPhase: GisFlightPhase = isAir ? 'taxi_start' : 'cruise'

    const simPosition = new Cartesian3()
    const simOrientation = new Quaternion()

    // 初始位置设定
    if (isAir && flightTraj) {
      const initSample = flightTraj.sampleAtDistance(0)
      Cartesian3.clone(initSample.position, simPosition)
    } else if (groundTraj) {
      const initSample = groundTraj.sampleAtDistance(0)
      Cartesian3.clone(initSample.position, simPosition)
    }
    Cartesian3.clone(simPosition, scratchPosition)

    // 创建动态回调驱动的模型实体
    const roamEntity = viewer.entities.add({
      position: new CallbackProperty(() => simPosition, false),
      orientation: new CallbackProperty(() => simOrientation, false),
      model: {
        uri: modelUri,
        minimumPixelSize: 64,
        maximumScale: 100,
        scale: 1.0,
        runAnimations: true,
        clampAnimations: false,
        heightReference: config.clampToGround
          ? HeightReference.CLAMP_TO_GROUND
          : HeightReference.NONE
      }
    })

    entityRef.current = roamEntity
    if (viewer.trackedEntity) {
      viewer.trackedEntity = undefined
    }

    // 优化相机近剪裁面
    const prevNear =
      viewer.camera.frustum instanceof PerspectiveFrustum ? viewer.camera.frustum.near : 1.0
    if (viewer.camera.frustum instanceof PerspectiveFrustum) {
      viewer.camera.frustum.near = 0.1
    }

    // 若初始就是自由视角，平滑俯冲到全景鸟瞰视角
    if (viewModeRef.current === 'free') {
      const overviewDist = config.freeOverviewDistanceMeters
      const sphere = new BoundingSphere(simPosition, overviewDist)
      viewer.camera.flyToBoundingSphere(sphere, {
        offset: new HeadingPitchRange(
          viewer.camera.heading,
          CesiumMath.toRadians(-55),
          overviewDist * 1.8
        ),
        duration: 1.2
      })
    }

    // 实时动作状态机
    let runtimeAction: ActiveActionRuntime | null = null
    let lastReportedSec = -1

    // 逐帧物理积分与相机追踪
    const onPreRenderListener = () => {
      const now = performance.now()
      const dt = Math.min(0.1, Math.max(0.001, (now - lastFrameTime) / 1000))
      lastFrameTime = now

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
        const sample = flightTraj.sampleAtDistance(distanceTraveled)
        currentFlightPhase = sample.phase
        samplePitchDeg = sample.pitchDeg
        Cartesian3.clone(sample.forwardDir, baseDir)

        // 若处于滑跑阶段，自动匹配起飞或减速速度
        if (currentFlightPhase === 'taxi_start') {
          targetKmh = sample.targetSpeedKmh
        } else if (currentFlightPhase === 'taxi_end') {
          targetKmh = sample.targetSpeedKmh
        }
      } else if (groundTraj) {
        const sample = groundTraj.sampleAtDistance(distanceTraveled)
        Cartesian3.clone(sample.forwardDir, baseDir)
      }

      // 如果暂停，目标速度设为 0 平滑制动；如果在动作驻留中也制动
      let effectiveTargetMps = targetKmh / 3.6
      if (isPausedNow) {
        effectiveTargetMps = 0
      }

      // 动作处理逻辑 (跳跃 / 驻留 / 变道超车 / 俯冲爬升 / 旋转30度 / 空投)
      const currentActionFromStore = useGisRoamStore.getState().activeAction
      if (
        currentActionFromStore &&
        (!runtimeAction || runtimeAction.action !== currentActionFromStore)
      ) {
        runtimeAction = {
          action: currentActionFromStore,
          elapsedSec: 0
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
        if (currentActionFromStore.type === 'airdrop' && isAir) {
          const dropPos = Cartesian3.clone(simPosition, new Cartesian3())
          const groundH = waypoints[0].height ?? 0

          const boxEntity = viewer.entities.add({
            position: new ConstantProperty(dropPos),
            box: {
              dimensions: new Cartesian3(2.5, 2.5, 2.5),
              material: Color.ORANGE
            }
          })
          const chuteEntity = viewer.entities.add({
            position: new ConstantProperty(
              Cartesian3.add(dropPos, new Cartesian3(0, 0, 3.5), new Cartesian3())
            ),
            cylinder: {
              length: 1.0,
              topRadius: 4.5,
              bottomRadius: 0.2,
              material: Color.WHITE.withAlpha(0.85)
            }
          })

          airdropsRef.current.push({
            entity: boxEntity,
            parachuteEntity: chuteEntity,
            position: dropPos,
            fallSpeedMps: GIS_ACTION_CONFIG.plane.airdrop.terminalVelocityMps,
            groundHeight: groundH,
            elapsedSec: 0
          })

          toast.success('📦 空投物资箱已释放！正在降落伞减速下坠中', {
            action: {
              label: '🪂 跟踪空投视角',
              onClick: () => {
                useGisRoamStore.getState().setViewTarget('airdrop')
              }
            }
          })
        }
      }

      let actionLateralOffsetM = 0
      let actionVerticalOffsetM = 0
      let actionPitchDeg = 0
      let actionRollDeg = 0
      let actionYawDeg = 0

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
              toast.info('驻留结束，继续漫游')
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
              toast.success('变道超车完成，已平稳回归车道')
            }
            break
          }
          case 'pitch_up':
          case 'pitch_down': {
            const isUp = runtimeAction.action.type === 'pitch_up'
            const sign = isUp ? 1 : -1
            const cfg = GIS_ACTION_CONFIG.plane.diveClimb
            const duration = runtimeAction.action.durationSec ?? cfg.durationSec
            const deltaH = runtimeAction.action.deltaAltitude ?? cfg.deltaAltitudeMeters
            const boostKmh = runtimeAction.action.speedBoostKmh ?? 0

            if (t <= duration) {
              const normT = t / duration
              // 垂直高差正弦平滑过渡
              actionVerticalOffsetM = sign * deltaH * Math.sin(normT * Math.PI)
              // 俯仰角根据高差动态成比例调整
              const maxPitch = Math.min(25, Math.max(8, (deltaH / 500) * cfg.pitchAngleDeg))
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
            const sign = deltaH >= 0 ? 1 : -1
            const absDeltaH = Math.abs(deltaH)
            const duration =
              runtimeAction.action.durationSec ?? Math.max(3.0, (absDeltaH / 30) * cfg.durationSec)
            const bankRoll =
              runtimeAction.action.bankRollDeg ?? Math.min(45, Math.max(12, absDeltaH * 0.8))
            const boostKmh = runtimeAction.action.speedBoostKmh ?? 0

            if (t <= duration) {
              const normT = t / duration
              // 倾斜横滚角与偏航转向角联合协调转弯（Coordinated Bank Turn）
              actionRollDeg = sign * bankRoll * Math.sin(normT * Math.PI)
              actionYawDeg = deltaH * Math.sin(normT * Math.PI)
              if (boostKmh > 0) {
                effectiveTargetMps += (boostKmh / 3.6) * Math.sin(normT * Math.PI)
              }
            } else {
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

      // 平滑加速度数值积分
      if (currentSpeedMps < effectiveTargetMps) {
        currentSpeedMps = Math.min(effectiveTargetMps, currentSpeedMps + accel * dt)
      } else if (currentSpeedMps > effectiveTargetMps) {
        currentSpeedMps = Math.max(effectiveTargetMps, currentSpeedMps - decel * dt)
      }

      // 漫游步进距离累加
      if (!isPausedNow && currentSpeedMps > 0) {
        distanceTraveled += currentSpeedMps * dt
      }

      // 抵达终点判定
      if (distanceTraveled >= totalDistance) {
        toast.success('漫游已圆满完成！')
        stopRoam()
        return
      }

      // 2. 轨迹坐标与朝向四元数求值
      const rawPos = scratchPosition
      if (isAir && flightTraj) {
        const sample = flightTraj.sampleAtDistance(distanceTraveled)
        Cartesian3.clone(sample.position, rawPos)
      } else if (groundTraj) {
        const sample = groundTraj.sampleAtDistance(distanceTraveled)
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
      Cartesian3.add(finalPos, scratchVerticalVec, finalPos)
      Cartesian3.clone(finalPos, scratchPosition)

      // 姿态旋转复合：俯仰角 (Pitch) + 航向偏角 (Yaw) + 横滚角 (Roll)
      const totalPitch = samplePitchDeg + actionPitchDeg
      const totalYaw = useGisRoamStore.getState().headingOffsetDeg + actionYawDeg
      const totalRoll = actionRollDeg

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

      // 叠加 Yaw（绕 Up 轴）
      if (Math.abs(totalYaw) > 0.01) {
        const yawQuat = Quaternion.fromAxisAngle(
          scratchUp,
          CesiumMath.toRadians(totalYaw),
          scratchRotQuat
        )
        finalOrient = Quaternion.multiply(yawQuat, finalOrient, finalOrient)
      }
      // 叠加 Pitch（绕 Left 轴）
      if (Math.abs(totalPitch) > 0.01) {
        const pitchQuat = Quaternion.fromAxisAngle(
          scratchLeft,
          CesiumMath.toRadians(-totalPitch),
          scratchRotQuat
        )
        finalOrient = Quaternion.multiply(pitchQuat, finalOrient, finalOrient)
      }
      // 叠加 Roll（绕 Forward 轴）
      if (Math.abs(totalRoll) > 0.01) {
        const rollQuat = Quaternion.fromAxisAngle(
          forwardT,
          CesiumMath.toRadians(totalRoll),
          scratchRotQuat
        )
        finalOrient = Quaternion.multiply(rollQuat, finalOrient, finalOrient)
      }

      if (!isOrientationInitialized) {
        Quaternion.clone(finalOrient, simOrientation)
        isOrientationInitialized = true
      } else {
        // 临界阻尼四元数平滑 (1 - e^(-16 * dt))，高灵敏度同时彻底平抑微小角速度毛刺
        const orientAlpha = 1.0 - Math.exp(-16.0 * dt)
        Quaternion.slerp(simOrientation, finalOrient, orientAlpha, simOrientation)
      }

      Quaternion.clone(simOrientation, scratchLastOrientation)
      hasOrientation = true

      // 3. 模型车轮/骨骼动画与物理速度联动：转速与当前真实时速无缝成正比
      const baseCruiseKmh = vehicleType === 'vehicle' ? 7.7 : Math.max(1, config.cruiseSpeedKmh)
      const speedRatio = Math.max(0.01, (currentSpeedMps * 3.6) / baseCruiseKmh)
      viewer.clock.multiplier = speedRatio
      viewer.clock.shouldAnimate = !isPausedNow && currentSpeedMps > 0.05

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
            ad.entity.position = new ConstantProperty(ad.position)
            ad.parachuteEntity.position = new ConstantProperty(
              Cartesian3.add(ad.position, new Cartesian3(0, 0, 3.5), scratchWorldOffset)
            )

            const remainingH = Math.max(0, carto.height - ad.groundHeight)
            const eta = Math.round(remainingH / ad.fallSpeedMps)
            latestAirdropInfo = {
              isDescending: true,
              altitudeMeters: Math.round(carto.height),
              groundHeight: Math.round(ad.groundHeight),
              etaSeconds: eta
            }
          } else {
            // 已着陆，移除降落伞并转为着陆点标记
            viewer.entities.remove(ad.parachuteEntity)
            airdropsRef.current.splice(i, 1)

            if (viewTargetRef.current === 'airdrop') {
              toast.success('🎯 空投物资箱已安全着陆！2秒后自动平滑返回客机视角')
              setTimeout(() => {
                if (useGisRoamStore.getState().viewTarget === 'airdrop') {
                  setViewTarget('vehicle')
                }
              }, 2000)
            } else {
              toast.info('🎯 空投物资箱已安全着陆！')
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

      if (currentViewTarget === 'airdrop' && activeAirdrop && currentViewMode !== 'free') {
        // === 空投专属伴随降落视角 (Airdrop Chase Cam) ===
        if (lastTrackedTarget !== 'airdrop') {
          lastTrackedTarget = 'airdrop'
          isCameraInitialized = false
        }

        const adPos = activeAirdrop.position
        const adUp = Ellipsoid.WGS84.geodeticSurfaceNormal(adPos, scratchAdUp)

        // 前向矢量沿地表切面投影
        const dotAdUp = Cartesian3.dot(adUp, forwardT)
        Cartesian3.subtract(
          forwardT,
          Cartesian3.multiplyByScalar(adUp, dotAdUp, scratchAdForward),
          scratchAdForward
        )
        Cartesian3.normalize(scratchAdForward, scratchAdForward)

        // adLeft = adUp × adForward
        Cartesian3.cross(adUp, scratchAdForward, scratchAdLeft)
        Cartesian3.normalize(scratchAdLeft, scratchAdLeft)

        // 空投伞降微摆动（自然气流阻力仿真，摆幅约 2°）
        const swayAngleRad = CesiumMath.toRadians(2.0 * Math.sin(activeAirdrop.elapsedSec * 2.2))
        const swayQuat = Quaternion.fromAxisAngle(scratchAdForward, swayAngleRad, scratchRotQuat)

        Matrix3.fromColumnMajorArray(
          [
            scratchAdForward.x,
            scratchAdForward.y,
            scratchAdForward.z,
            scratchAdLeft.x,
            scratchAdLeft.y,
            scratchAdLeft.z,
            adUp.x,
            adUp.y,
            adUp.z
          ],
          scratchMatrix3
        )
        let adOrient = Quaternion.fromRotationMatrix(scratchMatrix3, scratchOrientation)
        adOrient = Quaternion.multiply(swayQuat, adOrient, adOrient)
        const adRotMatrix = Matrix3.fromQuaternion(adOrient, scratchMatrix3)

        // 电影级机位：空投后方 7 米、上方 8.5 米 (俯瞰降落伞与物资箱)
        scratchLocalOffset.x = -7.0
        scratchLocalOffset.y = 0
        scratchLocalOffset.z = 8.5

        const adWorldOffset = Matrix3.multiplyByVector(
          adRotMatrix,
          scratchLocalOffset,
          scratchWorldOffset
        )
        const targetAdCamPos = Cartesian3.add(adPos, adWorldOffset, scratchCamPosition)

        // 镜头朝向：向下偏俯视 -32° 对准地面与降落伞
        const pitchRad = CesiumMath.toRadians(-32)
        scratchLocalDir.x = Math.cos(pitchRad)
        scratchLocalDir.y = 0
        scratchLocalDir.z = Math.sin(pitchRad)

        scratchLocalUp.x = -Math.sin(pitchRad)
        scratchLocalUp.y = 0
        scratchLocalUp.z = Math.cos(pitchRad)

        const targetAdWorldDir = Matrix3.multiplyByVector(
          adRotMatrix,
          scratchLocalDir,
          scratchWorldDir
        )
        const targetAdWorldUp = Matrix3.multiplyByVector(
          adRotMatrix,
          scratchLocalUp,
          scratchWorldUp
        )
        Cartesian3.normalize(targetAdWorldDir, targetAdWorldDir)
        Cartesian3.normalize(targetAdWorldUp, targetAdWorldUp)

        if (!isCameraInitialized) {
          Cartesian3.clone(targetAdCamPos, smoothCamPos)
          Cartesian3.clone(targetAdWorldDir, smoothCamDir)
          Cartesian3.clone(targetAdWorldUp, smoothCamUp)
          isCameraInitialized = true
        } else {
          const camAlpha = 1.0 - Math.exp(-12.0 * dt)
          Cartesian3.lerp(smoothCamPos, targetAdCamPos, camAlpha, smoothCamPos)
          Cartesian3.lerp(smoothCamDir, targetAdWorldDir, camAlpha, smoothCamDir)
          Cartesian3.lerp(smoothCamUp, targetAdWorldUp, camAlpha, smoothCamUp)
          Cartesian3.normalize(smoothCamDir, smoothCamDir)
          Cartesian3.normalize(smoothCamUp, smoothCamUp)
        }

        viewer.camera.setView({
          destination: smoothCamPos,
          orientation: {
            direction: smoothCamDir,
            up: smoothCamUp
          }
        })
      } else if (currentViewMode !== 'free' && hasOrientation) {
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

        if (!isCameraInitialized) {
          Cartesian3.clone(targetCamPos, smoothCamPos)
          Cartesian3.clone(targetWorldDir, smoothCamDir)
          Cartesian3.clone(targetWorldUp, smoothCamUp)
          isCameraInitialized = true
        } else {
          // 临界阻尼平滑跟踪，消除地形瓦片碰撞微阶跃与视口高频震颤
          const camAlpha = 1.0 - Math.exp(-14.0 * dt)
          Cartesian3.lerp(smoothCamPos, targetCamPos, camAlpha, smoothCamPos)
          Cartesian3.lerp(smoothCamDir, targetWorldDir, camAlpha, smoothCamDir)
          Cartesian3.lerp(smoothCamUp, targetWorldUp, camAlpha, smoothCamUp)
          Cartesian3.normalize(smoothCamDir, smoothCamDir)
          Cartesian3.normalize(smoothCamUp, smoothCamUp)
        }

        viewer.camera.setView({
          destination: smoothCamPos,
          orientation: {
            direction: smoothCamDir,
            up: smoothCamUp
          }
        })
      }

      // 6. 定期同步物理时速与预计剩余到达时间至 Store
      const remainingDist = Math.max(0, totalDistance - distanceTraveled)
      const currentKmh = Math.round(currentSpeedMps * 3.6)
      const remainingRealSec =
        currentSpeedMps > 0.1 ? Math.round(remainingDist / currentSpeedMps) : 9999
      const progress = Math.min(1, Math.max(0, distanceTraveled / totalDistance))

      if (remainingRealSec !== lastReportedSec) {
        lastReportedSec = remainingRealSec
        updatePhysicsState({
          currentSpeedKmh: currentKmh,
          remainingRealSeconds: remainingRealSec,
          roamProgress: progress,
          flightPhase: isAir ? currentFlightPhase : undefined
        })
      }
    }

    const removePreRenderListener = viewer.scene.preRender.addEventListener(onPreRenderListener)

    return () => {
      removePreRenderListener()
      if (viewer.camera.frustum instanceof PerspectiveFrustum) {
        viewer.camera.frustum.near = prevNear
      }
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current)
        entityRef.current = null
      }
      // 清理残留空投实体
      airdropsRef.current.forEach((ad) => {
        viewer.entities.remove(ad.entity)
        viewer.entities.remove(ad.parachuteEntity)
      })
      airdropsRef.current = []
      setAirdropInfo(null)
      viewer.clock.shouldAnimate = false
    }
  }, [
    viewer,
    isActive,
    waypoints,
    vehicleType,
    stopRoam,
    clearAction,
    updatePhysicsState,
    setViewTarget,
    setAirdropInfo
  ])

  // 4. 重新开始漫游重置
  const prevRestartCount = useRef(restartCount)
  useEffect(() => {
    if (restartCount > prevRestartCount.current && entityRef.current) {
      prevRestartCount.current = restartCount
      useGisRoamStore.getState().startRoam(waypoints, {
        vehicleType,
        viewMode: viewModeRef.current
      })
    }
  }, [restartCount, waypoints, vehicleType])

  return null
}
