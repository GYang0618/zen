/** 1 km/h 对应的米每秒。 */
export const KMH_TO_MPS = 1 / 3.6

export function kmhToMps(kmh: number): number {
  return kmh * KMH_TO_MPS
}

export function mpsToKmh(mps: number): number {
  return mps / KMH_TO_MPS
}
