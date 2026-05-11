// ─────────────────────────── 默认 UI 组件 ───────────────────────────

import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, cn } from '@zen/ui'
import { ChevronRightIcon } from 'lucide-react'

import type { AssistantToolUIProps } from './types'

const pendingText: Record<
  'input-streaming' | 'input-available' | 'approval-requested' | 'approval-responded',
  string
> = {
  'input-streaming': '正在生成入参…',
  'input-available': '工具执行中…',
  'approval-requested': '等待审批…',
  'approval-responded': '审批已响应，等待执行…'
}

export function ToolPending(props: {
  status: 'input-streaming' | 'input-available' | 'approval-requested' | 'approval-responded'
  text?: string
}) {
  return (
    <p className="text-muted-foreground animate-pulse text-sm">
      {props.text ?? pendingText[props.status]}
    </p>
  )
}

export function ToolError(props: {
  error: Error
  status: 'output-error' | 'schema-error' | 'render-error'
  errorText?: string
}) {
  const prefix =
    props.status === 'output-error'
      ? '工具执行失败'
      : props.status === 'schema-error'
        ? '输出校验失败'
        : '渲染失败'
  return (
    <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-3 text-sm">
      <span className="font-medium">{prefix}：</span>
      {props.errorText ?? props.error.message}
    </div>
  )
}

export function ToolDenied(props: { reason?: string }) {
  return (
    <div className="text-muted-foreground bg-muted rounded-md border p-3 text-sm">
      已拒绝该工具调用{props.reason ? `：${props.reason}` : ''}
    </div>
  )
}

/**
 * 未注册的工具兜底展示（开发调试用）。
 */
export function ToolFallback({ part, className }: AssistantToolUIProps & { className?: string }) {
  return (
    <Collapsible
      className={cn('rounded-md data-[state=open]:bg-muted border bg-muted/40', className)}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="lg" className="border-none p-2 group w-full justify-start">
          <ChevronRightIcon className="group-data-[state=open]:rotate-90" />
          {part.toolName}
          <span className="text-muted-foreground ml-2 text-xs">[{part.state}]</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm overflow-auto">
        <pre className="ps-2 text-muted-foreground  overflow-auto text-xs">
          {JSON.stringify(
            {
              input: part.input,
              output:
                part.output && typeof part.output === 'string'
                  ? JSON.parse(part.output)
                  : part.output,
              errorText: part.errorText
            },
            null,
            2
          )}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  )
}
