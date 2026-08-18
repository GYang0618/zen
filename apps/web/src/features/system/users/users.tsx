import { getRouteApi } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { CreditCard, TextAlignJustify } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { UsersCardList } from './components/users-card-list'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import { Copilot } from './copilot'
import { useUsersQuery } from './queries'
import { UsersProvider } from './users-provider'

const route = getRouteApi('/_authenticated/system/_identity/users')

function UsersContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isLoading, isFetching } = useUsersQuery({
    keyword: search.keyword,
    status: search.status,
    role: search.role,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder
  })
  const users = data?.items ?? []

  return (
    <>
      <Copilot />
      <AppHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<UsersPrimaryButtons />} />
        <Tabs defaultValue="card">
          <TabsList className="mx-auto">
            <TabsTrigger value="card">
              <CreditCard />
            </TabsTrigger>
            <TabsTrigger value="table">
              <TextAlignJustify />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <UsersCardList data={users} isLoading={isLoading} isFetching={isFetching} />
          </TabsContent>
          <TabsContent value="table">
            <UsersTable
              data={users}
              isLoading={isLoading}
              isFetching={isFetching}
              search={search}
              navigate={navigate}
            />
          </TabsContent>
        </Tabs>
      </Main>

      <UsersDialogs />
    </>
  )
}

export function Users() {
  return (
    <UsersProvider>
      <UsersContent />
    </UsersProvider>
  )
}
