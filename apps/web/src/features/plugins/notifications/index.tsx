import { NotificationsPage } from '@zen/plugin-notifications/web'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { canAccess } from '@/lib/auth/permissions'
import { request } from '@/lib/request/client'

export function NotificationsFeaturePage() {
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
        <NotificationsPage request={request} can={(permission) => canAccess([permission], 'any')} />
      </Main>
    </>
  )
}
