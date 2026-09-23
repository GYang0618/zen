import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  EllipsoidGeodesic,
  HeadingPitchRange
} from 'cesium'

import { GIS_ROAM_THRESHOLDS } from '../constants'

import type { Viewer } from 'cesium'
import type { GisRoamVehicle, GisWaypoint } from '../stores/gis-roam'

/**
 * 使用 Haversine 大圆距离公式计算两个经纬度点之间的地表距离（米）
 */
export function calculateHaversineDistance(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const R = 6371008.8 // 地球平均半径（米）
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 计算多点路径的总地表距离（米）
 */
export function calculateTotalPathDistance(
  waypoints: Array<{ longitude: number; latitude: number }>
): number {
  if (waypoints.length < 2) return 0
  let total = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]
    const p2 = waypoints[i + 1]
    total += calculateHaversineDistance(p1.longitude, p1.latitude, p2.longitude, p2.latitude)
  }
  return total
}

/**
 * 根据路径总距离自动推断漫游载具类型
 * - <= 2km: 人物步行
 * - 2km ~ 100km: 车辆巡航
 * - > 100km: 飞机飞行
 */
export function resolveVehicleByDistance(distanceMeters: number): GisRoamVehicle {
  if (distanceMeters <= GIS_ROAM_THRESHOLDS.WALK_MAX_METERS) {
    return 'walk'
  }
  if (distanceMeters <= GIS_ROAM_THRESHOLDS.VEHICLE_MAX_METERS) {
    return 'vehicle'
  }
  return 'plane'
}

/**
 * 格式化经纬度坐标
 */
export function formatCoordinates(longitude: number, latitude: number, height?: number): string {
  const lonStr = `${longitude >= 0 ? 'E' : 'W'} ${Math.abs(longitude).toFixed(6)}°`
  const latStr = `${latitude >= 0 ? 'N' : 'S'} ${Math.abs(latitude).toFixed(6)}°`
  const altStr = typeof height === 'number' ? ` H: ${height.toFixed(1)}m` : ''
  return `${lonStr}, ${latStr}${altStr}`
}

/**
 * 格式化距离长度为人类可读文本
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(2)} km`
}

/**
 * 将经纬度高度转换为 Cesium 的 Cartesian3 坐标
 */
export function toCartesian3(waypoint: GisWaypoint, altitudeOffset = 0): Cartesian3 {
  return Cartesian3.fromDegrees(
    waypoint.longitude,
    waypoint.latitude,
    (waypoint.height ?? 0) + altitudeOffset
  )
}

/**
 * 沿地球椭球测地线（大圆弧）进行等高密集插值采样，
 * 消除远距离直线割线造成的穿地/凹陷，保证航路点与空中轨迹线高度 100% 绝对一致
 */
export function sampleGeodesicPath(
  waypoints: GisWaypoint[],
  fixedAltitudeMeters: number,
  maxStepMeters = 1000
): Cartesian3[] {
  if (waypoints.length < 2) return []

  const result: Cartesian3[] = []

  for (let i = 0; i < waypoints.length - 1; i++) {
    const startWp = waypoints[i]
    const endWp = waypoints[i + 1]

    const startCarto = Cartographic.fromDegrees(
      startWp.longitude,
      startWp.latitude,
      fixedAltitudeMeters
    )
    const endCarto = Cartographic.fromDegrees(endWp.longitude, endWp.latitude, fixedAltitudeMeters)

    const geodesic = new EllipsoidGeodesic(startCarto, endCarto)
    const distance = geodesic.surfaceDistance

    // 每段根据步长计算采样段数，至少 1 段
    const steps = Math.max(1, Math.ceil(distance / maxStepMeters))

    // 仅第一段从 0 开始推入，后续段从 1 开始推入以避免连续段的端点重复
    const startStep = i === 0 ? 0 : 1
    for (let s = startStep; s <= steps; s++) {
      const fraction = s / steps
      const carto = geodesic.interpolateUsingFraction(fraction, new Cartographic())
      result.push(Cartesian3.fromRadians(carto.longitude, carto.latitude, fixedAltitudeMeters))
    }
  }

  return result
}

/**
 * 格式化漫游预计剩余到达时间
 * 示例：
 * - 10s后到达
 * - 2分30秒后到达 / 30分钟后到达
 * - 1小时15分钟后到达
 */
