import { BufferGeometry } from 'three'

const geometryCache = new Map<string, BufferGeometry>()

function cacheKey(meshUuid: string, featureId: number, attributeIndex: number): string {
  return `${meshUuid}:${featureId}:${attributeIndex}`
}

/**
 * 从合并 primitive 中抽取单个 feature 的三角形索引（共享顶点 attribute）。
 */
export function extractFeatureGeometry(
  source: BufferGeometry,
  featureId: number,
  attributeIndex = 0
): BufferGeometry | null {
  const attrName = `_feature_id_${attributeIndex}`
  const featureAttr = source.getAttribute(attrName)
  const index = source.getIndex()
  if (!featureAttr || !index) return null

  const kept: number[] = []
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)
    if (
      featureAttr.getX(a) === featureId &&
      featureAttr.getX(b) === featureId &&
      featureAttr.getX(c) === featureId
    ) {
      kept.push(a, b, c)
    }
  }

  if (kept.length === 0) return null

  const geometry = new BufferGeometry()
  for (const name of Object.keys(source.attributes)) {
    geometry.setAttribute(name, source.getAttribute(name))
  }
  geometry.setIndex(kept)
  return geometry
}

export function getOrCreateFeatureGeometry(
  meshUuid: string,
  source: BufferGeometry,
  featureId: number,
  attributeIndex = 0
): BufferGeometry | null {
  const key = cacheKey(meshUuid, featureId, attributeIndex)
  const cached = geometryCache.get(key)
  if (cached) return cached

  const geometry = extractFeatureGeometry(source, featureId, attributeIndex)
  if (!geometry) return null

  geometryCache.set(key, geometry)
  return geometry
}

export function disposeFeatureGeometryCache(meshUuid: string): void {
  for (const key of geometryCache.keys()) {
    if (!key.startsWith(`${meshUuid}:`)) continue
    geometryCache.get(key)?.dispose()
    geometryCache.delete(key)
  }
}
