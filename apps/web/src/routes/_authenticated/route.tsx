import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from '@tanstack/react-router'
import { cn } from '@zen/ui'
import { useEffect } from 'react'

import { AuthenticatedLayout } from '@/components/layouts'
import { RoutePending } from '@/components/route-pending'
import { CopilotProvider } from '@/context/copilot-provider'
import { AgentPopup } from '@/features/agent'
import { useAgentChatShellStore } from '@/features/agent/stores/agent-chat-shell'
import { authApi } from '@/features/auth/api'
import { GeneralError } from '@/features/errors/general-error'
import { canAccess } from '@/lib/auth/permissions'
import { isAccessTokenExpiringSoon } from '@/lib/request/jwt-expiry'
import { isForbidden, isSessionExpired } from '@/lib/request/utils'
import { isAgentChatPath, useAuthStore, useShellModeStore } from '@/stores'

export const Route = createFileRoute('/_authenticated')({
  pendingComponent: RoutePending,
  errorComponent: GeneralError,
  beforeLoad: async ({ location, matches, context }) => {
    const existingToken = context.auth.getAccessToken()
    if (!existingToken || isAccessTokenExpiringSoon(existingToken)) {
      try {
        const session = await authApi.refresh()
        useAuthStore.getState().setAuth(session)
      } catch (error) {
        const canContinueWithExisting = Boolean(existingToken) && !isSessionExpired(error)
        if (!canContinueWithExisting) {
          if (isForbidden(error)) {
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

/** 不需要显示 AgentPopup 的页面 */
function shouldHideAgentPopup(pathname: string): boolean {
  return isAgentChatPath(pathname)
}

function AuthenticatedLayoutComponent() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mode = useShellModeStore((state) => state.mode)
  const setMode = useShellModeStore((state) => state.setMode)
  const setLastAdminPath = useShellModeStore((state) => state.setLastAdminPath)
  const shouldShowAgentPopup = mode !== 'agent' && !shouldHideAgentPopup(pathname)

  useEffect(() => {
    if (isAgentChatPath(pathname)) {
      if (mode !== 'agent') setMode('agent')
      return
    }

    if (mode === 'agent') {
      const threadId = useAgentChatShellStore.getState().currentThreadId
      void (threadId
        ? navigate({ to: '/chat/$threadId', params: { threadId }, replace: true })
        : navigate({ to: '/chat', replace: true }))
      return
    }

    setLastAdminPath(pathname)
  }, [mode, navigate, pathname, setLastAdminPath, setMode])

  return (
    <AuthenticatedLayout>
      <CopilotProvider>
        <Outlet />
        <div className={cn(!shouldShowAgentPopup && 'hidden')}>
          <AgentPopup />
        </div>
      </CopilotProvider>
    </AuthenticatedLayout>
  )
}
