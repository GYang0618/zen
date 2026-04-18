import { useLocation, useNavigate } from '@tanstack/react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { useSignOutMutation } from '@/features/auth/mutations'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { mutate: signOut, isPending } = useSignOutMutation()

  const handleSignOut = () => {
    const redirect = location.href

    signOut(undefined, {
      onSettled: () => {
        navigate({
          to: '/sign-in',
          search: { redirect },
          replace: true
        })
      }
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="退出登录"
      desc="确认退出当前账号吗？退出后需要重新登录才能继续访问。"
      confirmText="确认退出"
      destructive
      handleConfirm={handleSignOut}
      isLoading={isPending}
      className="sm:max-w-sm"
    />
  )
}
