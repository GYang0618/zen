import { ZEN_A2UI_CATALOG_ID } from '@zen/shared'

const A2UI_PROTOCOL_VERSION = 'v0.9' as const

/**
 * 将官方 `render_a2ui({ surfaceId, components, data })` 参数转成 A2UI v0.9 操作列表。
 * 形状与 `@ag-ui/a2ui-toolkit` 的 `assembleOps({ intent: 'create' })` 一致。
 */
export function assembleRenderA2uiOperations(
  args: Record<string, unknown>,
  targetSurfaceId?: string
): Array<Record<string, unknown>> | null {
  const rawComponents = args.components
  if (!Array.isArray(rawComponents) || rawComponents.length === 0) return null

  const components = rawComponents.map((comp) => {
    if (
      comp &&
      typeof comp === 'object' &&
      !Array.isArray(comp) &&
      'props' in comp &&
      typeof comp.props === 'object' &&
      comp.props !== null &&
      !Array.isArray(comp.props)
    ) {
      const { props: innerProps, ...rest } = comp as {
        props: Record<string, unknown>
        [k: string]: unknown
      }
      return { ...rest, ...innerProps }
    }
    return comp
  })

  const surfaceId =
    targetSurfaceId ||
    (typeof args.surfaceId === 'string' && args.surfaceId.trim().length > 0
      ? args.surfaceId
      : 'a2ui-surface')

  const operations: Array<Record<string, unknown>> = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: { surfaceId, catalogId: ZEN_A2UI_CATALOG_ID }
    },
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: { surfaceId, components }
    }
  ]

  const data = args.data
  if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
    operations.push({
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: { surfaceId, path: '/', value: data }
    })
  }

  return operations
}
