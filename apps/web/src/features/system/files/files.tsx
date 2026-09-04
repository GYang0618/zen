import { FILE_CATEGORY_ACCEPT, FILE_STATUS_VALUES } from '@zen/shared'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { LayoutGrid, TextAlignStart } from 'lucide-react'
import { useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { FilesDialogs } from './components/files-dialogs'
import { FilesGrid } from './components/files-grid'
import { FilesPrimaryButtons } from './components/files-primary-buttons'
import { FilesTable } from './components/files-table'
import { FilesProvider, useFiles } from './files-provider'
import { useFilesQuery } from './queries'
import { CATEGORY_TABS, STATUS_LABEL } from './utils'

import type { FileAsset, FileCategory, FileStatus } from '@zen/shared'

function FilesContent() {
  const { setOpen, setCurrentRow } = useFiles()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<FileCategory | 'all'>('all')
  const [status, setStatus] = useState<FileStatus | 'all'>('all')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const { data, isLoading } = useFilesQuery({
    page,
    pageSize: 20,
    keyword: keyword.trim() || undefined,
    category: category === 'all' ? undefined : category,
    status: status === 'all' ? undefined : status,
    includeDeleted: includeDeleted || undefined
  })

  const openPreview = (file: FileAsset) => {
    setCurrentRow(file)
    setOpen('preview')
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
            setPage(1)
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
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
            aria-label="搜索文件名"
          />
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as FileStatus | 'all')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-36" aria-label="状态">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {FILE_STATUS_VALUES.map((item) => (
                <SelectItem key={item} value={item}>
                  {STATUS_LABEL[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={includeDeleted ? 'secondary' : 'outline'}
            onClick={() => {
              setIncludeDeleted((current) => !current)
              setPage(1)
            }}
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
        {view === 'grid' ? (
          <FilesGrid data={data?.items ?? []} isLoading={isLoading} onPreview={openPreview} />
        ) : (
          <FilesTable
            data={data?.items ?? []}
            isLoading={isLoading}
            page={data?.pagination.page ?? page}
            totalPages={Math.max(data?.pagination.totalPages ?? 1, 1)}
            onPageChange={setPage}
            onPreview={openPreview}
          />
        )}
        {view === 'grid' ? (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= (data?.pagination.totalPages ?? 1)}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
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
