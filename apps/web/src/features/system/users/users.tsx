import { getRouteApi } from '@tanstack/react-router'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import { Copilot } from './copilot'
import { useUsersQuery } from './queries'
import { UsersProvider } from './users-provider'

const route = getRouteApi('/_authenticated/system/_identity/users')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching } = useUsersQuery()

  const users = data?.items ?? []

  return (
    <UsersProvider>
      <Copilot />
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader
          title="用户管理"
          description="管理系统中的所有用户，配置角色权限和组织架构"
          actions={<UsersPrimaryButtons />}
        />
        <UsersTable
          data={users}
          isLoading={isLoading}
          isFetching={isFetching}
          search={search}
          navigate={navigate}
        />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
