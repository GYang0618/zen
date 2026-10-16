import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'

import { fetchActivePluginIds } from '@/features/system/plugins/api'
import { SUPER_ADMIN_ROLE_CODE } from '@/lib/auth/permissions'
import { useAuthStore } from '@/stores'

import { buildNavGroupsFromRouteTree } from './build-nav-from-routes'
import { AppNav } from './components/app-nav'
import { NavUser } from './components/nav-user'
import { ShellSidebarFrame } from './shell-sidebar-frame'

import type { RouteTreeNode } from './build-nav-from-routes'

export function DefaultSidebar() {
  const navGroups = useAdminNavGroups()

  return (
    <ShellSidebarFrame scroll="parent" footer={<NavUser showSettings />}>
      <AppNav items={navGroups} />
    </ShellSidebarFrame>
  )
}

function useAdminNavGroups() {
  const router = useRouter()
  const authUser = useAuthStore((state) => state.user)
  const permissions = authUser?.permissions ?? []
  const unrestricted = authUser?.role === SUPER_ADMIN_ROLE_CODE
  const activePluginsQuery = useQuery({
    queryKey: ['plugins', 'active-ids'],
    queryFn: () => fetchActivePluginIds(true),
    staleTime: 30_000
  })

  return useMemo(() => {
    return buildNavGroupsFromRouteTree(
      router.routeTree as RouteTreeNode,
      permissions,
      activePluginsQuery.data,
      unrestricted
    )
  }, [router.routeTree, permissions, activePluginsQuery.data, unrestricted])
}
