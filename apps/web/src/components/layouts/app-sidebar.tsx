import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@zen/ui'

import { useLayout } from '@/context/layout-provider'

import { AppNav } from './components/app-nav'
import { NavUser } from './components/nav-user'
import { TeamSwitcher } from './components/team-switcher'
import { sidebarData } from './sidebar-data'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { teams, user, navGroups } = sidebarData
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
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
