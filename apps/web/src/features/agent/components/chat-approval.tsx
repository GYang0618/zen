'use client'

import { useInterrupt } from '@copilotkit/react-core/v2'
import { Confirmation, ConfirmationAction, ConfirmationActions, ConfirmationTitle } from '@zen/ui'
import { useEffect, useState } from 'react'

import { isApiClientError } from '@/lib/request/utils'

import { buildApprovalDecisions } from '../approval-decision'
import { approvalToInterruptView, resolveApprovalInterrupt } from '../approval-interrupt'
import { extractReadableTargets, resolveApprovalOperation } from '../approval-title'
import { defaultAgentRuntimeApi } from '../runtime-api'

import type { ApprovalInterruptView } from '../approval-interrupt'
import type { AgentApproval } from '../runtime-api'

type CopilotInterrupt = { id?: string; metadata?: Record<string, unknown> } | null
type CopilotInterruptEvent = { value?: unknown } | null

const MAX_INLINE_TARGETS = 3

/**
 * 高风险 Tool 的人工审批 UI。以内联 Confirmation 卡片渲染在消息流末尾（由 chat.tsx 挂载），
 * 而非模态弹框：既保留“阻塞输入、必须处理”的强制力，又不遮挡对话上下文。
 */
export function ChatApprovalRegistration({
  onPendingChange,
  persistedApproval,
  onPersistedDecision,
  onLiveInterrupt
}: {
  onPendingChange?: (pending: boolean) => void
  persistedApproval?: AgentApproval | null
  onPersistedDecision?: (decision: 'approve' | 'reject') => Promise<void>
  onLiveInterrupt?: () => void
}) {
  const interruptElement = useInterrupt({
    renderInChat: false,
    render: ({ interrupt, event, resolve }) => (
      <ApprovalCard interrupt={interrupt} event={event} onDecide={resolve} />
    )
  })

  const pending = Boolean(interruptElement) || Boolean(persistedApproval)

  useEffect(() => {
    onPendingChange?.(pending)
  }, [pending, onPendingChange])

  useEffect(() => {
    if (interruptElement) onLiveInterrupt?.()
  }, [interruptElement, onLiveInterrupt])

  if (interruptElement) return interruptElement
  if (!persistedApproval || !onPersistedDecision) return null

  return (
    <ApprovalCard
      view={approvalToInterruptView(persistedApproval)}
      onDecide={async (payload) => {
        const decision = readDecision(payload)
        await onPersistedDecision(decision)
      }}
    />
  )
}

function ApprovalCard({
  interrupt,
  event,
  view,
  onDecide
}: {
  interrupt?: CopilotInterrupt
  event?: CopilotInterruptEvent
  view?: ApprovalInterruptView
  onDecide: (payload?: unknown, interruptId?: string) => Promise<unknown>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const resolved = view ?? resolveApprovalInterrupt(interrupt, event)
  const toolNames = uniqueToolNames(resolved)
  const operation = resolveApprovalOperation(toolNames)
  const args =
    resolved.actions.length === 1
      ? resolved.actions[0]?.args
      : resolved.actions.length
        ? resolved.actions.map((action) => action.args)
        : resolved.args
  const targets = extractReadableTargets(args)
  const interruptId = resolved.id
  const approvalId = interruptId ?? 'pending'

  const submit = async (decision: 'approve' | 'reject') => {
    setSubmitting(true)
    setError(undefined)
    try {
      if (interruptId) {
        try {
          await defaultAgentRuntimeApi.decideApprovalByInterrupt(interruptId, { decision })
        } catch (approvalError) {
          if (!isApiClientError(approvalError) || approvalError.code !== 404) throw approvalError
        }
      }
      const decisions = buildApprovalDecisions(resolved.actions.length, decision)
      await onDecide({ decisions }, interruptId)
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : decision === 'approve'
            ? '审批提交失败'
            : '拒绝提交失败'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Confirmation
      approval={{ id: approvalId }}
      state={submitting ? 'approval-responded' : 'approval-requested'}
      className="gap-3 p-3"
    >
      <ConfirmationTitle>
        <ConfirmationSentence operation={operation} targets={targets} />
      </ConfirmationTitle>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <ConfirmationActions>
        <ConfirmationAction
          variant="outline"
          disabled={submitting}
          onClick={() => void submit('reject')}
        >
          拒绝
        </ConfirmationAction>
        <ConfirmationAction disabled={submitting} onClick={() => void submit('approve')}>
          确认执行
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  )
}

function ConfirmationSentence({ operation, targets }: { operation: string; targets: string[] }) {
  if (targets.length === 0 || targets.length > MAX_INLINE_TARGETS) {
    const suffix = targets.length > MAX_INLINE_TARGETS ? `（共 ${targets.length} 项）` : ''
    return `确定要${operation}${suffix}吗？`
  }

  return (
    <>
      确定要{operation}{' '}
      {targets.map((target) => (
        <code
          key={target}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
        >
          {target}
        </code>
      ))}{' '}
      吗？
    </>
  )
}

function uniqueToolNames(view: ApprovalInterruptView): string[] {
  return [
    ...new Set(
      [...view.actions.map((action) => action.name), view.toolName].filter((name): name is string =>
        Boolean(name)
      )
    )
  ]
}

function readDecision(payload: unknown): 'approve' | 'reject' {
  const record =
    payload !== null && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : undefined
  const decisions = Array.isArray(record?.decisions) ? record.decisions : []
  const first = decisions[0]
  if (first && typeof first === 'object' && 'type' in first && first.type === 'reject') {
    return 'reject'
  }
  return 'approve'
}
