import { Cartesian3, Cartographic, Ellipsoid } from 'cesium'

const scratchCartographic = new Cartographic()

export interface GlobeHeightSource {
  getHeight(cartographic: Cartographic): number | undefined
}

/**
 * 用当前地形网格的精确高度替换原点高程，水平位置保持本帧模拟结果。
 * 采不到地形时沿用上一帧，避免掉回椭球面后再弹起。
 */
export function clampCartesianToTerrain(
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

/** 低于地形加离地间隙时抬升。已经高于该面时保持飞行包线高度。 */
export function liftAboveTerrain(
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
