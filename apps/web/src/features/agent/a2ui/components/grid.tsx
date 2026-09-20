import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface GridProps {
  children?: string[]
  columns?: number
  gap?: number
}

const MIN_COLUMNS = 1
const MAX_COLUMNS = 4
const DEFAULT_COLUMNS = 2
const DEFAULT_GAP_PX = 12

function resolveColumns(columns: number | undefined): number {
  if (columns === undefined || !Number.isFinite(columns)) return DEFAULT_COLUMNS
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, Math.trunc(columns)))
}

/**
 * CSS Grid 布局：同一行内子项默认 stretch 等高。
 * 子组件（如 Chart / StatCard）需自身 `h-full` 才能撑满单元格。
 */
export function Grid({ props, children }: RendererProps<GridProps>) {
  const childIds = Array.isArray(props.children) ? props.children : []
  const columns = resolveColumns(props.columns)
  const gap = props.gap ?? DEFAULT_GAP_PX

  return (
    <div
      className="grid w-full"
      style={{
        gap: `${gap}px`,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {childIds.map((id) => (
        <div key={id} className="min-w-0 *:h-full">
          {children(id)}
        </div>
      ))}
    </div>
  )
}
