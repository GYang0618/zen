import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'

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

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="强制下线该用户？"
      desc={`将立即注销「${currentRow.username}」的全部在线会话，对方需重新登录后才能继续使用。`}
      cancelBtnText="取消"
      confirmText="确认下线"
      destructive
      isLoading={isPending}
      handleConfirm={() => {
        revokeUserSessions(currentRow.id, {
          onSuccess: () => {
            toast.success('已强制下线该用户的全部会话')
            onOpenChange(false)
          },
          onError: (error) => toast.error(error instanceof Error ? error.message : '强制下线失败')
        })
      }}
    />
  )
}
