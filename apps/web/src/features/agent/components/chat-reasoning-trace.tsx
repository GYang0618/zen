'use client'

import {
  CollapsibleTrigger,
  cn,
  MessageResponse,
  Shimmer,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceLine,
  TraceTitle
} from '@zen/ui'
import { BrainIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'

interface ChatReasoningTraceProps {
  content: string
  isStreaming: boolean
  duration?: number
}

function reasoningLabel(isStreaming: boolean, duration?: number): string {
  if (isStreaming) {
    if (duration === undefined) return '思考中...'
    return `思考了 ${duration} 秒`
  }
  if (duration === undefined) return '思考了片刻'
  return `已思考 ${duration} 秒`
}

function ReasoningMark({ open }: { open: boolean }) {
  return (
    <span className="relative flex size-3.5 shrink-0 items-center justify-center">
      <BrainIcon
        className={cn(
          'block size-3.5 transition-opacity',
          open ? 'opacity-0' : 'group-hover:opacity-0 group-focus-visible:opacity-0'
        )}
      />
      <ChevronRightIcon
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 m-auto block size-3.5 transition-[opacity,transform]',
          open
            ? 'rotate-90 opacity-100'
            : 'rotate-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
        )}
      />
    </span>
  )
}

/** 工作区里的思考步骤。流式过程中默认收起，展开后箭头保持可见。 */
export function ChatReasoningTrace({ content, isStreaming, duration }: ChatReasoningTraceProps) {
  const [open, setOpen] = useState(false)
  const label = reasoningLabel(isStreaming, duration)

  return (
    <TraceCollapsible className="not-prose" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-fit max-w-full items-center rounded-md text-left text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <TraceLine status={isStreaming ? 'running' : undefined}>
          <ReasoningMark open={open} />
          <TraceTitle>
            {isStreaming ? (
              <Shimmer as="span" duration={1}>
                {label}
              </Shimmer>
            ) : (
              label
            )}
          </TraceTitle>
        </TraceLine>
      </CollapsibleTrigger>
      {content.length > 0 ? (
        <TraceCollapsibleContent>
          <MessageResponse
            animated
            isAnimating={isStreaming}
            caret={isStreaming ? 'block' : undefined}
          >
            {content}
          </MessageResponse>
        </TraceCollapsibleContent>
      ) : null}
    </TraceCollapsible>
  )
}
