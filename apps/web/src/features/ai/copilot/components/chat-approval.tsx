'use client'

import { useInterrupt } from '@copilotkit/react-core/v2'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button
} from '@zen/ui'
import { Ban, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { buildApprovalDecisions } from '../approval-decision'
import { defaultAgentRuntimeApi } from '../runtime-api'

import type { AgentApproval } from '../runtime-api'

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

export function ChatApprovalRegistration() {
  const interruptElement = useInterrupt({
    renderInChat: false,
    render: ({ event, interrupt, resolve }) => (
      <ApprovalDialog
        interrupt={interrupt}
        legacyValue={parseLegacyInterruptValue(event.value)}
        onApprove={resolve}
        onReject={resolve}
      />
    )
  })
  return interruptElement ?? null
}

function ApprovalDialog({
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
  const [persistedApproval, setPersistedApproval] = useState<AgentApproval>()
  const [error, setError] = useState<string>()
  const metadata = (interrupt?.metadata ?? {}) as InterruptMetadata
  const actions = legacyValue?.actionRequests ?? metadata.value?.actionRequests ?? []
  const toolName =
    actions
      .map((action) => action.name)
      .filter(Boolean)
      .join('、') ||
    metadata.toolName ||
    '高风险操作'
  const args =
    actions.length === 1
      ? actions[0]?.args
      : actions.length
        ? actions.map((action) => action.args)
        : metadata.args
  const interruptId = interrupt?.id ?? legacyValue?.__zenInterruptId

  useEffect(() => {
    if (!interruptId) return
    let active = true
    void defaultAgentRuntimeApi.listApprovals('pending').then((items) => {
      if (active) setPersistedApproval(items.find((item) => item.interruptId === interruptId))
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : '无法加载审批记录')
    })
    return () => { active = false }
  }, [interruptId])

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

  const cancelRun = async () => {
    if (!persistedApproval || !interruptId) return
    setSubmitting(true)
    setError(undefined)
    try {
      await defaultAgentRuntimeApi.cancelRun(persistedApproval.runId)
      const decisions = buildApprovalDecisions(actions.length, 'reject')
      await onReject({ decisions }, interrupt?.id)
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : '取消运行失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </div>
          <AlertDialogTitle>需要确认操作</AlertDialogTitle>
          <AlertDialogDescription>
            {interrupt?.message ||
              actions[0]?.description ||
              '此操作会修改敏感业务数据，执行后不会因对话取消而自动回滚。'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="min-w-0 rounded-md border bg-muted/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{persistedApproval?.operation || toolName}</Badge>
            {persistedApproval?.riskLevel && (
              <Badge variant="destructive">风险：{persistedApproval.riskLevel}</Badge>
            )}
          </div>
          {persistedApproval?.targetSummary && (
            <p className="mt-2 text-sm">{persistedApproval.targetSummary}</p>
          )}
          {persistedApproval?.impactSummary && (
            <p className="mt-1 text-sm text-muted-foreground">{persistedApproval.impactSummary}</p>
          )}
          {args !== undefined && (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">
              {JSON.stringify(args, null, 2)}
            </pre>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <Button
            variant="destructive"
            disabled={submitting || !persistedApproval}
            onClick={() => void cancelRun()}
          >
            <Ban data-icon="inline-start" />
            取消整个 Run
          </Button>
          <AlertDialogCancel disabled={submitting || !interruptId} onClick={() => void reject()}>
            拒绝
          </AlertDialogCancel>
          <AlertDialogAction disabled={submitting || !interruptId} onClick={() => void approve()}>
            确认执行
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
