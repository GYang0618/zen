import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@zen/ui'

import { useLayout } from '@/context/layout-provider'
import { fetchActivePluginIds } from '@/features/system/plugins/api'
import { useAuthStore } from '@/stores'

import { buildNavGroupsFromRoutes } from './build-nav-from-routes'
import { AppNav } from './components/app-nav'
import { NavUser } from './components/nav-user'
import { TeamSwitcher } from './components/team-switcher'
import { sidebarChrome } from './sidebar-chrome'

import type { RouterMeta } from '@/types/router'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const router = useRouter()
  const permissions = useAuthStore((state) => state.user?.permissions ?? [])
  const authUser = useAuthStore((state) => state.user)
  const activePluginsQuery = useQuery({
    queryKey: ['plugins', 'active-ids'],
    queryFn: () => fetchActivePluginIds(true),
    staleTime: 30_000
  })

  const navGroups = useMemo(() => {
    const routes = Object.values(router.routesById).map((route) => ({
      fullPath: route.fullPath,
      staticData: route.options.staticData as RouterMeta | undefined
    }))
    return buildNavGroupsFromRoutes(routes, permissions, activePluginsQuery.data)
  }, [router.routesById, permissions, activePluginsQuery.data])

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
