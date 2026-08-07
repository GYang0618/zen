import { Outlet, useRouter } from '@tanstack/react-router'
import { Separator } from '@zen/ui'
import { useMemo } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'
import { buildChildNavLinksFromRouteTree } from '@/components/layouts/build-nav-from-routes'
import { useAuthStore } from '@/stores'

import { SidebarNav } from './components/sidebar-nav'

import type { RouteTreeNode } from '@/components/layouts/build-nav-from-routes'
import type { AppPath } from '@/types/router'

const SETTINGS_V2_PATH = '/settings-v2' satisfies AppPath

export function Settings() {
  const router = useRouter()
  const permissions = useAuthStore((state) => state.user?.permissions ?? [])

  const sidebarNavItems = useMemo(
    () =>
      buildChildNavLinksFromRouteTree(
        router.routeTree as RouteTreeNode,
        SETTINGS_V2_PATH,
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

      <Main>
        <AppPageHeader from={SETTINGS_V2_PATH} />
        <Separator className="my-4 flex-none lg:my-6" />

        <div className="flex min-h-0 flex-1 flex-col gap-12 lg:flex-row">
          <aside className="lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>

          <Outlet />
        </div>
      </Main>
    </>
  )
}
