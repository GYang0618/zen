import { getRouteApi } from '@tanstack/react-router'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { SystemPageHeader } from '@/features/system/components'

import { RolesDialogs } from './components/roles-dialogs'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesTable } from './components/roles-table'
import { useRolesQuery } from './queries'
import { RolesProvider } from './roles-provider'

import type { RolesQuery } from '@zen/shared'

const route = getRouteApi('/_authenticated/system/roles')

export function Roles() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data, isLoading, isFetching } = useRolesQuery({
    keyword: search.keyword,
    page: search.page,
    pageSize: search.pageSize,
    status: search.status as RolesQuery['status'],
    dataScope: search.dataScope as RolesQuery['dataScope']
  })

  const roles = data?.items ?? []
  const total = data?.pagination.total ?? 0

  return (
    <RolesProvider>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <SystemPageHeader
          title="角色管理"
          description="管理系统角色、数据权限范围及成员分配"
          actions={<RolesPrimaryButtons />}
        />
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
