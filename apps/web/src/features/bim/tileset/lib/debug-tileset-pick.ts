import { tilesetFeatureRegistry } from './feature-registry'
import {
  findMetadataRoot,
  getMeshFeatures,
  getPropertyTableIndex,
  getStructuralMetadata
} from './metadata'
import { countMeaningfulProperties } from './property-utils'

import type { StructuralMetadata } from '3d-tiles-renderer/plugins'
import type { Mesh } from 'three'
import type { TilesetPickResult } from './pick'

export type TilesetPickDiagnosis =
  | 'ok'
  | 'no_mesh_features'
  | 'no_structural_metadata'
  | 'no_property_table'
  | 'property_parse_error'
  | 'empty_property_table'
  | 'empty_property_values'
  | 'empty_schema_classes'

export type TilesetPickDiagnostics = {
  at: string
  elementId: string
  featureId: number
  meshUuid: string
  hasMeshFeatures: boolean
  hasStructuralMetadata: boolean
  metadataRootType: string | null
  propertyTableIndex: number
  propertyTableInfo: unknown
  propertyParseError: unknown | null
  propertyKeys: string[]
  properties: Record<string, unknown> | undefined
  schemaClassNames: string[]
  propertyTableCount: number
  featureInfo: unknown
  diagnosis: TilesetPickDiagnosis
  hint: string
}

export type TilesetPickDebuggerApi = {
  enabled: boolean
  lastPick: TilesetPickDiagnostics | null
  setEnabled: (enabled: boolean) => void
  inspect: (elementId?: string) => TilesetPickDiagnostics | null
  print: (elementId?: string) => void
}

function readSchemaClassNames(metadata: StructuralMetadata | undefined): string[] {
  const classes = metadata?.schema?.classes
  if (!classes || typeof classes !== 'object') return []
  return Object.keys(classes)
}

function resolveDiagnosis(input: {
  hasMeshFeatures: boolean
  hasStructuralMetadata: boolean
  hasPropertyTable: boolean
  hasPropertyParseError: boolean
  propertyKeys: string[]
  meaningfulPropertyCount: number
  schemaClassNames: string[]
}): { diagnosis: TilesetPickDiagnosis; hint: string } {
  if (!input.hasMeshFeatures) {
    return {
      diagnosis: 'no_mesh_features',
      hint: 'GLB 缺少 EXT_mesh_features / _FEATURE_ID_0，无法 feature 级拾取。'
    }
  }

  if (!input.hasStructuralMetadata) {
    return {
      diagnosis: 'no_structural_metadata',
      hint: '未挂载 structuralMetadata：检查 GLTFExtensionsPlugin 与 GLB 是否含 EXT_structural_metadata。'
    }
  }

  if (!input.hasPropertyTable) {
    return {
      diagnosis: 'no_property_table',
      hint: '该 feature 通道没有对应 propertyTable（MeshFeatureInfo.propertyTable 为 null）。这不是前端读取错误，而是导出未提供属性表。'
    }
  }

  if (input.hasPropertyParseError) {
    return {
      diagnosis: 'property_parse_error',
      hint: '解析属性表失败（getPropertyTableData RangeError）。多为导出结构化元数据与 schema/表布局不匹配，或 featureId 映射不正确。'
    }
  }

  if (
    input.schemaClassNames.length === 0 ||
    input.schemaClassNames.every((name) => name === 'empty')
  ) {
    return {
      diagnosis: 'empty_schema_classes',
      hint: 'schema 无有效 class（常见为 schema.json 空壳），需在导出时写入属性 schema。'
    }
  }

  if (input.propertyKeys.length === 0) {
    return {
      diagnosis: 'empty_property_table',
      hint: 'propertyTables 无 properties 列，模型未写入属性数据；读取 API 正常但无可展示字段。'
    }
  }

  if (input.meaningfulPropertyCount === 0) {
    return {
      diagnosis: 'empty_property_values',
      hint: 'schema 已定义属性键名，但 GLB property table 二进制未写入有效值（常见为导出时只写 schema/列结构，未写 string buffer）。需修导出端。'
    }
  }

  return {
    diagnosis: 'ok',
    hint: '拾取与属性读取正常。'
  }
}

function buildDiagnosticsFromMesh(
  mesh: Mesh,
  featureId: number,
  elementId: string,
  properties: Record<string, unknown> | undefined,
  propertyParseError: unknown | null
): TilesetPickDiagnostics {
  const meshFeatures = getMeshFeatures(mesh)
  const metadataRoot = findMetadataRoot(mesh)
  const metadata = getStructuralMetadata(mesh)
  const tableIndex = getPropertyTableIndex(mesh)
  const propertyKeys = properties ? Object.keys(properties) : []
  const meaningfulPropertyCount = properties ? countMeaningfulProperties(properties) : 0
  const schemaClassNames = readSchemaClassNames(metadata)
  let propertyTableInfo: unknown = null
  let featureInfo: unknown = null

  // 这两个 API 都会触发底层二进制解析；若模型/导出元数据不匹配，可能抛出 typed array 相关错误
  try {
    propertyTableInfo = metadata?.getPropertyTableInfo?.([tableIndex]) ?? null
  } catch (err: unknown) {
    if (import.meta.env.DEV) {
      console.error(
        '[tileset pick] getPropertyTableInfo failed',
        JSON.stringify({
          tableIndex,
          featureId,
          meshUuid: mesh.uuid,
          metadataRootType: metadataRoot.type
        }),
        err
      )
    }
    propertyTableInfo = null
  }

  try {
    featureInfo = meshFeatures?.getFeatureInfo?.() ?? null
  } catch (err: unknown) {
    if (import.meta.env.DEV) {
      console.error(
        '[tileset pick] meshFeatures.getFeatureInfo failed',
        JSON.stringify({
          featureId,
          meshUuid: mesh.uuid,
          metadataRootType: metadataRoot.type
        }),
        err
      )
    }
    featureInfo = null
  }

  const { diagnosis, hint } = resolveDiagnosis({
    hasMeshFeatures: meshFeatures !== undefined,
    hasStructuralMetadata: metadata !== undefined,
    hasPropertyTable: tableIndex >= 0,
    hasPropertyParseError: propertyParseError != null,
    propertyKeys,
    meaningfulPropertyCount,
    schemaClassNames
  })

  return {
    at: new Date().toISOString(),
    elementId,
    featureId,
    meshUuid: mesh.uuid,
    hasMeshFeatures: meshFeatures !== undefined,
    hasStructuralMetadata: metadata !== undefined,
    metadataRootType: metadataRoot?.type ?? null,
    propertyTableIndex: tableIndex,
    propertyTableInfo,
    propertyParseError,
    propertyKeys,
    properties,
    schemaClassNames,
    propertyTableCount: metadata?.tableAccessors?.length ?? 0,
    featureInfo,
    diagnosis,
    hint
  }
}

