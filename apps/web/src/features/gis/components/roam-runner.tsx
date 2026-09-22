import {
  Color,
  HeightReference,
  JulianDate,
  PolylineGlowMaterialProperty,
  SampledPositionProperty,
  TimeInterval,
  TimeIntervalCollection,
  VelocityOrientationProperty
} from 'cesium'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useCesium } from '../cesium-provider'
import { GIS_MODEL_PATHS, GIS_ROAM_CONFIG } from '../constants'
import { calculateHaversineDistance, toCartesian3 } from '../lib/geo-utils'
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

export function RoamRunner() {
  const { viewer } = useCesium()
  const phase = useGisRoamStore((state) => state.phase)
  const waypoints = useGisRoamStore((state) => state.waypoints)
  const vehicleType = useGisRoamStore((state) => state.vehicleType)
  const speedMultiplier = useGisRoamStore((state) => state.speedMultiplier)
  const stopRoam = useGisRoamStore((state) => state.stopRoam)

  const isRoaming = phase === 'roaming'
  const isPaused = phase === 'paused'

  const entityRef = useRef<Entity | null>(null)
  const previewPolylineRef = useRef<Entity | null>(null)

  // 实时响应倍速调节
  useEffect(() => {
    if (entityRef.current) {
      viewer.clock.multiplier = speedMultiplier
    }
  }, [viewer, speedMultiplier])

  // 1. 漫游准备与拾取阶段的可视化航线预览
  useEffect(() => {
    if (phase !== 'collecting' && phase !== 'picking') {
      if (previewPolylineRef.current) {
        viewer.entities.remove(previewPolylineRef.current)
        previewPolylineRef.current = null
      }
      return
    }

    if (waypoints.length < 2) {
      if (previewPolylineRef.current) {
        viewer.entities.remove(previewPolylineRef.current)
        previewPolylineRef.current = null
      }
      return
    }

    const positions = waypoints.map((pt) => toCartesian3(pt, 2))
    if (!previewPolylineRef.current) {
      previewPolylineRef.current = viewer.entities.add({
        polyline: {
          positions,
          width: 3,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.15,
            color: Color.CYAN
          }),
          clampToGround: true
        }
      })
    } else {
      // @ts-expect-error cesium polyline positions is dynamic
      previewPolylineRef.current.polyline.positions = positions
    }

    return () => {
      if (previewPolylineRef.current) {
        viewer.entities.remove(previewPolylineRef.current)
        previewPolylineRef.current = null
      }
    }
  }, [viewer, phase, waypoints])

  // 2. 漫游运行主逻辑
  useEffect(() => {
    if (!isRoaming && !isPaused) {
      // 清理实体并退出相机追踪
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current)
        entityRef.current = null
      }
      if (viewer.trackedEntity) {
        viewer.trackedEntity = undefined
      }
      return
    }

    if (waypoints.length < 2) return

    // 如果已经构建好实体，仅控制时钟播放/暂停
    if (entityRef.current) {
      viewer.clock.shouldAnimate = isRoaming
      return
    }

    const config = GIS_ROAM_CONFIG[vehicleType]
    const modelUri = getModelUri(vehicleType)
    const altitudeOffset = config.altitudeOffset

    // 构建采样点动画轨迹与时钟序列
    const positionProperty = new SampledPositionProperty()
    const startTime = JulianDate.now()
    let currentTime = JulianDate.clone(startTime)

    // 首个航路点
    const startPos = toCartesian3(waypoints[0], altitudeOffset)
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
      // 计算所需秒数，保证最小 3 秒平滑过渡
      const durationSeconds = Math.max(segmentDistance / config.speedMps, 3.0)
      currentTime = JulianDate.addSeconds(currentTime, durationSeconds, new JulianDate())
      const p2Pos = toCartesian3(p2, altitudeOffset)
      positionProperty.addSample(currentTime, p2Pos)
    }

    const stopTime = JulianDate.clone(currentTime)

    // 配置 Cesium Clock
    viewer.clock.startTime = startTime
    viewer.clock.stopTime = stopTime
    viewer.clock.currentTime = startTime
    viewer.clock.clockRange = 0 // CLAMPED
    viewer.clock.multiplier = useGisRoamStore.getState().speedMultiplier
    viewer.clock.shouldAnimate = true

    // 设置时段区间
    const interval = new TimeInterval({
      start: startTime,
      stop: stopTime
    })
    viewer.timeline?.zoomTo(startTime, stopTime)

    // 创建模型与航迹实体
    const roamEntity = viewer.entities.add({
      availability: new TimeIntervalCollection([interval]),
      position: positionProperty,
      orientation: new VelocityOrientationProperty(positionProperty),
      model: {
        uri: modelUri,
        minimumPixelSize: 48,
        maximumScale: 50,
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
      },
      path: {
        resolution: 1,
        material: new PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Color.fromCssColorString('#38bdf8')
        }),
        width: 4
      }
    })

    entityRef.current = roamEntity
    viewer.trackedEntity = roamEntity

    // 监听漫游进度与预计到达时间
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
      removeTickListener()
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current)
        entityRef.current = null
      }
      if (viewer.trackedEntity === roamEntity) {
        viewer.trackedEntity = undefined
      }
      viewer.clock.shouldAnimate = false
    }
  }, [viewer, isRoaming, isPaused, waypoints, vehicleType, stopRoam])

  return null
}
