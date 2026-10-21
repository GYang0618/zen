import { cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@zen/ui'

import type { RendererProps } from '@copilotkit/a2ui-renderer'
import type { OverflowTooltipSide } from './overflow-text'

export interface A2uiTooltipProps {
  content: string
  text?: string
  child?: string
  side?: OverflowTooltipSide
}

/** 目录组件：可见文案按容器截断，悬浮展示调用方给出的完整说明。 */
export function A2uiTooltip({ props, children }: RendererProps<A2uiTooltipProps>) {
  const side = props.side ?? 'top'
  const label = props.text ?? props.content

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex max-w-full min-w-0 align-middle" />}>
          {props.child ? (
            children(props.child)
          ) : (
            <span className={cn('block max-w-full truncate')}>{label}</span>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs whitespace-pre-wrap text-left">
          {props.content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
