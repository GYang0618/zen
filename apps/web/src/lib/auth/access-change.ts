import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores'

const SELF_RELOGIN_MESSAGE = '权限已变更，请重新登录'

export function isCurrentUserId(userId: string): boolean {
  return useAuthStore.getState().user?.id === userId
}

/**
 * 成员身份变更后的反馈：仅当受影响用户包含当前账号时提示并退出登录。
 * 变更他人账号只展示成功文案，不要求操作者重新登录。
 */
export function useAccessChangeFeedback() {
  const navigate = useNavigate()

  return (
    affectedUserIds: string | readonly string[],
    otherMessage: string,
    selfMessage = SELF_RELOGIN_MESSAGE
  ) => {
    const ids = typeof affectedUserIds === 'string' ? [affectedUserIds] : [...affectedUserIds]
    const currentId = useAuthStore.getState().user?.id
    if (currentId && ids.includes(currentId)) {
      toast.success(selfMessage)
      useAuthStore.getState().clearAuth()
      navigate({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true
      })
      return
    }
    toast.success(otherMessage)
  }
}