export function formatEstimatedArrivalTime(seconds: number): string {
  if (seconds <= 0) return '即将到达'
  const rounded = Math.round(seconds)

  if (rounded < 60) {
    return `${Math.max(1, rounded)}s后到达`
  }

  const minutes = Math.floor(rounded / 60)
  const remainingSec = rounded % 60

  if (minutes < 60) {
    if (remainingSec === 0) {
      return `${minutes}分钟后到达`
    }
    return `${minutes}分${remainingSec}秒后到达`
  }

  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  if (remMinutes === 0) {
    return `${hours}小时后到达`
  }
  return `${hours}小时${remMinutes}分钟后到达`
}

/**
 * 平滑飞向并聚焦指定标记点位
 */
export function flyToMarker(
  viewer: Viewer,
  marker: { longitude: number; latitude: number; height?: number }
) {
  const target = Cartesian3.fromDegrees(marker.longitude, marker.latitude, marker.height ?? 0)
  const sphere = new BoundingSphere(target, 120)
  viewer.camera.flyToBoundingSphere(sphere, {
    offset: new HeadingPitchRange(viewer.camera.heading, CesiumMath.toRadians(-40), 450),
    duration: 1.2
  })
}

export type FlightPathSample = {
  position: Cartesian3
  forwardDir: Cartesian3
  altitudeMeters: number
  pitchDeg: number
  phase: import('../stores/gis-roam').GisFlightPhase
  targetSpeedKmh: number
}

/**
 * 客机全生命周期飞行包线轨迹生成器：
 * 起点滑行 (Taxi) -> 仰角爬升 (Climb) -> 万米巡航 (Cruise) -> 进近下滑 (Descent) -> 贴地滑跑 (Taxi) -> 终点停稳
 */
