import { FILE_CATEGORY_ACCEPT, FILE_STATUS_VALUES } from '@zen/shared'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { InfiniteScrollSentinel } from '@/components/infinite-scroll-sentinel'
import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'
import { flattenPages } from '@/lib/infinite-list'

import { FilesDialogs } from './components/files-dialogs'
import { FilesGrid } from './components/files-grid'
import { FilesPrimaryButtons } from './components/files-primary-buttons'
import { FilesTable } from './components/files-table'
import { FilesProvider, useFiles } from './files-provider'
import { useFilesInfiniteQuery } from './queries'
import { CATEGORY_TABS, STATUS_LABEL } from './utils'

import type { FileAsset, FileCategory, FileStatus } from '@zen/shared'

function FilesContent() {
  const { openPreview } = useFiles()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<FileCategory | 'all'>('all')
  const [status, setStatus] = useState<FileStatus | 'all'>('all')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const {
    data,
    isLoading,
    isFetching,
    isError,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage
  } = useFilesInfiniteQuery({
    keyword: keyword.trim() || undefined,
    category: category === 'all' ? undefined : category,
    status: status === 'all' ? undefined : status,
    includeDeleted: includeDeleted || undefined
  })
  const files = flattenPages(data)
  const previewImages = files.filter((file) => file.status === 'ready' && file.category === 'image')
  const isFilterFetching = isFetching && !isFetchingNextPage

  const handlePreview = (file: FileAsset) => {
    openPreview(file, previewImages)
  }

  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader actions={<FilesPrimaryButtons />} />
        <Tabs
          value={category}
          onValueChange={(value) => {
            setCategory(value as FileCategory | 'all')
          }}
        >
          <TabsList aria-label="文件分类">
            {CATEGORY_TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            className="max-w-64"
            placeholder="搜索文件名"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="搜索文件名"
          />
          <Select
            items={[
              { label: '全部状态', value: 'all' },
              ...FILE_STATUS_VALUES.map((item) => ({
                label: STATUS_LABEL[item],
                value: item
              }))
            ]}
            value={status}
            onValueChange={(value) => {
              if (!value) return
              setStatus(value as FileStatus | 'all')
            }}
          >
            <SelectTrigger className="w-36" aria-label="状态">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部状态</SelectItem>
                {FILE_STATUS_VALUES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {STATUS_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={includeDeleted ? 'secondary' : 'outline'}
            onClick={() => setIncludeDeleted((current) => !current)}
          >
            {includeDeleted ? '含回收站' : '不含回收站'}
          </Button>
          <div className="ms-auto flex gap-1">
            <Button
              type="button"
              size="icon"
              variant={view === 'grid' ? 'secondary' : 'outline'}
              aria-label="网格视图"
              onClick={() => setView('grid')}
            >
              <LayoutGrid />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={view === 'table' ? 'secondary' : 'outline'}
              aria-label="列表视图"
              onClick={() => setView('table')}
            >
              <TextAlignStart />
            </Button>
          </div>
        </div>
        {isError && files.length === 0 ? (
          <EmptyState title="文件列表加载失败" description="请稍后重试" compact />
        ) : view === 'grid' ? (
          <div className={isFilterFetching ? 'opacity-70 transition-opacity' : undefined}>
            <FilesGrid data={files} isLoading={isLoading} onPreview={handlePreview} />
          </div>
        ) : (
          <div className={isFilterFetching ? 'opacity-70 transition-opacity' : undefined}>
            <FilesTable data={files} isLoading={isLoading} onPreview={handlePreview} />
          </div>
        )}
        {files.length > 0 ? (
          <InfiniteScrollSentinel
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            isError={isFetchNextPageError}
            onLoadMore={() => {
              void fetchNextPage()
            }}
          />
        ) : null}
      </Main>
      <FilesDialogs accept={FILE_CATEGORY_ACCEPT[category]} />
    </>
  )
}

export function FilesPage() {
  return (
    <FilesProvider>
      <FilesContent />
    </FilesProvider>
  )
}
