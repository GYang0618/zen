import { ConfigDrawer } from '@/components/config-drawer'
import { Header, Main } from '@/components/layouts'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersTable } from './components/users-table'

export function Users() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">用户列表</h2>
            <p className="text-muted-foreground">在此管理您的用户及其角色。</p>
          </div>
          {/* <UsersPrimaryButtons /> */}
        </div>
        <UsersTable />
        {/* <UsersTable data={users} search={search} navigate={navigate} /> */}
      </Main>
    </>
  )
}