export function createFlightTrajectory(waypoints: GisWaypoint[]) {
  if (waypoints.length < 2) return null

  // 1. 采集地面基准大圆测地采样点
  const groundSamples: { carto: Cartographic; dist: number }[] = []
  let accumulatedDist = 0

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]
    const p2 = waypoints[i + 1]
    const c1 = Cartographic.fromDegrees(p1.longitude, p1.latitude, p1.height ?? 0)
    const c2 = Cartographic.fromDegrees(p2.longitude, p2.latitude, p2.height ?? 0)
    const geodesic = new EllipsoidGeodesic(c1, c2)
    const dist = geodesic.surfaceDistance

    const steps = Math.max(2, Math.ceil(dist / 200)) // 每 200 米密集采样
    const startStep = i === 0 ? 0 : 1
    for (let s = startStep; s <= steps; s++) {
      const frac = s / steps
      const carto = geodesic.interpolateUsingFraction(frac, new Cartographic())
      carto.height = (p1.height ?? 0) + ((p2.height ?? 0) - (p1.height ?? 0)) * frac
      const sampleDist = accumulatedDist + dist * frac
      groundSamples.push({ carto, dist: sampleDist })
    }
    accumulatedDist += dist
  }

  const S = Math.max(100, accumulatedDist)
  // 巡航高度自适应：长航程(>=80km)真实客机 9,000 米巡航，短航程按安全爬升坡度平滑缩放
  const cruiseAltitude = S >= 80000 ? 9000 : Math.min(9000, Math.max(1200, S * 0.08))

  // 划分六阶段航程里程界标
  const dTaxiStart = Math.min(2500, S * 0.07)
  const dClimb = Math.min(20000, S * 0.22)
  const s1 = dTaxiStart
  const s2 = s1 + dClimb

  const dTaxiEnd = Math.min(2500, S * 0.07)
  const dDescent = Math.min(20000, S * 0.22)
  const s4 = Math.max(s2 + 100, S - dTaxiEnd)
  const s3 = Math.max(s2 + 50, s4 - dDescent)

  const startH = waypoints[0].height ?? 0
  const endH = waypoints[waypoints.length - 1].height ?? 0

  function getAltitudeAndPitch(s: number) {
    if (s <= s1) {
      const t = s1 > 0 ? s / s1 : 0
      return {
        altitude: startH,
        pitchDeg: 0,
        phase: 'taxi_start' as const,
        targetSpeedKmh: 30 + (280 - 30) * t
      }
    }
    if (s <= s2) {
      const t = (s - s1) / Math.max(1, s2 - s1)
      const hCurve = t * t * (3 - 2 * t)
      const pitchCurve = Math.sin(t * Math.PI) * 12 // 抬头仰角爬升至 +12°
      return {
        altitude: startH + (cruiseAltitude - startH) * hCurve,
        pitchDeg: pitchCurve,
        phase: 'climb' as const,
        targetSpeedKmh: 280 + (800 - 280) * t
      }
    }
    if (s <= s3) {
      return {
        altitude: cruiseAltitude,
        pitchDeg: 0,
        phase: 'cruise' as const,
        targetSpeedKmh: 800
      }
    }
    if (s <= s4) {
      const t = (s - s3) / Math.max(1, s4 - s3)
      const hCurve = 1 - t * t * (3 - 2 * t)
      const pitchCurve = -Math.sin(t * Math.PI) * 4 // 下滑道进近下俯至 -4°
      return {
        altitude: endH + (cruiseAltitude - endH) * hCurve,
        pitchDeg: pitchCurve,
        phase: 'descent' as const,
        targetSpeedKmh: 800 - (800 - 250) * t
      }
    }
    const t = (s - s4) / Math.max(1, S - s4)
    return {
      altitude: endH,
      pitchDeg: 0,
      phase: 'taxi_end' as const,
      targetSpeedKmh: Math.max(0, 250 * (1 - t))
    }
  }

  // 构建带真 3D 高度的离散采样轨迹
  const full3DPositions: Cartesian3[] = []
  const cumulativeDistances: number[] = [0]

  for (let i = 0; i < groundSamples.length; i++) {
    const sample = groundSamples[i]
    const { altitude } = getAltitudeAndPitch(sample.dist)
    const p3d = Cartesian3.fromRadians(sample.carto.longitude, sample.carto.latitude, altitude)
    full3DPositions.push(p3d)

    if (i > 0) {
      const segLen = Cartesian3.distance(full3DPositions[i - 1], p3d)
      cumulativeDistances.push(cumulativeDistances[i - 1] + segLen)
    }
  }

  // 预先计算平滑连续的节点切线矢量（基于前后点中心差分，消除线段连接点处的朝向突变）
  const full3DTangents: Cartesian3[] = []
  for (let i = 0; i < full3DPositions.length; i++) {
    const tan = new Cartesian3()
    if (i === 0) {
      Cartesian3.subtract(full3DPositions[1], full3DPositions[0], tan)
    } else if (i === full3DPositions.length - 1) {
      Cartesian3.subtract(
        full3DPositions[full3DPositions.length - 1],
        full3DPositions[full3DPositions.length - 2],
        tan
      )
    } else {
      Cartesian3.subtract(full3DPositions[i + 1], full3DPositions[i - 1], tan)
    }
    Cartesian3.normalize(tan, tan)
    full3DTangents.push(tan)
  }

  const actualTotalLength = cumulativeDistances[cumulativeDistances.length - 1]

  function sampleAtDistance(dist: number, result?: FlightPathSample): FlightPathSample {
    const clampedDist = Math.max(0, Math.min(actualTotalLength, dist))
    const progressFrac = actualTotalLength > 0 ? clampedDist / actualTotalLength : 0
    const profileS = progressFrac * S
    const profile = getAltitudeAndPitch(profileS)

    // 二分查找对应线段
    let low = 0
    let high = cumulativeDistances.length - 1
    while (low <= high) {
      const mid = (low + high) >> 1
      if (cumulativeDistances[mid] < clampedDist) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    const idx = Math.max(0, Math.min(full3DPositions.length - 2, low - 1))
    const d0 = cumulativeDistances[idx]
    const d1 = cumulativeDistances[idx + 1]
    const segLen = Math.max(0.001, d1 - d0)
    const t = Math.max(0, Math.min(1, (clampedDist - d0) / segLen))

    const pA = full3DPositions[idx]
    const pB = full3DPositions[idx + 1]

    const position = Cartesian3.lerp(pA, pB, t, result?.position ?? new Cartesian3())

    // 基于节点平滑切线进行 C1 连续球面/线性过渡，彻底消除分段突变
    const tanA = full3DTangents[idx]
    const tanB = full3DTangents[idx + 1]
    const forwardDir = Cartesian3.lerp(tanA, tanB, t, result?.forwardDir ?? new Cartesian3())
    Cartesian3.normalize(forwardDir, forwardDir)

    if (result) {
      result.altitudeMeters = profile.altitude
      result.pitchDeg = profile.pitchDeg
      result.phase = profile.phase
      result.targetSpeedKmh = profile.targetSpeedKmh
      return result
    }

    return {
      position,
      forwardDir,
      altitudeMeters: profile.altitude,
      pitchDeg: profile.pitchDeg,
      phase: profile.phase,
      targetSpeedKmh: profile.targetSpeedKmh
    }
  }

  return {
    totalDistance: actualTotalLength,
    positions: full3DPositions,
    sampleAtDistance
  }
}

