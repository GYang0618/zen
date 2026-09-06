import { getRouteApi } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { RolesDialogs } from './components/roles-dialogs'
import { RolesList } from './components/roles-list'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesTable } from './components/roles-table'
import { useRolesQuery } from './queries'
import { RolesProvider } from './roles-provider'

const route = getRouteApi('/_authenticated/system/_identity/roles')

function RolesContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [view, setView] = useState('card')
  const { data, isLoading, isFetching, isError, error } = useRolesQuery(
    {
      keyword: search.keyword,
      effectiveStatus: search.effectiveStatus,
      dataScope: search.dataScope,
      page: 1,
      pageSize: 100
    },
    { enabled: view === 'table' }
  )
  const roles = data?.items ?? []

  return (
    <>
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<RolesPrimaryButtons />} />
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="mx-auto">
            <TabsTrigger value="card" aria-label="网格视图">
              <LayoutGrid />
            </TabsTrigger>
            <TabsTrigger value="table" aria-label="列表视图">
              <TextAlignStart />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <RolesList search={search} navigate={navigate} />
          </TabsContent>
          <TabsContent value="table">
            <RolesTable
              data={roles}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              error={error instanceof Error ? error.message : undefined}
              search={search}
              navigate={navigate}
            />
          </TabsContent>
        </Tabs>
      </Main>

      <RolesDialogs />
    </>
  )
}

export function Roles() {
  return (
    <RolesProvider>
      <RolesContent />
    </RolesProvider>
  )
}
