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
