import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface RowProps {
  children?: string[]
  gap?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
}

/** 子项希望至少占这么宽；容器更窄时缩到 100% 并换行。 */
const ROW_ITEM_MIN_WIDTH = '16rem'

export function Row({ props, children }: RendererProps<RowProps>) {
  const childIds = Array.isArray(props.children) ? props.children : []
  const gap = props.gap ?? 12

  return (
    <div
      className="flex w-full flex-wrap"
      style={{
        gap: `${gap}px`,
        alignItems: props.align ?? 'stretch'
      }}
    >
      {childIds.map((id) => (
        <div
          key={id}
          className="max-w-full flex-1 self-stretch *:h-full"
          style={{ flexBasis: ROW_ITEM_MIN_WIDTH, minWidth: `min(100%, ${ROW_ITEM_MIN_WIDTH})` }}
        >
          {children(id)}
        </div>
      ))}
    </div>
  )
}
