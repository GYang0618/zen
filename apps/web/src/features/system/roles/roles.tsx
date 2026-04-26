import { getRouteApi } from '@tanstack/react-router'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'

import { RolesDialogs } from './components/roles-dialogs'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesTable } from './components/roles-table'
import { useRolesQuery } from './queries'
import { RolesProvider } from './roles-provider'

const route = getRouteApi('/_authenticated/system/roles')

export function Roles() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data, isLoading, isFetching } = useRolesQuery({
    keyword: search.keyword,
    page: search.page,
    pageSize: search.pageSize,
    status: search.status,
    dataScope: search.dataScope
  })

  const roles = data?.items ?? []
  const total = data?.pagination.total ?? 0

  return (
    <RolesProvider>
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
            <h2 className="text-2xl font-bold tracking-tight">角色管理</h2>
            <p className="text-muted-foreground">管理系统角色、数据权限范围及成员分配</p>
          </div>
          <RolesPrimaryButtons />
        </div>
        <RolesTable
          data={roles}
          total={total}
          isLoading={isLoading}
          isFetching={isFetching}
          search={search}
          navigate={navigate}
        />
      </Main>

      <RolesDialogs />
    </RolesProvider>
  )
}
