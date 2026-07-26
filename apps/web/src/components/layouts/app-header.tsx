import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'

import { Header } from './header'

export function AppHeader() {
  return (
    <Header fixed>
      <Search />
      <div className="ms-auto flex items-center gap-4">
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </div>
    </Header>
  )
}
