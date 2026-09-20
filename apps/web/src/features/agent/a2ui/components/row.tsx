import type { RendererProps } from '@copilotkit/a2ui-renderer'

export interface RowProps {
  children?: string[]
  gap?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export function Row({ props, children }: RendererProps<RowProps>) {
  const childIds = Array.isArray(props.children) ? props.children : []
  const gap = props.gap ?? 12

  return (
    <div
      className="flex flex-wrap w-full"
      style={{
        gap: `${gap}px`,
        alignItems: props.align ?? 'stretch'
      }}
    >
      {childIds.map((id) => (
        <div key={id} className="flex-1 min-w-50">
          {children(id)}
        </div>
      ))}
    </div>
  )
}
