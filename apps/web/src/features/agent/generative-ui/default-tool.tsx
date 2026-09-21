import { UseAgentUpdate, useDefaultRenderTool } from '@copilotkit/react-core/v2'
import { CodeBlock, Shimmer } from '@zen/ui'
import {
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  LoaderCircleIcon,
  WrenchIcon,
  XCircleIcon
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ChatFoldPanel } from '../components/chat-fold-panel'
import { useOptionalChatAgent } from '../context/chat-agent-context'
import { isA2UIToolCall } from '../lib/a2ui-tools'
import { formatToolTitle } from '../lib/tool-title'
import { useAgentChatInputStore } from '../stores/agent-chat-input'

import type { ReactNode } from 'react'

const AUTO_COLLAPSE_DELAY_MS = 1000
const TOOL_EXECUTION_TIMEOUT_MS = 25_000

export interface DefaultToolCardProps {
  name: string
  toolCallId?: string
  parameters: unknown
  status: 'inProgress' | 'executing' | 'complete'
  result: string | undefined
  isAgentRunning?: boolean
}

export interface ParsedToolError {
  isError: boolean
  title: string
  message: string
  code?: number
  reason?: string
}

type ToolUiState =
  | 'approval-requested'
  | 'input-available'
  | 'input-streaming'
  | 'output-available'
  | 'output-error'

const TOOL_STATE_LABELS: Record<ToolUiState, string> = {
  'approval-requested': '等待确认',
  'input-available': '执行中',
  'input-streaming': '准备中',
  'output-available': '已完成',
  'output-error': '失败'
}

const TOOL_STATE_ICONS: Record<ToolUiState, ReactNode> = {
  'approval-requested': <ClockIcon className="size-3.5 text-amber-600 dark:text-amber-400" />,
  'input-available': (
    <LoaderCircleIcon className="size-3.5 animate-spin text-sky-600 dark:text-sky-400" />
  ),
  'input-streaming': <CircleIcon className="size-3.5 text-muted-foreground" />,
  'output-available': (
    <CheckCircleIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
  ),
  'output-error': <XCircleIcon className="size-3.5 text-destructive" />
}

function ToolStateIcon({ state }: { state: ToolUiState }) {
  return (
    <span
      className="flex size-3.5 -translate-y-px items-center justify-center [&_svg]:block"
      role="img"
      aria-label={TOOL_STATE_LABELS[state]}
    >
      {TOOL_STATE_ICONS[state]}
    </span>
  )
}

export function parseToolResultError(result: string | undefined): ParsedToolError | null {
  if (!result) return null
  try {
    const parsed = JSON.parse(result) as Record<string, unknown>
    const hasErrorCode = typeof parsed.code === 'number' && parsed.code >= 400
    const hasSuccessFalse = parsed.success === false
    const hasErrorField = parsed.error !== undefined && parsed.error !== null

    if (!hasErrorCode && !hasSuccessFalse && !hasErrorField) {
      return null
    }

    const code = typeof parsed.code === 'number' ? parsed.code : undefined
    const reason = typeof parsed.reason === 'string' ? parsed.reason : undefined
    let rawMessage = ''

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      rawMessage = parsed.message.trim()
    } else if (typeof parsed.error === 'string' && parsed.error.trim()) {
      rawMessage = parsed.error.trim()
    } else if (
      typeof parsed.error === 'object' &&
      parsed.error !== null &&
      'message' in parsed.error
    ) {
      rawMessage = String((parsed.error as { message: unknown }).message).trim()
    }

    const cleanMessage =
      rawMessage.split('。请')[0].split('。不要再次')[0].split('。禁止')[0].trim() || rawMessage
    const shortSummary = cleanMessage.split(/[,，;；]/)[0].trim()

    let title = '执行失败'
    if (reason === 'TOOL_UNAVAILABLE' || (code !== undefined && code >= 500)) {
      title = '服务暂不可用'
    } else if (reason === 'NETWORK_ERROR') {
      title = '网络连接异常'
    } else if (reason === 'TIMEOUT') {
      title = '请求超时'
    } else if (reason === 'UNAUTHORIZED') {
      title = '认证失效'
    } else if (reason === 'FORBIDDEN') {
      title = '无权限'
    } else if (shortSummary && shortSummary.length <= 16 && !shortSummary.includes('\n')) {
      title = shortSummary
    }

    return {
      isError: true,
      title,
      message: cleanMessage || '接口调用失败，未返回具体原因',
      code,
      reason
    }
  } catch {
    if (result.startsWith('Error:') || result.startsWith('失败:')) {
      const msg = result.replace(/^(Error:|失败:)\s*/, '').trim()
      return {
        isError: true,
        title: '执行失败',
        message: msg
      }
    }
  }
  return null
}

function mapToToolState(
  status: 'inProgress' | 'executing' | 'complete',
  isError: boolean
): ToolUiState {
  if (isError) return 'output-error'
  if (status === 'complete') return 'output-available'
  if (status === 'executing') return 'input-available'
  return 'input-streaming'
}

function JsonSection({ label, value }: { label: string; value: unknown }) {
  const code = typeof value === 'string' ? value : JSON.stringify(value, null, 2)

  return (
    <div className="space-y-2 overflow-hidden">
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</h4>
      <div className="max-h-64 overflow-auto rounded-md bg-muted/50">
        <CodeBlock code={code} language="json" />
      </div>
    </div>
  )
}

