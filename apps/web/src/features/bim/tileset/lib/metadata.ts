import type { MeshFeatures, StructuralMetadata } from '3d-tiles-renderer/plugins'
import type { Mesh, Object3D } from 'three'

const STABLE_ID_KEYS = ['id', 'GlobalId', 'guid', 'expressID'] as const

function hasUsableSchemaClasses(metadata: StructuralMetadata): boolean {
  const classes = metadata.schema?.classes
  if (!classes || typeof classes !== 'object') return false
  const classNames = Object.keys(classes)
  if (classNames.length === 0) return false
  return classNames.some((name) => name !== 'empty')
}

export function getMeshFeatures(mesh: Mesh): MeshFeatures | undefined {
  return mesh.userData.meshFeatures as MeshFeatures | undefined
}

export function findMetadataRoot(object: Object3D): Object3D {
  let current: Object3D | null = object
  while (current) {
    if (current.userData.structuralMetadata) return current
    current = current.parent
  }
  return object
}

export function getStructuralMetadata(root: Object3D): StructuralMetadata | undefined {
  const metadataRoot = findMetadataRoot(root)
  return metadataRoot.userData.structuralMetadata as StructuralMetadata | undefined
}

export function getPropertyTableIndex(mesh: Mesh): number {
  const info = getMeshFeatures(mesh)?.getFeatureInfo()?.[0]
  // MeshFeatureInfo.propertyTable 可能为 null（该特征通道无属性表）。
  // 这里不能默认回 0，否则会把“无属性表”当成合法 tableIndex 去解析二进制，
  // 从而引发 typed array length RangeError。
  return info?.propertyTable ?? -1
}

export function getFeatureProperties(
  mesh: Mesh,
  featureId: number,
  metadataRoot: Object3D
): Record<string, unknown> | undefined {
  return getFeaturePropertiesWithParseError(mesh, featureId, metadataRoot).properties
}

export type FeaturePropertiesWithParseError = {
  properties: Record<string, unknown> | undefined
  parseError: unknown | null
}

export function getFeaturePropertiesWithParseError(
  mesh: Mesh,
  featureId: number,
  metadataRoot: Object3D
): FeaturePropertiesWithParseError {
  const metadata = getStructuralMetadata(metadataRoot)
  if (!metadata) return { properties: undefined, parseError: null }

  if (!hasUsableSchemaClasses(metadata)) {
    if (import.meta.env.DEV) {
      console.warn(
        '[tileset pick] skip property parse: schema has no usable classes',
        JSON.stringify({
          featureId,
          meshUuid: mesh.uuid
        })
      )
    }
    return { properties: undefined, parseError: null }
  }

  const tableIndex = getPropertyTableIndex(mesh)
  const propertyTableCount = metadata.tableAccessors?.length ?? 0

  if (tableIndex < 0) {
    if (import.meta.env.DEV) {
      console.warn(
        '[tileset pick] no property table for feature channel',
        JSON.stringify({
          tableIndex,
          propertyTableCount,
          featureId,
          meshUuid: mesh.uuid
        })
      )
    }
    return { properties: undefined, parseError: null }
  }

  // 兜底：防止 tableIndex 错误时让底层解析出“荒谬的 typed array length”
  if (propertyTableCount > 0 && (tableIndex < 0 || tableIndex >= propertyTableCount)) {
    if (import.meta.env.DEV) {
      console.warn(
        '[tileset pick] propertyTableIndex out of range',
        JSON.stringify({
          tableIndex,
          propertyTableCount,
          featureId,
          meshUuid: mesh.uuid
        })
      )
    }
    return { properties: undefined, parseError: null }
  }

  try {
    const result = metadata.getPropertyTableData(
      [tableIndex],
      [featureId],
      []
    ) as Record<string, unknown>[]

    return { properties: result[0], parseError: null }
  } catch (err: unknown) {
    if (import.meta.env.DEV) {
      console.error(
        '[tileset pick] getPropertyTableData failed',
        JSON.stringify({
          tableIndex,
          featureId,
          propertyTableCount,
          meshUuid: mesh.uuid
        }),
        err
      )
    }
    return { properties: undefined, parseError: err }
  }
}

export function resolveStableElementId(
  mesh: Mesh,
  featureId: number,
  metadataRoot: Object3D
): string {
  const props = getFeatureProperties(mesh, featureId, metadataRoot)
  if (props) {
    for (const key of STABLE_ID_KEYS) {
      const value = props[key]
      if (typeof value === 'string' && value.length > 0) return value
      if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    }
  }

  return `${mesh.uuid}:${featureId}`
}
