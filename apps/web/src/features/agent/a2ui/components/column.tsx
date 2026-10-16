import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface ColumnProps {
  children?: string[]
  gap?: number
}

export function Column({ props, children }: RendererProps<ColumnProps>) {
  const childIds = Array.isArray(props.children) ? props.children : []
  const gap = props.gap ?? 16

  return (
    <div className="flex flex-col w-full" style={{ gap: `${gap}px` }}>
      {childIds.map((id) => (
        <div key={id} className="w-full">
          {children(id)}
        </div>
      ))}
    </div>
  )
}