export function DefaultToolCard({
  name,
  toolCallId,
  parameters,
  status,
  result,
  isAgentRunning: propIsAgentRunning
}: DefaultToolCardProps) {
  const isA2UI = useMemo(() => {
    return isA2UIToolCall({
      function: {
        name,
        arguments: typeof parameters === 'string' ? parameters : JSON.stringify(parameters)
      }
    })
  }, [name, parameters])

  const { agent } = useOptionalChatAgent({
    updates: [UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 100
  })
  const isAgentRunning = propIsAgentRunning ?? (agent ? agent.isRunning : true)

  const effectiveStatus: 'inProgress' | 'executing' | 'complete' =
    status === 'complete' || (result !== undefined && result !== '') ? 'complete' : status

  const pendingApprovalTools = useAgentChatInputStore((state) => state.pendingApprovalTools)
  const resolvingApprovalToolNames = useAgentChatInputStore(
    (state) => state.resolvingApprovalToolNames
  )
  const clearResolvingApprovalTools = useAgentChatInputStore(
    (state) => state.clearResolvingApprovalTools
  )

  const isAwaitingApproval = useMemo(() => {
    return effectiveStatus !== 'complete' && pendingApprovalTools.some((t) => t.name === name)
  }, [effectiveStatus, pendingApprovalTools, name])

  const isResolvingApproval = useMemo(() => {
    return effectiveStatus !== 'complete' && resolvingApprovalToolNames.has(name)
  }, [effectiveStatus, resolvingApprovalToolNames, name])

  useEffect(() => {
    if (effectiveStatus === 'complete' && resolvingApprovalToolNames.has(name)) {
      clearResolvingApprovalTools(name)
    }
  }, [effectiveStatus, resolvingApprovalToolNames, name, clearResolvingApprovalTools])

  const [isTimedOut, setIsTimedOut] = useState(false)
  useEffect(() => {
    if (effectiveStatus === 'complete' || isAwaitingApproval) {
      setIsTimedOut(false)
      return
    }

    const timer = window.setTimeout(() => {
      setIsTimedOut(true)
    }, TOOL_EXECUTION_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [effectiveStatus, isAwaitingApproval])

  const parsedError = useMemo(() => parseToolResultError(result), [result])
  const isInterrupted =
    (!isAgentRunning || isTimedOut) &&
    effectiveStatus !== 'complete' &&
    !isAwaitingApproval &&
    !isResolvingApproval
  const isError = Boolean(parsedError) || isInterrupted

  const toolState = isAwaitingApproval
    ? 'approval-requested'
    : isResolvingApproval
      ? 'input-available'
      : isInterrupted
        ? 'output-error'
        : mapToToolState(effectiveStatus, isError)

  const isBusy = toolState === 'input-streaming' || toolState === 'input-available'
  const [open, setOpen] = useState(isAwaitingApproval || isError)

  useEffect(() => {
    if (isAwaitingApproval || isError) {
      setOpen(true)
      return
    }

    const timer = window.setTimeout(() => setOpen(false), AUTO_COLLAPSE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isAwaitingApproval, isError])

  if (isA2UI) {
    return null
  }

  const title = formatToolTitle(name)
  const hasParams =
    parameters !== undefined &&
    parameters !== null &&
    (typeof parameters !== 'object' || Object.keys(parameters as object).length > 0)

  const errorMessage =
    parsedError?.message ??
    (isTimedOut
      ? '工具执行响应超时，请重试或检查后端服务状态'
      : isInterrupted
        ? '智能体运行已结束，该工具未收到后端响应，已被终止'
        : undefined)

  return (
    <ChatFoldPanel
      className="not-prose"
      open={open}
      onOpenChange={setOpen}
      icon={<WrenchIcon className="block size-3.5" />}
      trigger={
        isBusy ? (
          <Shimmer as="span" className="leading-none" duration={1}>
            {title}
          </Shimmer>
        ) : (
          <span className="leading-none">{title}</span>
        )
      }
      trailing={<ToolStateIcon state={toolState} />}
    >
      <div className="flex flex-col gap-4 pt-4" data-tool-call-id={toolCallId}>
        {hasParams && <JsonSection label="参数" value={parameters} />}

        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs">
            <div className="flex items-center justify-between font-medium">
              <span>{parsedError?.title ?? (isTimedOut ? '请求超时' : '执行中断')}</span>
              {parsedError?.code ? (
                <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px]">
                  HTTP {parsedError.code}
                </span>
              ) : null}
            </div>
            {errorMessage && <p className="mt-1 text-muted-foreground">{errorMessage}</p>}
          </div>
        )}

        {result && !isError && <JsonSection label="结果" value={result} />}
        {isError && !parsedError && result ? <JsonSection label="错误" value={result} /> : null}
      </div>
    </ChatFoldPanel>
  )
}

export function useDefaultToolRender() {
  useDefaultRenderTool({
    render: ({ name, parameters, status, result, toolCallId }) => (
      <DefaultToolCard
        name={name}
        toolCallId={toolCallId}
        parameters={parameters}
        status={status}
        result={result}
      />
    )
  })
}
