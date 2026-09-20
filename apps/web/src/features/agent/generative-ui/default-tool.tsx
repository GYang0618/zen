import { UseAgentUpdate, useDefaultRenderTool } from '@copilotkit/react-core/v2'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@zen/ui'
import { useEffect, useMemo, useState } from 'react'

import { useOptionalChatAgent } from '../context/chat-agent-context'
import { isA2UIToolCall } from '../lib/a2ui-tools'
import { formatToolTitle } from '../lib/tool-title'
import { useAgentChatInputStore } from '../stores/agent-chat-input'

import type { ToolPart } from '@zen/ui'

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

type ToolState = ToolPart['state']

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

    // 剥离可能附带给模型的后半句提示指令
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
): ToolState {
  if (isError) return 'output-error'
  if (status === 'complete') return 'output-available'
  if (status === 'executing') return 'input-available'
  return 'input-streaming'
}

function extractToolResultSummary(
  result: string | undefined,
  parsedError: ParsedToolError | null,
  isInterrupted: boolean
): string | null {
  if (isInterrupted) return '执行中断'
  if (parsedError) return parsedError.title

  if (!result) return null

  try {
    const parsed = JSON.parse(result) as Record<string, unknown>
    if (parsed.success === true) return '执行成功'
    if (typeof parsed.total === 'number') return `共 ${parsed.total} 条记录`

    if (Array.isArray(parsed)) {
      return `返回 ${parsed.length} 条数据`
    }
    for (const key of ['items', 'records', 'data', 'users', 'roles', 'posts', 'list']) {
      const val = parsed[key]
      if (Array.isArray(val)) {
        return `返回 ${val.length} 条数据`
      }
    }
    if (typeof parsed.count === 'number') {
      return `共 ${parsed.count} 项`
    }
    if (typeof parsed.message === 'string' && parsed.message.length <= 15) {
      return parsed.message
    }
  } catch {
    if (result.length <= 15 && !result.includes('\n')) {
      return result.trim()
    }
  }

  return '已完成'
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

  // 自愈支持：只要结果已返回且非空，则状态视为已完成
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

  // 超时自愈检测：若未完成且超过阈值，标记为超时
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
  // 若智能体已停止运行或等待超时，但工具未完成，且既不在待审批也不在审批恢复执行中，视作中断/失败
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

  const isRunning =
    ((effectiveStatus === 'inProgress' || effectiveStatus === 'executing') &&
      !isAwaitingApproval &&
      !isInterrupted) ||
    isResolvingApproval
  const [open, setOpen] = useState(isRunning || isAwaitingApproval || isError)

  useEffect(() => {
    if (isRunning || isAwaitingApproval || isError) {
      setOpen(true)
      return
    }

    // 运行完成且未出错时，延时平滑折叠，保持对话主干清晰
    const timer = window.setTimeout(() => setOpen(false), AUTO_COLLAPSE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isRunning, isAwaitingApproval, isError])

  const resultSummary = useMemo(
    () =>
      effectiveStatus === 'complete' || isInterrupted
        ? extractToolResultSummary(result, parsedError, isInterrupted)
        : null,
    [effectiveStatus, result, parsedError, isInterrupted]
  )

  if (isA2UI) {
    return null
  }

  const title = formatToolTitle(name)
  const displayTitle = resultSummary ? `${title} · ${resultSummary}` : title
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
    <Tool data-tool-call-id={toolCallId} open={open} onOpenChange={setOpen}>
      <ToolHeader type="dynamic-tool" toolName={name} title={displayTitle} state={toolState} />
      <ToolContent>
        {hasParams && <ToolInput input={parameters} />}

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

        {result && (
          <ToolOutput
            className="[&_pre]:max-h-64 [&_pre]:overflow-auto"
            output={isError ? undefined : result}
            errorText={isError ? (parsedError ? undefined : result) : undefined}
          />
        )}
      </ToolContent>
    </Tool>
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
