'use client'

import { useInterrupt } from '@copilotkit/react-core/v2'
import { Confirmation, ConfirmationAction, ConfirmationActions, ConfirmationTitle } from '@zen/ui'
import { useEffect, useState } from 'react'

import { buildApprovalDecisions } from '../approval-decision'
import { extractReadableTargets, resolveApprovalOperation } from '../approval-title'
import { defaultAgentRuntimeApi } from '../runtime-api'

type InterruptMetadata = {
  toolName?: string
  args?: unknown
  value?: {
    actionRequests?: ApprovalAction[]
  }
}

type ApprovalAction = { name?: string; args?: unknown; description?: string }
type LegacyInterruptValue = {
  __zenInterruptId?: string
  actionRequests?: ApprovalAction[]
}

const MAX_INLINE_TARGETS = 3

/**
 * 高风险 Tool 的人工审批 UI。以内联 Confirmation 卡片渲染在消息流末尾（由 chat.tsx 挂载），
 * 而非模态弹框：既保留“阻塞输入、必须处理”的强制力，又不遮挡对话上下文。
 */
export function ChatApprovalRegistration({
  onPendingChange
}: {
  onPendingChange?: (pending: boolean) => void
}) {
  const interruptElement = useInterrupt({
    renderInChat: false,
    render: ({ event, interrupt, resolve }) => (
      <ApprovalCard
        interrupt={interrupt}
        legacyValue={parseLegacyInterruptValue(event.value)}
        onApprove={resolve}
        onReject={resolve}
      />
    )
  })

  useEffect(() => {
    onPendingChange?.(Boolean(interruptElement))
  }, [interruptElement, onPendingChange])

  return interruptElement ?? null
}

function ApprovalCard({
  interrupt,
  legacyValue,
  onApprove,
  onReject
}: {
  interrupt: { id: string; message?: string; metadata?: Record<string, unknown> } | null
  legacyValue?: LegacyInterruptValue
  onApprove: (payload?: unknown, interruptId?: string) => Promise<unknown>
  onReject: (payload?: unknown, interruptId?: string) => Promise<unknown>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const metadata = (interrupt?.metadata ?? {}) as InterruptMetadata
  const actions = legacyValue?.actionRequests ?? metadata.value?.actionRequests ?? []
  const actionToolNames = actions
    .map((action) => action.name)
    .filter((name): name is string => Boolean(name))
  const uniqueToolNames = [
    ...new Set(
      actionToolNames.length ? actionToolNames : metadata.toolName ? [metadata.toolName] : []
    )
  ]
  const operation = resolveApprovalOperation(uniqueToolNames)
  const args =
    actions.length === 1
      ? actions[0]?.args
      : actions.length
        ? actions.map((action) => action.args)
        : metadata.args
  const targets = extractReadableTargets(args)
  const interruptId = interrupt?.id ?? legacyValue?.__zenInterruptId
  const approvalId = interruptId ?? 'pending'

  const recordDecision = async (decision: 'approve' | 'reject') => {
    if (interruptId) {
      await defaultAgentRuntimeApi.decideApprovalByInterrupt(interruptId, { decision })
    }
  }

  const approve = async () => {
    if (!interruptId) return
    setSubmitting(true)
    setError(undefined)
    try {
      await recordDecision('approve')
      const decisions = buildApprovalDecisions(actions.length, 'approve')
      await onApprove({ decisions }, interrupt?.id)
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : '审批提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const reject = async () => {
    if (!interruptId) return
    setSubmitting(true)
    setError(undefined)
    try {
      await recordDecision('reject')
      const decisions = buildApprovalDecisions(actions.length, 'reject')
      await onReject({ decisions }, interrupt?.id)
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : '拒绝提交失败')
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
          disabled={submitting || !interruptId}
          onClick={() => void reject()}
        >
          拒绝
        </ConfirmationAction>
        <ConfirmationAction disabled={submitting || !interruptId} onClick={() => void approve()}>
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

function parseLegacyInterruptValue(value: unknown): LegacyInterruptValue | undefined {
  if (typeof value !== 'string') {
    return value !== null && typeof value === 'object' ? (value as LegacyInterruptValue) : undefined
  }
  try {
    const parsed = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object'
      ? (parsed as LegacyInterruptValue)
      : undefined
  } catch {
    return undefined
  }
}
