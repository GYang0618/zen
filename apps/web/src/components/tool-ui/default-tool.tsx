// ─────────────────────────── 默认 UI 组件 ───────────────────────────

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
export function ToolFallback({ part }: AssistantToolUIProps) {
  return (
    <details className="bg-muted/40 rounded-md border p-3 text-sm">
      <summary className="cursor-pointer font-mono">
        {part.toolName}
        <span className="text-muted-foreground ml-2 text-xs">[{part.state}]</span>
      </summary>
      <pre className="text-muted-foreground mt-2 overflow-auto text-xs">
        {JSON.stringify(
          { input: part.input, output: part.output, errorText: part.errorText },
          null,
          2
        )}
      </pre>
    </details>
  )
}
