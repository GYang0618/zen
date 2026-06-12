import type { MeshFeatures, StructuralMetadata } from '3d-tiles-renderer/plugins'
import type { Mesh, Object3D } from 'three'

type MeshFeatureChannel = {
  propertyTable?: number | null
}

type PropertyTableAccessorInternal = {
  count: number
  getPropertyNames: () => string[]
  includesData: (name: string) => boolean
  getPropertyValue: (name: string, id: number) => unknown
}

type StructuralMetadataInternal = StructuralMetadata & {
  tableAccessors?: PropertyTableAccessorInternal[]
}

/** 仅读取可展示的 BIM 字段，跳过 *_inverse 等二进制列 */
const BIM_DISPLAY_KEYS = [
  'GlobalId',
  'Name',
  'LongName',
  'Tag',
  'Description',
  'Reference',
  'IfcEntity',
  'id',
  'ObjectType',
  'PredefinedType',
  'floor',
  'IsExternal',
  'LoadBearing',
  'Height',
  'OverallHeight',
  'OverallWidth',
  'NumberOfRisers',
  'Span',
  'ThermalTransmittance',
  'EntityAliasName'
] as const

const rowIndexCache = new WeakMap<PropertyTableAccessorInternal, Map<number, number>>()

function findStructuralMetadata(object: Object3D): StructuralMetadataInternal | undefined {
  let current: Object3D | null = object
  while (current) {
    const metadata = current.userData.structuralMetadata as StructuralMetadataInternal | undefined
    if (metadata) return metadata
    current = current.parent
  }
  return undefined
}

function isDisplayString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const text = value.trim()
  if (text.length === 0) return false

  let control = 0
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) < 32) control++
  }

  return control === 0
}

function readField(table: PropertyTableAccessorInternal, rowIndex: number, key: string): unknown {
  if (!table.getPropertyNames().includes(key)) return undefined
  if (!table.includesData(key)) return undefined
  return table.getPropertyValue(key, rowIndex)
}

function rowHasDisplayData(table: PropertyTableAccessorInternal, rowIndex: number): boolean {
  for (const key of ['GlobalId', 'Name', 'IfcEntity'] as const) {
    try {
      const value = readField(table, rowIndex, key)
      if (isDisplayString(value)) return true
    } catch {
      // ignore
    }
  }
  return false
}

function resolveRowIndex(table: PropertyTableAccessorInternal, featureId: number): number {
  let cache = rowIndexCache.get(table)
  if (!cache) {
    cache = new Map()
    rowIndexCache.set(table, cache)
  }

  const cached = cache.get(featureId)
  if (cached !== undefined) return cached

  if (featureId >= 0 && featureId < table.count && rowHasDisplayData(table, featureId)) {
    cache.set(featureId, featureId)
    return featureId
  }

  for (let row = 0; row < table.count; row++) {
    try {
      const idValue = readField(table, row, 'id')
      if (idValue === undefined) continue
      if (Number(idValue) === featureId || String(idValue) === String(featureId)) {
        cache.set(featureId, row)
        return row
      }
    } catch {
      // ignore
    }
  }

  cache.set(featureId, featureId)
  return featureId
}

function readBimRow(table: PropertyTableAccessorInternal, rowIndex: number): Record<string, unknown> {
  const row: Record<string, unknown> = {}

  for (const key of BIM_DISPLAY_KEYS) {
    try {
      const value = readField(table, rowIndex, key)
      if (isDisplayString(value)) {
        row[key] = value.trim()
        continue
      }
      if (typeof value === 'number' && Number.isFinite(value)) row[key] = value
      if (typeof value === 'boolean') row[key] = value
    } catch {
      // ignore
    }
  }

  return row
}

/** 用 pick 得到的 featureId 读取 property table 行 */
export function getFeatureProperties(mesh: Mesh, featureId: number): Record<string, unknown> | undefined {
  const meshFeatures = mesh.userData.meshFeatures as MeshFeatures | undefined
  const metadata = findStructuralMetadata(mesh)
  if (!meshFeatures || !metadata) return undefined

  const tableAccessors = metadata.tableAccessors ?? []

  for (const info of meshFeatures.getFeatureInfo() as MeshFeatureChannel[]) {
    const tableIndex = info.propertyTable
    if (tableIndex == null || tableIndex < 0) continue
    if (tableIndex >= tableAccessors.length) continue

    const table = tableAccessors[tableIndex]
    if (!table || featureId < 0) continue

    const rowIndex = resolveRowIndex(table, featureId)
    if (rowIndex < 0 || rowIndex >= table.count) continue

    const row = readBimRow(table, rowIndex)
    if (Object.keys(row).length > 0) return row
  }

  return undefined
}
