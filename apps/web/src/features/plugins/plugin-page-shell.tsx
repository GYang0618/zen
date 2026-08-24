import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { canAccess } from '@/lib/auth/permissions'
import { request } from '@/lib/request/client'

import type { ComponentType, ReactNode } from 'react'

export interface PluginPageProps {
  request: typeof request
  can: (permission: string) => boolean
}

interface PluginPageShellProps {
  page: ComponentType<PluginPageProps>
  children?: ReactNode
}

/** 统一插件页面壳：注入布局、请求客户端与权限判断 */
export function PluginPageShell({ page: Page }: PluginPageShellProps) {
  return (
    <>
      <Header>
        <Search />
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <Page request={request} can={(permission) => canAccess([permission], 'any')} />
      </Main>
    </>
  )
}
