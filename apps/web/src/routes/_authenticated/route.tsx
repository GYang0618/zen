import { createFileRoute, Outlet, redirect, useLocation, useMatches } from '@tanstack/react-router'
import { cn } from '@zen/ui'
import { useLayoutEffect, useRef } from 'react'

import { AuthenticatedLayout } from '@/components/layouts'
import { DefaultSidebar } from '@/components/layouts/default-sidebar'
import { BootLoading } from '@/components/loading-state'
import { AgentChat, AgentPopup, AgentSidebar } from '@/features/agent'
import { ensureAuthenticatedSession } from '@/features/auth/ensure-session'
import { GeneralError } from '@/features/errors/general-error'
import { canAccess } from '@/lib/auth/permissions'
import { isAgentChatPath, resolveRouteMode, useAuthStore, useSystemModeStore } from '@/stores'

export const Route = createFileRoute('/_authenticated')({
  pendingComponent: BootLoading,
  errorComponent: GeneralError,
  beforeLoad: async ({ location, matches }) => {
    await ensureAuthenticatedSession(location.href)

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

function AuthenticatedLayoutComponent() {
  const { pathname } = useLocation()
  const routeMode = resolveRouteMode(useMatches())
  const isAgentMode = routeMode === 'agent'
  const isAgentPage = isAgentMode && !isAgentChatPath(pathname)
  const hasVisitedAgent = useRef(isAgentMode)
  if (isAgentMode) hasVisitedAgent.current = true

  useLayoutEffect(() => {
    const store = useSystemModeStore.getState()
    if (store.mode !== routeMode) store.setMode(routeMode)
    if (routeMode === 'agent') {
      store.setLastAgentPath(pathname)
      return
    }
    store.setLastAdminPath(pathname)
  }, [pathname, routeMode])

  return (
    <AuthenticatedLayout sidebar={isAgentMode ? <AgentSidebar /> : <DefaultSidebar />}>
      {hasVisitedAgent.current ? (
        <div
          className={cn('flex h-full w-full flex-col overflow-hidden', !isAgentMode && 'hidden')}
        >
          {/* 隐藏时关闭 Main fixed，避免 data-layout=fixed 仍触发 SidebarInset 的 h-svh 锁死滚动 */}
          <AgentChat active={isAgentMode} showRoutePage={isAgentPage} />
        </div>
      ) : null}

      {/* 智能体页面由对话区的 Outlet 承载，避免和管理后台再挂一份 */}
      <div className={cn('flex h-full w-full flex-col', isAgentMode && 'hidden')}>
        {isAgentPage ? null : <Outlet />}
      </div>

      <div className={cn(isAgentMode && 'hidden')}>
        <AgentPopup />
      </div>
    </AuthenticatedLayout>
  )
}
