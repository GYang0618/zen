import { cn } from '@zen/ui'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'

import type { ReactNode } from 'react'

type SettingsShellProps = {
  children: ReactNode
  className?: string
}

export function SettingsShell({ children, className }: SettingsShellProps) {
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
      <Main className={cn('flex max-w-4xl flex-1 flex-col gap-6', className)}>{children}</Main>
    </>
  )
}
