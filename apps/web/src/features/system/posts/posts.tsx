import { getRouteApi } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@zen/ui'
import { CreditCard, TextAlignJustify } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { PostsDialogs } from './components/posts-dialogs'
import { PostsList } from './components/posts-list'
import { PostsPrimaryButtons } from './components/posts-primary-buttons'
import { PostsTable } from './components/posts-table'
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
  const statusFilter = toFilterArray(search.status)
  const { data, isLoading, isFetching, isError } = useJobProfilesQuery({
    page: 1,
    pageSize: 100,
    keyword: search.keyword,
    status: statusFilter.length === 1 ? statusFilter[0] : undefined
  })
  const profiles = data?.items ?? []

  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<PostsPrimaryButtons />} />
        <Tabs defaultValue="card">
          <TabsList className="mx-auto">
            <TabsTrigger value="card" aria-label="卡片视图">
              <CreditCard />
            </TabsTrigger>
            <TabsTrigger value="table" aria-label="表格视图">
              <TextAlignJustify />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <PostsList
              data={profiles}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              search={search}
              navigate={navigate}
            />
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
