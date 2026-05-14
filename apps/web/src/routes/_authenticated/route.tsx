import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { cn } from '@zen/ui'

import { AuthenticatedLayout } from '@/components/layouts'
import { CopilotPopup } from '@/features/ai/copilotkit'
import { authApi } from '@/features/auth/api'
import { isForbidden, isSessionExpired } from '@/lib/request/utils'
import { useAuthStore } from '@/stores'

import type { AppPath } from '@/types/router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) return

    try {
      const session = await authApi.refresh()
      useAuthStore.getState().setAuth(session)
    } catch (error) {
      if (isSessionExpired(error)) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
          replace: true
        })
      } else if (isForbidden(error)) {
        throw redirect({
          to: '/errors/403',
          replace: true
        })
      }
    }
  },
  component: AuthenticatedLayoutComponent
})

/** 不需要显示 CopilotPopup 的页面 */
const COPILOT_POPUP_EXCLUDED_PATHS: readonly AppPath[] = ['/ai/chat', '/ai/copilot']

function AuthenticatedLayoutComponent() {
  const { pathname } = useLocation()
  const shouldShowCopilotPopup = !COPILOT_POPUP_EXCLUDED_PATHS.includes(pathname as AppPath)

  return (
    <AuthenticatedLayout>
      <Outlet />
      <div className={cn(!shouldShowCopilotPopup && 'hidden')}>
        <CopilotPopup />
      </div>
    </AuthenticatedLayout>
  )
}
