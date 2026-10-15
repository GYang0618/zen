import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from '@tanstack/react-router'
import { cn } from '@zen/ui'
import { useEffect, useState } from 'react'

import { AuthenticatedLayout } from '@/components/layouts'
import { BootLoading } from '@/components/loading-state'
import { AgentChat, AgentPopup } from '@/features/agent'
import { ensureAuthenticatedSession } from '@/features/auth/ensure-session'
import { GeneralError } from '@/features/errors/general-error'
import { canAccess } from '@/lib/auth/permissions'
import { isAgentChatPath, isAgentPluginMarketPath, useAuthStore, useShellModeStore } from '@/stores'

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

/** 不需要显示 AgentPopup 的页面 */
function shouldHideAgentPopup(pathname: string): boolean {
  return isAgentChatPath(pathname) || isAgentPluginMarketPath(pathname)
}

function AuthenticatedLayoutComponent() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mode = useShellModeStore((state) => state.mode)
  const setMode = useShellModeStore((state) => state.setMode)
  const setLastAdminPath = useShellModeStore((state) => state.setLastAdminPath)
  const lastAgentPath = useShellModeStore((state) => state.lastAgentPath)
  const setLastAgentPath = useShellModeStore((state) => state.setLastAgentPath)
  const shouldShowAgentPopup = mode !== 'agent' && !shouldHideAgentPopup(pathname)

  const isAgentMode = mode === 'agent'
  const isPluginMarket = isAgentPluginMarketPath(pathname)
  const [hasVisitedAgent, setHasVisitedAgent] = useState(
    () => isAgentMode || isAgentChatPath(pathname) || isPluginMarket
  )

  useEffect(() => {
    if (isAgentMode || isAgentChatPath(pathname) || isPluginMarket) {
      setHasVisitedAgent(true)
    }
  }, [isAgentMode, isPluginMarket, pathname])

  useEffect(() => {
    if (isAgentChatPath(pathname)) {
      if (mode !== 'agent') setMode('agent')
      setLastAgentPath(pathname)
      return
    }

    if (isPluginMarket) {
      if (mode !== 'agent') setMode('agent')
      return
    }

    if (mode === 'agent') {
      void navigate({ to: (lastAgentPath || '/chat') as never, replace: true })
      return
    }

    setLastAdminPath(pathname)
  }, [
    isPluginMarket,
    mode,
    navigate,
    pathname,
    setLastAdminPath,
    setLastAgentPath,
    lastAgentPath,
    setMode
  ])

  return (
    <AuthenticatedLayout>
      {hasVisitedAgent && (
        <div
          className={cn('flex h-full w-full flex-col overflow-hidden', !isAgentMode && 'hidden')}
        >
          {/* 隐藏时关闭 Main fixed，避免 data-layout=fixed 仍触发 SidebarInset 的 h-svh 锁死滚动 */}
          <AgentChat active={isAgentMode} />
        </div>
      )}

      {/* 插件页由智能体内容区的 Outlet 承载，避免和管理后台再挂一份 */}
      <div className={cn('flex h-full w-full flex-col', isAgentMode && 'hidden')}>
        {isPluginMarket ? null : <Outlet />}
      </div>

      <div className={cn(!shouldShowAgentPopup && 'hidden')}>
        <AgentPopup />
      </div>
    </AuthenticatedLayout>
  )
}
