import { getRouteApi } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { PostsDialogs } from './components/posts-dialogs'
import { PostsList } from './components/posts-list'
import { PostsPrimaryButtons } from './components/posts-primary-buttons'
import { PostsTable } from './components/posts-table'
import { Copilot } from './copilot'
import { PostsProvider } from './posts-provider'
import { useJobProfilesQuery } from './queries'

const route = getRouteApi('/_authenticated/system/_identity/posts')

function toFilterArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function PostsContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [view, setView] = useState('card')
  const statusFilter = toFilterArray(search.status)
  const { data, isLoading, isFetching } = useJobProfilesQuery(
    {
      page: 1,
      pageSize: 100,
      keyword: search.keyword,
      status: statusFilter.length === 1 ? statusFilter[0] : undefined
    },
    { enabled: view === 'table' }
  )
  const profiles = data?.items ?? []

  return (
    <>
      <Copilot />
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<PostsPrimaryButtons />} />
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
            <PostsList search={search} navigate={navigate} />
          </TabsContent>
          <TabsContent value="table">
            <PostsTable
              data={profiles}
              isLoading={isLoading}
              isFetching={isFetching}
              search={search}
              navigate={navigate}
            />
          </TabsContent>
        </Tabs>
      </Main>
      <PostsDialogs />
    </>
  )
}

export function Posts() {
  return (
    <PostsProvider>
      <PostsContent />
    </PostsProvider>
  )
}
