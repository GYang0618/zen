import { Outlet, useRouter } from '@tanstack/react-router'
import { Separator } from '@zen/ui'
import { useMemo } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'
import { buildChildNavLinksFromRouteTree } from '@/components/layouts/build-nav-from-routes'
import { useAuthStore } from '@/stores'

import { SidebarNav } from './components/sidebar-nav'

import type { RouteTreeNode } from '@/components/layouts/build-nav-from-routes'

const SETTINGS_V2_ROUTE_ID = '/_authenticated/_other/settings-v2'

export function Settings() {
  const router = useRouter()
  const permissions = useAuthStore((state) => state.user?.permissions ?? [])

  const sidebarNavItems = useMemo(
    () =>
      buildChildNavLinksFromRouteTree(
        router.routeTree as RouteTreeNode,
        SETTINGS_V2_ROUTE_ID,
        permissions
      ).map((item) => ({
        title: item.title,
        href: String(item.url),
        icon: item.icon
      })),
    [router.routeTree, permissions]
  )

  return (
    <>
      {/* ===== Top Heading ===== */}
      <AppHeader />

      <Main fixed>
        <AppPageHeader
          title="设置"
          description="管理您的个人资料、账号安全凭证、系统界面外观与通知提醒。"
        />
        <Separator className="my-4 lg:my-6" />

        <div className="flex gap-12">
          <aside className="w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}