export function buildTilesetPickDiagnostics(picked: TilesetPickResult): TilesetPickDiagnostics {
  return buildDiagnosticsFromMesh(
    picked.mesh,
    picked.featureId,
    picked.elementId,
    picked.properties,
    picked.propertyParseError
  )
}

export function inspectTilesetElement(elementId: string): TilesetPickDiagnostics | null {
  const refs = tilesetFeatureRegistry.getRefs(elementId)
  const ref = refs[0]
  if (!ref) return null

  const properties = tilesetFeatureRegistry.getElementProperties(elementId)
  return buildDiagnosticsFromMesh(ref.mesh, ref.featureId, elementId, properties, null)
}

let debuggerEnabled = true
let lastPick: TilesetPickDiagnostics | null = null

function printDiagnostics(diagnostics: TilesetPickDiagnostics): void {
  console.groupCollapsed(
    `%c[tileset pick] %c${diagnostics.diagnosis}%c · ${diagnostics.elementId}`,
    'color:#22d3ee;font-weight:bold',
    diagnostics.diagnosis === 'ok' ? 'color:#4ade80' : 'color:#fbbf24',
    'color:inherit'
  )
  console.table({
    diagnosis: diagnostics.diagnosis,
    hint: diagnostics.hint,
    elementId: diagnostics.elementId,
    featureId: diagnostics.featureId,
    meshUuid: diagnostics.meshUuid,
    hasMeshFeatures: diagnostics.hasMeshFeatures,
    hasStructuralMetadata: diagnostics.hasStructuralMetadata,
    propertyTableIndex: diagnostics.propertyTableIndex,
    propertyTableCount: diagnostics.propertyTableCount,
    propertyKeyCount: diagnostics.propertyKeys.length,
    meaningfulPropertyCount: countMeaningfulProperties(diagnostics.properties ?? {})
  })
  if (diagnostics.schemaClassNames.length > 0) {
    console.log('schema.classes', diagnostics.schemaClassNames)
  }
  if (diagnostics.propertyTableInfo) {
    console.log('propertyTableInfo', diagnostics.propertyTableInfo)
  }
  if (diagnostics.featureInfo) {
    console.log('meshFeatures.getFeatureInfo()', diagnostics.featureInfo)
  }
  if (diagnostics.propertyParseError) {
    console.error('propertyParseError', diagnostics.propertyParseError)
  } else if (diagnostics.properties && diagnostics.propertyKeys.length > 0) {
    console.log('properties', diagnostics.properties)
  } else {
    console.warn(
      'properties 为空 — 多为模型未导出属性列，而非前端读取错误（或解析失败导致 properties 未返回）'
    )
  }
  console.groupEnd()
}

/** DEV：点击拾取后输出诊断；生产构建不调用 */
export function logTilesetPickDebug(picked: TilesetPickResult): void {
  if (!import.meta.env.DEV || !debuggerEnabled) return

  const diagnostics = buildTilesetPickDiagnostics(picked)
  lastPick = diagnostics
  printDiagnostics(diagnostics)
}

/** DEV：挂载 window.__tilesetDebug，便于控制台二次 inspect */
export function installTilesetPickDebugger(): () => void {
  if (!import.meta.env.DEV) {
    return () => undefined
  }

  const api: TilesetPickDebuggerApi = {
    get enabled() {
      return debuggerEnabled
    },
    get lastPick() {
      return lastPick
    },
    setEnabled(enabled: boolean) {
      debuggerEnabled = enabled
      console.info(`[tileset pick] debugger ${enabled ? 'enabled' : 'disabled'}`)
    },
    inspect(elementId?: string) {
      const id = elementId ?? lastPick?.elementId
      if (!id) {
        console.warn('[tileset pick] 无 elementId：请先在场景中点击构件')
        return null
      }
      const diagnostics = inspectTilesetElement(id)
      if (!diagnostics) {
        console.warn(`[tileset pick] 未找到构件 ref: ${id}`)
        return null
      }
      lastPick = diagnostics
      return diagnostics
    },
    print(elementId?: string) {
      const diagnostics = api.inspect(elementId)
      if (diagnostics) printDiagnostics(diagnostics)
    }
  }

  window.__tilesetDebug = api
  console.info(
    '[tileset pick] debugger 已启用：点击构件自动输出；手动调用 __tilesetDebug.print() / .inspect(id) / .setEnabled(false)'
  )

  return () => {
    debuggerEnabled = true
    lastPick = null
    delete window.__tilesetDebug
  }
}

declare global {
  interface Window {
    __tilesetDebug?: TilesetPickDebuggerApi
  }
}
