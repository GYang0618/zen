import { Separator } from '@zen/ui'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'

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
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">设置</h1>
          <p className="text-sm text-muted-foreground">
            管理您的个人资料、账号安全凭证、系统界面外观与通知提醒。
          </p>
        </div>
        <Separator className="my-2" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="lg:w-1/5 shrink-0">
            <SidebarNav />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </Main>
    </>
  )
}

