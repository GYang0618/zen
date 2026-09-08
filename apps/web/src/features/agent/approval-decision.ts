export type ApprovalDecision =
  | { type: 'approve' }
  | {
      type: 'reject'
      message: string
    }

const FINAL_REJECTION_MESSAGE =
  '用户已拒绝执行该操作。这是当前用户消息的最终决定：不得在本轮再次调用同一工具或任何等效写操作。请直接说明操作已取消；仅当用户发送新的明确请求时，才可重新发起审批。'

export function buildApprovalDecisions(
  actionCount: number,
  decision: 'approve' | 'reject'
): ApprovalDecision[] {
  return Array.from({ length: Math.max(1, actionCount) }, () =>
    decision === 'approve'
      ? { type: 'approve' as const }
      : { type: 'reject' as const, message: FINAL_REJECTION_MESSAGE }
  )
}

export function toHitlResume(decisions: ApprovalDecision[]) {
  return { decisions }
}
