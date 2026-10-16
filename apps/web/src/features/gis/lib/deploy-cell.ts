import { GIS_DEPLOY_LOD } from '../constants'

const GEOHASH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

/** 将经纬度编码为部署格子。同一格子内的模型共用一份 3D Tiles。 */
export function encodeDeployCell(latitude: number, longitude: number): string {
  let hash = ''
  let bit = 0
  let index = 0
  let even = true
  let latMin = -90
  let latMax = 90
  let lonMin = -180
  let lonMax = 180

  while (hash.length < GIS_DEPLOY_LOD.geohashPrecision) {
    if (even) {
      const mid = (lonMin + lonMax) / 2
      if (longitude >= mid) {
        index = index * 2 + 1
        lonMin = mid
      } else {
        index *= 2
        lonMax = mid
      }
    } else {
      const mid = (latMin + latMax) / 2
      if (latitude >= mid) {
        index = index * 2 + 1
        latMin = mid
      } else {
        index *= 2
        latMax = mid
      }
    }
    even = !even
    bit += 1
    if (bit === 5) {
      hash += GEOHASH_BASE32[index] ?? ''
      bit = 0
      index = 0
    }
  }
  return hash
}
