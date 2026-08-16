import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { PostsDialogs } from './components/posts-dialogs'
import { PostsList } from './components/posts-list'
import { PostsPrimaryButtons } from './components/posts-primary-buttons'
import { PostsProvider } from './posts-provider'

function PostsContent() {
  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<PostsPrimaryButtons />} />
        <PostsList />
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
