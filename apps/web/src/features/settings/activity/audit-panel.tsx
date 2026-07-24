import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@zen/ui'
import { ChevronLeft, ChevronRight, History, Search, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

import { useAuditList, useLoginEvents } from '@/features/system/audit/queries'
import { EmptyState } from '@/features/system/components'

import type { ReactNode } from 'react'

type AuditTab = 'ops' | 'login'

const PAGE_SIZE = 20

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

export function AuditPanel() {
  const [tab, setTab] = useState<AuditTab>('ops')
  const [keyword, setKeyword] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)

  const opsQuery = useAuditList({
    keyword: applied || undefined,
    page,
    pageSize: PAGE_SIZE
  })
  const loginQuery = useLoginEvents({ page, pageSize: PAGE_SIZE })

  const opsItems = opsQuery.data?.items ?? []
  const loginItems = loginQuery.data?.items ?? []
  const opsTotal = opsQuery.data?.pagination.total ?? 0
  const loginTotal = loginQuery.data?.pagination.total ?? 0
  const opsPageCount = Math.max(1, Math.ceil(opsTotal / PAGE_SIZE))
  const loginPageCount = Math.max(1, Math.ceil(loginTotal / PAGE_SIZE))

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as AuditTab)
        setPage(1)
      }}
      className="flex flex-col gap-4"
    >
      <TabsList>
        <TabsTrigger value="ops">
          <ShieldAlert data-icon="inline-start" />
          操作日志
        </TabsTrigger>
        <TabsTrigger value="login">
          <History data-icon="inline-start" />
          全站登录历史
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ops" className="mt-0 flex flex-col gap-4">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setApplied(keyword.trim())
          }}
        >
          <div className="relative min-w-48 max-w-sm flex-1">
            <Search className="pointer-events-none absolute inset-s-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-8"
              placeholder="搜索 action / resource"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="搜索操作日志"
            />
          </div>
          <Button type="submit" disabled={opsQuery.isFetching}>
            查询
          </Button>
          {applied ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setKeyword('')
                setApplied('')
                setPage(1)
              }}
            >
              清除
            </Button>
          ) : null}
        </form>

        <AuditListCard
          loading={opsQuery.isLoading}
          empty={!opsQuery.isLoading && opsItems.length === 0}
          emptyTitle="暂无操作记录"
          emptyDescription={
            applied ? '换个关键词试试，或清除筛选后重试' : '系统写操作会在此聚合展示'
          }
          page={page}
          pageCount={opsPageCount}
          total={opsTotal}
          onPrev={() => setPage((value) => Math.max(1, value - 1))}
          onNext={() => setPage((value) => value + 1)}
        >
          <ul className="divide-y">
            {opsItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-medium">{item.action}</span>
                    {item.resource ? <Badge variant="secondary">{item.resource}</Badge> : null}
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={item.createdAt}
                  >
                    {formatDate(item.createdAt)}
                  </time>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {item.resourceId ? <span>资源 ID {item.resourceId}</span> : null}
                  <span>操作者 {item.actorId || '—'}</span>
                  <span className="font-mono">trace {item.traceId || '—'}</span>
                </div>
              </li>
            ))}
          </ul>
        </AuditListCard>
      </TabsContent>

      <TabsContent value="login" className="mt-0 flex flex-col gap-4">
        <AuditListCard
          loading={loginQuery.isLoading}
          empty={!loginQuery.isLoading && loginItems.length === 0}
          emptyTitle="暂无登录记录"
          emptyDescription="登录成功与失败事件会按时间倒序展示"
          page={page}
          pageCount={loginPageCount}
          total={loginTotal}
          onPrev={() => setPage((value) => Math.max(1, value - 1))}
          onNext={() => setPage((value) => value + 1)}
        >
          <ul className="divide-y">
            {loginItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant={item.success ? 'secondary' : 'destructive'}>
                      {item.success ? '登录成功' : '登录失败'}
                    </Badge>
                    <span className="truncate font-medium">{item.identifier}</span>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={item.createdAt}
                  >
                    {formatDate(item.createdAt)}
                  </time>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>IP {item.ip || '—'}</span>
                  <span className="truncate">UA {item.userAgent || '—'}</span>
                  {item.reason ? <span>{item.reason}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </AuditListCard>
      </TabsContent>
    </Tabs>
  )
}

function AuditListCard({
  loading,
  empty,
  emptyTitle,
  emptyDescription,
  page,
  pageCount,
  total,
  onPrev,
  onNext,
  children
}: {
  loading: boolean
  empty: boolean
  emptyTitle: string
  emptyDescription: string
  page: number
  pageCount: number
  total: number
  onPrev: () => void
  onNext: () => void
  children: ReactNode
}) {
  return (
    <Card size="sm" className="gap-0 py-0">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>共 {total} 条</span>
          <span>
            第 {page} / {pageCount} 页
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-5/6" />
            <Skeleton className="h-12 w-4/6" />
          </div>
        ) : empty ? (
          <EmptyState icon={History} title={emptyTitle} description={emptyDescription} compact />
        ) : (
          children
        )}
      </CardContent>
      {!loading && !empty ? (
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
            <ChevronLeft data-icon="inline-start" />
            上一页
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={onNext}>
            下一页
            <ChevronRight data-icon="inline-end" />
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
