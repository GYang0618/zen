import type { GlbBounds } from './glb-bounds'

/** 目录里登记的真实高度。没有该字段，或不是正数，表示 GLB 本身已按米制作。 */
export function catalogHeightMeters(model: object): number | undefined {
  if (!('heightMeters' in model)) return undefined
  const height = model.heightMeters
  if (typeof height !== 'number' || height <= 0) return undefined
  return height
}

/** 把 GLB 向上轴尺寸对齐到目录高度。未登记时为 1。 */
export function catalogFitScale(bounds: GlbBounds, heightMeters: number | undefined): number {
  if (heightMeters === undefined || bounds.size[1] <= 0) return 1
  return heightMeters / bounds.size[1]
}

/** 用户要求的倍率乘在真实尺寸上。省略或非正数时按 1 倍真实尺寸。 */
export function deploymentScale(
  bounds: GlbBounds,
  heightMeters: number | undefined,
  requestedScale: number | undefined
): number {
  const requested = requestedScale !== undefined && requestedScale > 0 ? requestedScale : 1
  return requested * catalogFitScale(bounds, heightMeters)
}

/** 部署后的世界尺寸（米）。Y 为向上轴。 */
export function realWorldSize(
  bounds: GlbBounds,
  heightMeters: number | undefined
): [number, number, number] {
  const fit = catalogFitScale(bounds, heightMeters)
  return [bounds.size[0] * fit, bounds.size[1] * fit, bounds.size[2] * fit]
}
