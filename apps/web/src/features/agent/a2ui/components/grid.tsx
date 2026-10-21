import { cn } from '@zen/ui'

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

/**
 * columns 是最大列数。断点看网格自身宽度，不看视口。
 * @lg 32rem 起两列，@2xl 42rem 起图表双列，@4xl / @5xl 再展开三列和四列。
 */
const GRID_COLUMN_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @2xl/grid:grid-cols-2',
  3: 'grid-cols-1 @xl/grid:grid-cols-2 @5xl/grid:grid-cols-3',
  4: 'grid-cols-1 @lg/grid:grid-cols-2 @4xl/grid:grid-cols-4'
}

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
    <div className="@container/grid w-full min-w-0">
      <div className={cn('grid w-full', GRID_COLUMN_CLASS[columns])} style={{ gap: `${gap}px` }}>
        {childIds.map((id) => (
          <div key={id} className="min-w-0 *:h-full">
            {children(id)}
          </div>
        ))}
      </div>
    </div>
  )
}
