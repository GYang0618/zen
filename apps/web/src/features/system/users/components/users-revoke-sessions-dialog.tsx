import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { isCurrentUserId, useAccessChangeFeedback } from '@/lib/auth/access-change'

import { useRevokeUserSessionsMutation } from '../mutations'

import type { User } from '@zen/shared'

type UsersRevokeSessionsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersRevokeSessionsDialog({
  open,
  onOpenChange,
  currentRow
}: UsersRevokeSessionsDialogProps) {
  const { mutate: revokeUserSessions, isPending } = useRevokeUserSessionsMutation()
  const notifyAccessChange = useAccessChangeFeedback()
  const isSelf = isCurrentUserId(currentRow.id)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isSelf ? '强制下线当前账号？' : '强制下线该用户？'}
      desc={
        isSelf
          ? '将立即注销你的全部在线会话，请重新登录后才能继续使用。'
          : `将立即注销「${currentRow.username}」的全部在线会话。`
      }
      cancelBtnText="取消"
      confirmText="确认下线"
      destructive
      isLoading={isPending}
      handleConfirm={() => {
        revokeUserSessions(currentRow.id, {
          onSuccess: () => {
            notifyAccessChange(currentRow.id, '已强制下线该用户的全部会话', '会话已注销，请重新登录')
            onOpenChange(false)
          },
          onError: (error) => toast.error(error instanceof Error ? error.message : '强制下线失败')
        })
      }}
    />
  )
}
