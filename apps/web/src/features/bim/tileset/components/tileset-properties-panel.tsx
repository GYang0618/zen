import { Card, CardContent, CardHeader, CardTitle } from '@zen/ui'

import { filterMeaningfulProperties } from '../lib/property-utils'
import { useTilesetSelectionStore } from '../stores/selection'

function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** 展示当前检视的 3D Tiles 构件结构化属性 */
export function TilesetPropertiesPanel() {
  const inspectedElementId = useTilesetSelectionStore((state) => state.inspectedElementId)
  const inspectedProperties = useTilesetSelectionStore((state) => state.inspectedProperties)

  if (!inspectedElementId || !inspectedProperties) {
    return null
  }

  const allEntries = Object.entries(inspectedProperties)
  if (allEntries.length === 0) {
    return null
  }

  const meaningfulEntries = Object.entries(filterMeaningfulProperties(inspectedProperties))
  const hasOnlyEmptyValues = meaningfulEntries.length === 0

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-10 w-80 max-h-[min(50vh,28rem)] overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base">构件属性</CardTitle>
          <p className="truncate text-xs text-muted-foreground" title={inspectedElementId}>
            {inspectedElementId}
          </p>
        </CardHeader>
        <CardContent className="max-h-[min(40vh,22rem)] space-y-2 overflow-y-auto pt-0">
          {hasOnlyEmptyValues ? (
            <p className="text-sm text-muted-foreground">
              已读取 {allEntries.length} 个属性键，但值均为空。多为导出时只写了 schema
              键名，未写入 property table 字符串数据。
            </p>
          ) : (
            meaningfulEntries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[minmax(5rem,36%)_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">{key}</span>
                <span className="break-all">{formatPropertyValue(value)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
