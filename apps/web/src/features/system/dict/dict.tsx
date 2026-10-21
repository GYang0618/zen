import { useNavigate } from '@tanstack/react-router'
import {
  Button,
  ItemGroup,
  ScrollArea,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  toast
} from '@zen/ui'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { AppHeader, Main } from '@/components/layouts'
import { AppPageHeader } from '@/components/layouts/app-page-header'

import { DictCard } from './components/dict-card'
import { DictDeleteDialog } from './components/dict-delete-dialog'
import { DictListRow } from './components/dict-list-row'
import { DictListToolbar } from './components/dict-list-toolbar'
import { DictWorkspaceSidebar } from './components/dict-workspace-sidebar'
import { useToggleStarMutation } from './mutations'
import { useDictionaryListQuery } from './queries'

import type { DictionaryListItem } from '@zen/shared'

export function Dict() {
  const navigate = useNavigate()
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<string[]>([])
  const [deletingDict, setDeletingDict] = useState<DictionaryListItem | null>(null)

  const toggleStarMutation = useToggleStarMutation()

  const kindParam = kindFilter.length === 1 ? kindFilter[0] : undefined

  const {
    data: dictionaries = [],
    isLoading,
    isError,
    refetch
  } = useDictionaryListQuery({
    workspaceId: activeWorkspaceId,
    search: search.trim() ? search.trim() : undefined,
    kind: kindParam
  })

  // Filter client-side if multiple kinds selected
  const displayedDictionaries = useMemo(() => {
    if (kindFilter.length === 0 || kindFilter.length === 2) {
      return dictionaries
    }
    return dictionaries.filter((d) => kindFilter.includes(d.kind))
  }, [dictionaries, kindFilter])

  const handleNavigateDetail = (id: string) => {
    void navigate({ to: '/system/dict/$id', params: { id } })
  }

  const handleNavigateCreate = () => {
    const validWorkspaceId =
      activeWorkspaceId !== 'all' && activeWorkspaceId !== 'starred' ? activeWorkspaceId : undefined

    void navigate({
      to: '/system/dict/new',
      search: { workspaceId: validWorkspaceId }
    })
  }

  const handleToggleStar = async (item: DictionaryListItem) => {
    try {
      await toggleStarMutation.mutateAsync({
        id: item.id,
        isStarred: !item.isStarred
      })
      toast.add({
        title: item.isStarred ? '已取消收藏' : '已添加收藏',
        type: 'success'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败'
      toast.add({ title: '操作失败', description: message, type: 'error' })
    }
  }

  return (
    <>
      <AppHeader />

      <Main fixed className="flex flex-1 flex-col gap-4 sm:gap-6">
        <AppPageHeader
          title="数据字典"
          description="按空间组织系统与业务枚举项，统一维护全局选项与状态。"
          actions={
            <Button size="lg" onClick={handleNavigateCreate}>
              <Plus className="size-4 mr-1.5" /> 新建字典
            </Button>
          }
        />

        <div className="flex-1 flex overflow-hidden border-t border-border border-dashed pt-6 px-1">
          {/* 字典空间侧边栏 */}
          <aside className="flex flex-col gap-4 h-full w-72 shrink-0">
            <DictWorkspaceSidebar
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={setActiveWorkspaceId}
            />
          </aside>

          <Separator className="h-full mx-2" orientation="vertical" />

          {/* 字典展示区域 */}
          <section className="h-full @container flex-1 pl-2 overflow-hidden flex flex-col">
            <Tabs defaultValue="grid" className="h-full flex flex-col overflow-hidden">
              <DictListToolbar
                search={search}
                onSearchChange={setSearch}
                kindFilter={kindFilter}
                onKindFilterChange={setKindFilter}
              />

              <div className="flex-1 overflow-hidden">
                {isLoading ? (
                  <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 p-1">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-44 rounded-xl" />
                    ))}
                  </div>
                ) : isError ? (
                  <EmptyState
                    title="加载数据字典失败"
                    description="请检查网络或重新尝试加载数据"
                    action={
                      <Button variant="outline" onClick={() => refetch()}>
                        重试
                      </Button>
                    }
                  />
                ) : displayedDictionaries.length === 0 ? (
                  <EmptyState
                    title="未找到匹配的数据字典"
                    description={
                      search
                        ? '换一个搜索关键字或清除筛选条件试一试'
                        : '当前空间下暂无字典，点击上方按钮创建新字典'
                    }
                    action={
                      <Button variant="outline" onClick={handleNavigateCreate}>
                        <Plus className="size-4 mr-1.5" /> 新建字典
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <TabsContent value="grid" className="h-full mt-0">
                      <ScrollArea className="h-full pr-3">
                        <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4 p-1 pb-6">
                          {displayedDictionaries.map((item) => (
                            <DictCard
                              key={item.id}
                              item={item}
                              onNavigateDetail={handleNavigateDetail}
                              onToggleStar={handleToggleStar}
                              onRequestDelete={setDeletingDict}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="list" className="h-full mt-0">
                      <ScrollArea className="h-full pr-3">
                        <ItemGroup className="gap-1 p-1 pb-6">
                          {displayedDictionaries.map((item) => (
                            <DictListRow
                              key={item.id}
                              item={item}
                              onNavigateDetail={handleNavigateDetail}
                              onToggleStar={handleToggleStar}
                              onRequestDelete={setDeletingDict}
                            />
                          ))}
                        </ItemGroup>
                      </ScrollArea>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </section>
        </div>
      </Main>

      <DictDeleteDialog
        dictionary={deletingDict}
        open={Boolean(deletingDict)}
        onOpenChange={(open) => {
          if (!open) setDeletingDict(null)
        }}
      />
    </>
  )
}
