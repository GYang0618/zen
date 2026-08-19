import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@zen/ui'
import { useMemo } from 'react'

import { useLayout } from '@/context/layout-provider'
import { fetchActivePluginIds } from '@/features/system/plugins/api'
import { useAuthStore } from '@/stores'

import { buildNavGroupsFromRouteTree } from './build-nav-from-routes'
import { AppNav } from './components/app-nav'
import { NavUser } from './components/nav-user'
import { TeamSwitcher } from './components/team-switcher'
import { sidebarChrome } from './sidebar-chrome'

import type { RouteTreeNode } from './build-nav-from-routes'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const router = useRouter()
  const authUser = useAuthStore((state) => state.user)
  const permissions = authUser?.permissions ?? []
  const activePluginsQuery = useQuery({
    queryKey: ['plugins', 'active-ids'],
    queryFn: () => fetchActivePluginIds(true),
    staleTime: 30_000
  })

  const navGroups = useMemo(() => {
    return buildNavGroupsFromRouteTree(
      router.routeTree as RouteTreeNode,
      permissions,
      activePluginsQuery.data
    )
  }, [router.routeTree, permissions, activePluginsQuery.data])

  const user = {
    name: authUser?.nickname || authUser?.username || '用户',
    email: authUser?.email || '',
    avatar: authUser?.avatar || ''
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarChrome.teams} />
      </SidebarHeader>
      <SidebarContent>
        <AppNav items={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
