'use client'

import { useInterrupt } from '@copilotkit/react-core/v2'
import { Confirmation, ConfirmationAction, ConfirmationActions, ConfirmationTitle } from '@zen/ui'
import { useEffect, useState } from 'react'

import type { InterruptEvent } from '@copilotkit/react-core/v2'

interface ChatApprovalRegistrationProps {
  onPendingChange?: (pending: boolean) => void
}

/**
 * 高风险操作的人工审批 UI（HITL）。
 * 使用 CopilotKit 官方 useInterrupt，以内联 Confirmation 卡片渲染在消息流末尾。
 */
export function ChatApprovalRegistration({ onPendingChange }: ChatApprovalRegistrationProps) {
  const interruptElement = useInterrupt({
    renderInChat: false,
    render: ({ event, interrupt, resolve, cancel }) => (
      <ApprovalCard
        event={event}
        interruptId={interrupt?.id ?? event.name}
        onApprove={() => resolve({ approved: true })}
        onReject={() => {
          resolve({ approved: false })
          cancel()
        }}
      />
    )
  })

  const pending = Boolean(interruptElement)

  useEffect(() => {
    onPendingChange?.(pending)
  }, [pending, onPendingChange])

  if (!interruptElement) return null

  return interruptElement
}

interface ApprovalCardProps {
  event: InterruptEvent<unknown>
  interruptId: string
  onApprove: () => void
  onReject: () => void
}

function ApprovalCard({ event, interruptId, onApprove, onReject }: ApprovalCardProps) {
  const [submitting, setSubmitting] = useState(false)

  const value = event?.value as Record<string, unknown> | undefined
  const title =
    (typeof value?.message === 'string' && value.message) ||
    (typeof value?.title === 'string' && value.title) ||
    (typeof value?.action === 'string' && `确定要执行 ${value.action} 操作吗？`) ||
    '该操作需要您的授权与审批，是否确认执行？'

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
      <ConfirmationTitle>{title}</ConfirmationTitle>
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