export type GroundPathSample = {
  position: Cartesian3
  forwardDir: Cartesian3
}

/**
 * 地面漫游（步行/车辆）路径采样器：
 * 支持按弧长 $s$ 瞬时获取精准坐标与切线前进矢量
 */
export function createGroundTrajectory(waypoints: GisWaypoint[]) {
  if (waypoints.length < 2) return null

  const positions: Cartesian3[] = []
  const cumulativeDistances: number[] = [0]

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]
    const p2 = waypoints[i + 1]
    const h1 = p1.height ?? 0
    const h2 = p2.height ?? 0
    const c1 = Cartographic.fromDegrees(p1.longitude, p1.latitude, h1)
    const c2 = Cartographic.fromDegrees(p2.longitude, p2.latitude, h2)
    const geodesic = new EllipsoidGeodesic(c1, c2)
    const dist = geodesic.surfaceDistance

    const steps = Math.max(2, Math.ceil(dist / 10)) // 每 10 米精细插值
    const startStep = i === 0 ? 0 : 1

    for (let s = startStep; s <= steps; s++) {
      const frac = s / steps
      const carto = geodesic.interpolateUsingFraction(frac, new Cartographic())
      const currentH = h1 + (h2 - h1) * frac
      const p3d = Cartesian3.fromRadians(carto.longitude, carto.latitude, currentH)
      positions.push(p3d)

      const lastIdx = positions.length - 1
      if (lastIdx > 0) {
        const segLen = Cartesian3.distance(positions[lastIdx - 1], p3d)
        cumulativeDistances.push(cumulativeDistances[cumulativeDistances.length - 1] + segLen)
      }
    }
  }

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1]

  // 预先计算平滑连续的节点切线矢量（中心差分）
  const groundTangents: Cartesian3[] = []
  for (let i = 0; i < positions.length; i++) {
    const tan = new Cartesian3()
    if (i === 0) {
      Cartesian3.subtract(positions[1], positions[0], tan)
    } else if (i === positions.length - 1) {
      Cartesian3.subtract(positions[positions.length - 1], positions[positions.length - 2], tan)
    } else {
      Cartesian3.subtract(positions[i + 1], positions[i - 1], tan)
    }
    Cartesian3.normalize(tan, tan)
    groundTangents.push(tan)
  }

  function sampleAtDistance(dist: number, result?: GroundPathSample): GroundPathSample {
    const clampedDist = Math.max(0, Math.min(totalDistance, dist))

    let low = 0
    let high = cumulativeDistances.length - 1
    while (low <= high) {
      const mid = (low + high) >> 1
      if (cumulativeDistances[mid] < clampedDist) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    const idx = Math.max(0, Math.min(positions.length - 2, low - 1))
    const d0 = cumulativeDistances[idx]
    const d1 = cumulativeDistances[idx + 1]
    const segLen = Math.max(0.001, d1 - d0)
    const t = Math.max(0, Math.min(1, (clampedDist - d0) / segLen))

    const pA = positions[idx]
    const pB = positions[idx + 1]

    const position = Cartesian3.lerp(pA, pB, t, result?.position ?? new Cartesian3())

    // 平滑插值切线矢量，消除地面每 10 米阶跃抖动
    const tanA = groundTangents[idx]
    const tanB = groundTangents[idx + 1]
    const forwardDir = Cartesian3.lerp(tanA, tanB, t, result?.forwardDir ?? new Cartesian3())
    Cartesian3.normalize(forwardDir, forwardDir)

    if (result) {
      return result
    }

    return {
      position,
      forwardDir
    }
  }

  return {
    totalDistance,
    positions,
    sampleAtDistance
  }
}
