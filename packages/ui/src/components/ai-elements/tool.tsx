'use client'

import { Badge } from '@zen/ui/components/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@zen/ui/components/collapsible'
import { cn } from '@zen/ui/lib/utils'
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  Loader2Icon,
  WrenchIcon,
  XCircleIcon
} from 'lucide-react'
import { isValidElement } from 'react'

import { CodeBlock } from './code-block'

import type { ComponentProps, ReactNode } from 'react'

export type ToolState =
  | 'approval-requested'
  | 'approval-responded'
  | 'input-available'
  | 'input-streaming'
  | 'output-available'
  | 'output-denied'
  | 'output-error'

export type ToolProps = ComponentProps<typeof Collapsible>

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible className={cn('not-prose mb-2.5 w-full rounded-md border', className)} {...props} />
)

const STATUS_LABELS: Record<ToolState, string> = {
  'approval-requested': '等待确认',
  'approval-responded': '已响应',
  'input-available': '执行中',
  'input-streaming': '准备中',
  'output-available': '已完成',
  'output-denied': '已拒绝',
  'output-error': '失败'
}

function StatusIcon({ state }: { state: ToolState }) {
  switch (state) {
    case 'input-available':
      return <Loader2Icon className="animate-spin" />
    case 'input-streaming':
    case 'approval-requested':
      return <ClockIcon />
    case 'output-available':
    case 'approval-responded':
      return <CheckCircleIcon />
    case 'output-error':
    case 'output-denied':
      return <XCircleIcon />
  }
}

export function getStatusBadge(state: ToolState) {
  const isError = state === 'output-error' || state === 'output-denied'

  return (
    <Badge variant={isError ? 'destructive' : 'secondary'}>
      <StatusIcon state={state} />
      {STATUS_LABELS[state]}
    </Badge>
  )
}

export type ToolHeaderProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string
  state: ToolState
}

export const ToolHeader = ({ className, title, state, ...props }: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      'group flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
      className
    )}
    {...props}
  >
    <WrenchIcon className="size-4 shrink-0" />
    <span className="min-w-0 flex-1 truncate text-left font-medium">{title}</span>
    {getStatusBadge(state)}
    <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
)

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'border-t text-sm outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
)

export type ToolInputProps = ComponentProps<'div'> & {
  input: unknown
}

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => {
  if (input === undefined) return null

  return (
    <div className={cn('flex flex-col gap-2 p-3', className)} {...props}>
      <span className="text-muted-foreground text-xs">参数</span>
      <CodeBlock code={stringifyJson(input)} language="json" />
    </div>
  )
}

export type ToolOutputProps = ComponentProps<'div'> & {
  output?: unknown
  errorText?: string
}

export const ToolOutput = ({ className, output, errorText, ...props }: ToolOutputProps) => {
  if (!(output || errorText)) return null

  let rendered: ReactNode = output as ReactNode

  if (typeof output === 'object' && !isValidElement(output)) {
    rendered = <CodeBlock code={stringifyJson(output)} language="json" />
  } else if (typeof output === 'string') {
    rendered = <CodeBlock code={stringifyJson(output)} language="json" />
  }

  return (
    <div className={cn('flex flex-col gap-2 p-3', className)} {...props}>
      <span className="text-muted-foreground text-xs">{errorText ? '错误' : '结果'}</span>
      {errorText ? <p className="text-destructive text-sm">{errorText}</p> : rendered}
    </div>
  )
}

function stringifyJson(value: unknown): string {
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
