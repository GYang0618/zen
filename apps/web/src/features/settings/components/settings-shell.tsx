import { Separator } from '@zen/ui'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { SidebarNav } from './sidebar-nav'

import type { ReactNode } from 'react'

type SettingsShellProps = {
  children: ReactNode
}

export function SettingsShell({ children }: SettingsShellProps) {
  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <AppPageHeader from="/_authenticated/_other/settings" />
        <Separator className="my-2" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="shrink-0 lg:w-1/5">
            <SidebarNav />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </Main>
    </>
  )
}
