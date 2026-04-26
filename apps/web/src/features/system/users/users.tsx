import { getRouteApi } from '@tanstack/react-router'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'

import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import { useUsersQuery } from './queries'
import { UsersProvider } from './users-provider'

const route = getRouteApi('/_authenticated/system/users')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data, isLoading, isFetching } = useUsersQuery({
    keyword: search.keyword,
    page: search.page,
    pageSize: search.pageSize,
    status: search.status,
    role: search.role,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder
  })

  const users = data?.items ?? []
  const total = data?.pagination.total ?? 0

  return (
    <UsersProvider>
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
            <h2 className="text-2xl font-bold tracking-tight">用户管理</h2>
            <p className="text-muted-foreground">管理系统中的所有用户，配置角色权限和组织架构</p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable
          data={users}
          total={total}
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
