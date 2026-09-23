import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Color,
  ConstantProperty,
  HeadingPitchRange,
  HeightReference,
  JulianDate,
  Matrix3,
  PerspectiveFrustum,
  PolylineGlowMaterialProperty,
  Quaternion,
  SampledPositionProperty,
  TimeInterval,
  TimeIntervalCollection,
  VelocityOrientationProperty
} from 'cesium'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useCesium } from '../cesium-provider'
import { GIS_MODEL_PATHS, GIS_ROAM_CONFIG } from '../constants'
import { calculateHaversineDistance, sampleGeodesicPath, toCartesian3 } from '../lib/geo-utils'
import { useGisRoamStore } from '../stores/gis-roam'

import type { Entity } from 'cesium'
import type { GisRoamVehicle } from '../stores/gis-roam'

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

export function RoamRunner() {
  const { viewer } = useCesium()
  const phase = useGisRoamStore((state) => state.phase)
  const waypoints = useGisRoamStore((state) => state.waypoints)
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const viewMode = useGisRoamStore((state) => state.viewMode)
  const speedMultiplier = useGisRoamStore((state) => state.speedMultiplier)
  const stopRoam = useGisRoamStore((state) => state.stopRoam)

  const isRoaming = phase === 'roaming'
  const isPaused = phase === 'paused'
  const isActive = isRoaming || isPaused
  const restartCount = useGisRoamStore((state) => state.restartCount)

  const entityRef = useRef<Entity | null>(null)
  const routePolylineRef = useRef<Entity | null>(null)
  const viewModeRef = useRef(viewMode)
  viewModeRef.current = viewMode

  // 实时响应倍速调节
  useEffect(() => {
    if (entityRef.current) {
      viewer.clock.multiplier = speedMultiplier
    }
  }, [viewer, speedMultiplier])

  const lastViewModeRef = useRef(viewMode)
  // 自由视角切换时，平滑飞行至默认高空鸟瞰视角
  useEffect(() => {
    const prevMode = lastViewModeRef.current
    lastViewModeRef.current = viewMode

    if (!isActive) return
    if (viewMode !== 'free' || prevMode === 'free') return
    if (!entityRef.current) return

    const clockTime = viewer.clock.currentTime
    const currentPos = entityRef.current.position?.getValue(clockTime, scratchPosition)
    if (!currentPos) return

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

  // 视角切换时同步模型可见性：步行第一人称隐藏人物自身模型，彻底避免人脸/胸腔多边形近距穿透视口造成抖动
  useEffect(() => {
    if (entityRef.current?.model) {
      const hidePedestrian = vehicleType === 'walk' && viewMode === 'first_person'
      entityRef.current.model.show = new ConstantProperty(!hidePedestrian)
    }
  }, [viewMode, vehicleType])

  // 1. 全程高质感导航路线（人形/车辆高德贴地导航发光带，飞机空中航路走廊）
  useEffect(() => {
    if (phase === 'idle' || waypoints.length < 2) {
      if (routePolylineRef.current) {
        viewer.entities.remove(routePolylineRef.current)
        routePolylineRef.current = null
      }
      return
    }

    const isAir = vehicleType === 'plane'
    const positions = isAir
      ? sampleGeodesicPath(waypoints, GIS_ROAM_CONFIG.plane.altitudeOffset, 1000)
      : waypoints.map((pt) => toCartesian3(pt, 0))

    // 地面载具使用类似高德地图的贴地科技青蓝立体发光导航线，飞机使用空中走廊
    const material = isAir
      ? new PolylineGlowMaterialProperty({
          glowPower: 0.25,
          color: Color.fromCssColorString('#38bdf8')
        })
      : new PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: Color.fromCssColorString('#06b6d4')
        })

    const width = isAir ? 5 : 8
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

  // 2. 漫游运行主逻辑：实体生命周期严格绑定至 isActive (roaming | paused)，暂停绝不销毁实体
  useEffect(() => {
    if (!isActive || waypoints.length < 2) {
      // 清理实体
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

    // 构建采样点动画轨迹与时钟序列
    const positionProperty = new SampledPositionProperty()
    const startTime = JulianDate.now()
    let currentTime = JulianDate.clone(startTime)
    let startPos: Cartesian3

    if (isAir) {
      // 飞机漫游：在 600m 固定巡航高度进行大圆测地密集采样，彻底消除割线高度落差
      const cruisingAltitude = config.altitudeOffset
      const geoPoints = sampleGeodesicPath(waypoints, cruisingAltitude, 1000)
      if (geoPoints.length < 2) return

      startPos = geoPoints[0]
      positionProperty.addSample(currentTime, startPos)

      for (let i = 0; i < geoPoints.length - 1; i++) {
        const pA = geoPoints[i]
        const pB = geoPoints[i + 1]
        const segDist = Cartesian3.distance(pA, pB)
        const durationSec = segDist / config.speedMps
        currentTime = JulianDate.addSeconds(currentTime, durationSec, new JulianDate())
        positionProperty.addSample(currentTime, pB)
      }
    } else {
      // 地面载具（步行/车辆）：使用拾取的真实地表高程，确保实体与相机处于地表之上
      startPos = toCartesian3(waypoints[0], 0)
      positionProperty.addSample(currentTime, startPos)

      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i]
        const p2 = waypoints[i + 1]
        const segmentDistance = calculateHaversineDistance(
          p1.longitude,
          p1.latitude,
          p2.longitude,
          p2.latitude
        )
        const durationSeconds = Math.max(segmentDistance / config.speedMps, 3.0)
        currentTime = JulianDate.addSeconds(currentTime, durationSeconds, new JulianDate())
        const p2Pos = toCartesian3(p2, 0)
        positionProperty.addSample(currentTime, p2Pos)
      }
    }

    const stopTime = JulianDate.clone(currentTime)

    // 配置 Cesium Clock
    viewer.clock.startTime = startTime
    viewer.clock.stopTime = stopTime
    viewer.clock.currentTime = startTime
    viewer.clock.clockRange = 0 // CLAMPED
    viewer.clock.multiplier = useGisRoamStore.getState().speedMultiplier
    viewer.clock.shouldAnimate = useGisRoamStore.getState().phase === 'roaming'

    // 设置时段区间
    const interval = new TimeInterval({
      start: startTime,
      stop: stopTime
    })
    viewer.timeline?.zoomTo(startTime, stopTime)

    // 优化相机近剪裁面：第一人称下设为 10cm，确保车头与座舱前沿不被裁剪
    const prevNear =
      viewer.camera.frustum instanceof PerspectiveFrustum ? viewer.camera.frustum.near : 1.0
    if (viewer.camera.frustum instanceof PerspectiveFrustum) {
      viewer.camera.frustum.near = 0.1
    }

    // 载具航向原生对齐速度矢量（各模型均已在资产源头对齐 +Z 前进航向）
    const entityOrientation = new VelocityOrientationProperty(positionProperty)

    // 创建模型与航迹实体
    const roamEntity = viewer.entities.add({
      availability: new TimeIntervalCollection([interval]),
      position: positionProperty,
      orientation: entityOrientation,
      model: {
        uri: modelUri,
        minimumPixelSize: vehicleType === 'walk' ? 48 : 36,
        maximumScale: vehicleType === 'walk' ? 3.0 : 10,
        scale: vehicleType === 'walk' ? 2.0 : 1.0,
        runAnimations: true,
        heightReference: config.clampToGround
          ? HeightReference.CLAMP_TO_GROUND
          : HeightReference.NONE
      },
      // 降级支持：如果模型未提供或加载失败，显示发光标记小球
      point: {
        pixelSize: 10,
        color: Color.CYAN,
        outlineColor: Color.WHITE,
        outlineWidth: 2
      }
    })

    entityRef.current = roamEntity
    // 注意：不使用 viewer.trackedEntity 粗粒度绑定，由下面的 preRender 精确计算视角
    if (viewer.trackedEntity) {
      viewer.trackedEntity = undefined
    }

    // 若初始就是自由视角，平滑俯冲到全景鸟瞰视角
    if (viewModeRef.current === 'free') {
      const overviewDist = config.freeOverviewDistanceMeters
      const sphere = new BoundingSphere(startPos, overviewDist)
      viewer.camera.flyToBoundingSphere(sphere, {
        offset: new HeadingPitchRange(
          viewer.camera.heading,
          CesiumMath.toRadians(-55),
          overviewDist * 1.8
        ),
        duration: 1.2
      })
    }

    // 3. 基于载具局部坐标系（Local-to-World Transform）的逐帧相机跟踪
    let hasOrientation = false
    const onPreRenderListener = () => {
      if (!entityRef.current) return

      const currentViewMode = viewModeRef.current
      if (currentViewMode === 'free') {
        // 自由视角：跳过相机强制锁定，全量交出鼠标旋转/缩放/平移控制权
        return
      }

      const clockTime = viewer.clock.currentTime

      const currentPos = entityRef.current.position?.getValue(clockTime, scratchPosition)
      if (!currentPos) return

      // 相机追踪严格基于载具纯运动前进航向
      // 确保第三人称相机严格稳定地处于模型正背后（-X 轴方向，Y=0）
      const currentOrient = entityOrientation.getValue(clockTime, scratchOrientation)
      if (currentOrient) {
        Quaternion.clone(currentOrient, scratchLastOrientation)
        hasOrientation = true
      }
      if (!hasOrientation) return

      const rotMatrix = Matrix3.fromQuaternion(scratchLastOrientation, scratchMatrix3)
      const vehicleConfig = GIS_ROAM_CONFIG[vehicleType]
      const camConfig =
        currentViewMode === 'first_person' ? vehicleConfig.firstPerson : vehicleConfig.thirdPerson

      // 第一人称视角保证相机近剪裁面稳定在 10cm，避免机舱/座舱前沿被动态近平面截断穿透
      if (
        currentViewMode === 'first_person' &&
        viewer.camera.frustum instanceof PerspectiveFrustum
      ) {
        viewer.camera.frustum.near = 0.1
      }

      scratchLocalOffset.x = camConfig.offset.x
      scratchLocalOffset.y = camConfig.offset.y
      scratchLocalOffset.z = camConfig.offset.z

      const worldOffset = Matrix3.multiplyByVector(
        rotMatrix,
        scratchLocalOffset,
        scratchWorldOffset
      )
      const camPos = Cartesian3.add(currentPos, worldOffset, scratchCamPosition)

      // 地面载具/步行：防下沉地表碰撞约束，确保相机高度始终处于地形地表之上
      if (vehicleConfig.clampToGround && viewer.scene.globe) {
        const camCarto = Cartographic.fromCartesian(
          camPos,
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
              camPos
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

      const worldDir = Matrix3.multiplyByVector(rotMatrix, scratchLocalDir, scratchWorldDir)
      const worldUp = Matrix3.multiplyByVector(rotMatrix, scratchLocalUp, scratchWorldUp)
      Cartesian3.normalize(worldDir, worldDir)
      Cartesian3.normalize(worldUp, worldUp)

      viewer.camera.setView({
        destination: camPos,
        orientation: {
          direction: worldDir,
          up: worldUp
        }
      })
    }

    const removePreRenderListener = viewer.scene.preRender.addEventListener(onPreRenderListener)

    // 4. 监听漫游进度与预计到达时间
    let lastReportedSec = -1
    const totalSimDuration = Math.max(0.001, JulianDate.secondsDifference(stopTime, startTime))

    const onTickListener = (clock: { currentTime: JulianDate }) => {
      if (JulianDate.greaterThanOrEquals(clock.currentTime, stopTime)) {
        toast.success('漫游已完成')
        stopRoam()
        return
      }

      const remainingSimSeconds = Math.max(
        0,
        JulianDate.secondsDifference(stopTime, clock.currentTime)
      )
      const currentMultiplier = Math.max(0.01, viewer.clock.multiplier)
      const remainingRealSeconds = remainingSimSeconds / currentMultiplier
      const roundedSec = Math.round(remainingRealSeconds)

      // 仅当整秒数变动时派发，避免每帧高频无效重渲染
      if (roundedSec !== lastReportedSec) {
        lastReportedSec = roundedSec
        const progress = Math.min(1, Math.max(0, 1 - remainingSimSeconds / totalSimDuration))
        useGisRoamStore.getState().updateRoamProgress(remainingRealSeconds, progress)
      }
    }

    const removeTickListener = viewer.clock.onTick.addEventListener(onTickListener)

    return () => {
      removePreRenderListener()
      removeTickListener()
      if (viewer.camera.frustum instanceof PerspectiveFrustum) {
        viewer.camera.frustum.near = prevNear
      }
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current)
        entityRef.current = null
      }
      if (viewer.trackedEntity === roamEntity) {
        viewer.trackedEntity = undefined
      }
      viewer.clock.shouldAnimate = false
    }
  }, [viewer, isActive, waypoints, vehicleType, stopRoam])

  // 3. 独立控制暂停与继续：仅控制时钟动画开关，绝不重建/重置实体
  useEffect(() => {
    if (entityRef.current) {
      viewer.clock.shouldAnimate = isRoaming
    }
  }, [viewer, isRoaming])

  // 4. 独立重新开始响应：跳回起点并继续动画播放
  const prevRestartCount = useRef(restartCount)
  useEffect(() => {
    if (restartCount > prevRestartCount.current && entityRef.current) {
      prevRestartCount.current = restartCount
      viewer.clock.currentTime = JulianDate.clone(viewer.clock.startTime)
      viewer.clock.shouldAnimate = true

      if (viewModeRef.current === 'free') {
        const config = GIS_ROAM_CONFIG[vehicleType]
        const startPos = entityRef.current.position?.getValue(
          viewer.clock.startTime,
          scratchPosition
        )
        if (startPos) {
          const overviewDist = config.freeOverviewDistanceMeters
          const sphere = new BoundingSphere(startPos, overviewDist)
          viewer.camera.flyToBoundingSphere(sphere, {
            offset: new HeadingPitchRange(
              viewer.camera.heading,
              CesiumMath.toRadians(-55),
              overviewDist * 1.8
            ),
            duration: 1.2
          })
        }
      }
    }
  }, [viewer, restartCount, vehicleType])

  return null
}
