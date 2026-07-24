import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { cn } from '@zen/ui'

import { AuthenticatedLayout } from '@/components/layouts'
import { CopilotProvider } from '@/context/copilot-provider'
import { CopilotPopup } from '@/features/ai/copilot'
import { authApi } from '@/features/auth/api'
import { canAccess } from '@/lib/auth/permissions'
import { isForbidden, isSessionExpired } from '@/lib/request/utils'
import { useAuthStore } from '@/stores'

import type { AppPath } from '@/types/router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location, matches }) => {
    const { accessToken } = useAuthStore.getState()
    if (!accessToken) {
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
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
          replace: true
        })
      }
    }

    if (
      useAuthStore.getState().mustChangePassword &&
      location.pathname !== '/change-password' &&
      !location.pathname.startsWith('/errors/')
    ) {
      throw redirect({ to: '/change-password', replace: true })
    }

    const leaf = matches[matches.length - 1]
    const required = leaf?.staticData?.permissions
    if (required && required.length > 0 && !canAccess(required, 'any')) {
      throw redirect({
        to: '/errors/403',
        replace: true
      })
    }
  },
  component: AuthenticatedLayoutComponent
})

/** 不需要显示 CopilotPopup 的页面 */
const COPILOT_POPUP_EXCLUDED_PATHS: readonly AppPath[] = ['/chat', '/chat-v2']

function AuthenticatedLayoutComponent() {
  const { pathname } = useLocation()
  const shouldShowCopilotPopup = !COPILOT_POPUP_EXCLUDED_PATHS.includes(pathname as AppPath)

  return (
    <AuthenticatedLayout>
      <CopilotProvider>
        <Outlet />
        <div className={cn(!shouldShowCopilotPopup && 'hidden')}>
          <CopilotPopup />
        </div>
      </CopilotProvider>
    </AuthenticatedLayout>
  )
}
