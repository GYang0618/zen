'use client'

import { useInterrupt } from '@copilotkit/react-core/v2'
import { Confirmation, ConfirmationAction, ConfirmationActions, ConfirmationTitle } from '@zen/ui'
import { useEffect, useMemo, useState } from 'react'

import { useChatAgent } from '../context/chat-agent-context'
import { formatToolTitle } from '../lib/tool-title'
import { useAgentChatInputStore } from '../stores/agent-chat-input'

import type { PendingApprovalTool } from '../stores/agent-chat-input'

export interface ParsedInterruptValue {
  actionRequests: PendingApprovalTool[]
  message?: string
  title?: string
  action?: string
}

export function parseInterruptValue(rawValue: unknown): ParsedInterruptValue {
  let parsed = rawValue
  if (typeof rawValue === 'string') {
    try {
      parsed = JSON.parse(rawValue)
    } catch {
      return { actionRequests: [], message: rawValue }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { actionRequests: [] }
  }

  const obj = parsed as Record<string, unknown>
  const actionRequests: PendingApprovalTool[] = []

  if (Array.isArray(obj.actionRequests)) {
    for (const item of obj.actionRequests) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as { name?: unknown }).name === 'string'
      ) {
        const ar = item as { name: string; args?: unknown; description?: unknown }
        actionRequests.push({
          name: ar.name,
          args:
            typeof ar.args === 'object' && ar.args !== null
              ? (ar.args as Record<string, unknown>)
              : undefined,
          description: typeof ar.description === 'string' ? ar.description : undefined
        })
      }
    }
  }

  return {
    actionRequests,
    message: typeof obj.message === 'string' ? obj.message : undefined,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    action: typeof obj.action === 'string' ? obj.action : undefined
  }
}

interface ChatApprovalRegistrationProps {
  onPendingChange?: (pending: boolean) => void
}

/**
 * 高风险操作的人工审批 UI（HITL）。
 * 使用 CopilotKit 官方 useInterrupt，以内联 Confirmation 卡片渲染在消息流末尾。
 */
export function ChatApprovalRegistration({ onPendingChange }: ChatApprovalRegistrationProps) {
  const { isReady } = useChatAgent()
  const clearPendingApprovalTools = useAgentChatInputStore(
    (state) => state.clearPendingApprovalTools
  )

  useEffect(() => {
    return () => {
      clearPendingApprovalTools()
    }
  }, [clearPendingApprovalTools])

  if (!isReady) return null

  return <ChatApprovalRegistrationInner onPendingChange={onPendingChange} />
}

function ChatApprovalRegistrationInner({ onPendingChange }: ChatApprovalRegistrationProps) {
  const { agent } = useChatAgent()
  const clearPendingApprovalTools = useAgentChatInputStore(
    (state) => state.clearPendingApprovalTools
  )

  const interruptElement = useInterrupt({
    agentId: agent.agentId,
    renderInChat: false,
    render: ({ event, interrupt, resolve }) => {
      const rawValue = (interrupt as { value?: unknown } | null | undefined)?.value ?? event?.value
      return (
        <ApprovalCardWrapper
          rawValue={rawValue}
          interruptId={interrupt?.id ?? event.name}
          onResolve={(payload) => resolve(payload)}
        />
      )
    }
  })

  const pending = Boolean(interruptElement)

  useEffect(() => {
    onPendingChange?.(pending)
    if (!pending) {
      clearPendingApprovalTools()
    }
  }, [pending, onPendingChange, clearPendingApprovalTools])

  useEffect(() => {
    return () => {
      clearPendingApprovalTools()
    }
  }, [clearPendingApprovalTools])

  if (!interruptElement) return null

  return interruptElement
}

interface ApprovalCardWrapperProps {
  rawValue: unknown
  interruptId: string
  onResolve: (payload: unknown) => void
}

function ApprovalCardWrapper({ rawValue, interruptId, onResolve }: ApprovalCardWrapperProps) {
  const setPendingApprovalTools = useAgentChatInputStore((state) => state.setPendingApprovalTools)
  const clearPendingApprovalTools = useAgentChatInputStore(
    (state) => state.clearPendingApprovalTools
  )
  const parsed = useMemo(() => parseInterruptValue(rawValue), [rawValue])

  useEffect(() => {
    if (parsed.actionRequests.length > 0) {
      setPendingApprovalTools(parsed.actionRequests)
    }
    return () => {
      clearPendingApprovalTools()
    }
  }, [parsed.actionRequests, setPendingApprovalTools, clearPendingApprovalTools])

  const handleApprove = () => {
    const decisions =
      parsed.actionRequests.length > 0
        ? parsed.actionRequests.map(() => ({ type: 'approve' as const }))
        : [{ type: 'approve' as const }]

    onResolve({
      approved: true,
      decisions
    })
  }

  const handleReject = () => {
    const decisions =
      parsed.actionRequests.length > 0
        ? parsed.actionRequests.map(() => ({
            type: 'reject' as const,
            message: '用户已拒绝执行该操作'
          }))
        : [{ type: 'reject' as const, message: '用户已拒绝执行该操作' }]

    onResolve({
      approved: false,
      decisions
    })
  }

  return (
    <ApprovalCard
      parsed={parsed}
      interruptId={interruptId}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  )
}

interface ApprovalCardProps {
  parsed: ParsedInterruptValue
  interruptId: string
  onApprove: () => void
  onReject: () => void
}

function getApprovalTitle(parsed: ParsedInterruptValue): string {
  if (parsed.title) return parsed.title
  if (parsed.message) return parsed.message
  if (parsed.action) return `确定要执行 ${parsed.action} 操作吗？`

  if (parsed.actionRequests.length === 1) {
    const name = parsed.actionRequests[0].name
    return `确定要执行「${formatToolTitle(name)}」操作吗？`
  }

  if (parsed.actionRequests.length > 1) {
    const names = parsed.actionRequests.map((a) => `「${formatToolTitle(a.name)}」`).join('、')
    return `确定要执行以下操作吗：${names}？`
  }

  return '该操作需要您的授权与审批，是否确认执行？'
}

function ApprovalCard({ parsed, interruptId, onApprove, onReject }: ApprovalCardProps) {
  const [submitting, setSubmitting] = useState(false)
  const title = useMemo(() => getApprovalTitle(parsed), [parsed])

  const handleApprove = () => {
    setSubmitting(true)
    onApprove()
  }

  const handleReject = () => {
    setSubmitting(true)
    onReject()
  }

  return (
    <Confirmation
      approval={{ id: interruptId }}
      state={submitting ? 'approval-responded' : 'approval-requested'}
      className="gap-3 p-3"
    >
      <ConfirmationTitle>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{title}</span>
          <span className="text-muted-foreground text-xs">
            此操作涉及敏感业务数据修改，请确认后继续。
          </span>
        </div>
      </ConfirmationTitle>
      <ConfirmationActions>
        <ConfirmationAction variant="outline" disabled={submitting} onClick={handleReject}>
          拒绝
        </ConfirmationAction>
        <ConfirmationAction disabled={submitting} onClick={handleApprove}>
          确认执行
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  )
}
