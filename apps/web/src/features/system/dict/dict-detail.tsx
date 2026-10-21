import { useRouter } from '@tanstack/react-router'
import {
  Button,
  cn,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
  Skeleton,
  Toggle,
  toast
} from '@zen/ui'
import { ArrowLeft, Loader2, Pencil, Save, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { AppHeader, Main } from '@/components/layouts'

import { DictItemsCard } from './components/dict-items-card'
import { DictSideOverview } from './components/dict-side-overview'
import { useToggleStarMutation, useUpdateDictionaryMutation } from './mutations'
import { useDictionaryDetailQuery } from './queries'
import { getDictionaryItemValidationError } from './validation'

import type { DictionaryItem } from '@zen/shared'
import type { DictBasicInfoValues } from './components/dict-side-overview'

export function DictDetail({ dictId }: { dictId: string }) {
  const router = useRouter()
  const { data: detail, isLoading, isError, refetch } = useDictionaryDetailQuery(dictId)

  const updateMutation = useUpdateDictionaryMutation()
  const toggleStarMutation = useToggleStarMutation()

  const [isEditing, setIsEditing] = useState(false)

  const [basicValues, setBasicValues] = useState<DictBasicInfoValues>({
    name: '',
    code: '',
    folderId: '',
    kind: 'business',
    description: ''
  })
  const [items, setItems] = useState<DictionaryItem[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof DictBasicInfoValues, string>>>({})

  useEffect(() => {
    if (detail) {
      setBasicValues({
        name: detail.name,
        code: detail.code,
        folderId: detail.folderId || '',
        kind: detail.kind,
        description: detail.description || ''
      })
      setItems(
        detail.items.map((item) => ({
          id: item.id,
          label: item.label,
          value: item.value,
          description: item.description || '',
          sort: item.sort,
          status: item.status
        }))
      )
      setErrors({})
    }
  }, [detail])

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="flex flex-col gap-6 @5xl/content:flex-row">
            <Skeleton className="h-96 flex-1 rounded-2xl" />
            <Skeleton className="h-96 w-full @5xl/content:w-90 rounded-[28px]" />
          </div>
        </Main>
      </>
    )
  }

  if (isError || !detail) {
    return (
      <>
        <AppHeader />
        <Main className="flex flex-1 flex-col gap-6">
          <EmptyState
            title="字典未找到"
            description="该字典可能已被删除，或您没有查看权限"
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.history.go(-1)}>
                  返回上一页
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  重试
                </Button>
              </div>
            }
          />
        </Main>
      </>
    )
  }

  const handleCancel = () => {
    setBasicValues({
      name: detail.name,
      code: detail.code,
      folderId: detail.folderId || '',
      kind: detail.kind,
      description: detail.description || ''
    })
    setItems(
      detail.items.map((item) => ({
        id: item.id,
        label: item.label,
        value: item.value,
        description: item.description || '',
        sort: item.sort,
        status: item.status
      }))
    )
    setErrors({})
    setIsEditing(false)
  }

  const handleSave = async () => {
    const nextErrors: Partial<Record<keyof DictBasicInfoValues, string>> = {}
    if (!basicValues.name.trim()) nextErrors.name = '请输入字典名称'
    if (!basicValues.folderId) nextErrors.folderId = '请选择归属空间'

    for (let i = 0; i < items.length; i++) {
      if (!items[i].label.trim() || !items[i].value.trim()) {
        toast.add({
          title: '配置项不完整',
          description: `第 ${i + 1} 个字典项的标签名称和键值不能为空`,
          type: 'error'
        })
        return
      }
      const validationError = getDictionaryItemValidationError(items[i])
      if (validationError) {
        toast.add({
          title: '字典项格式不正确',
          description: `第 ${i + 1} 个字典项：${validationError}`,
          type: 'error'
        })
        return
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: detail.id,
        data: {
          name: basicValues.name.trim(),
          folderId: basicValues.folderId,
          kind: basicValues.kind,
          description: basicValues.description.trim() || null,
          items: items.map((i) => ({
            label: i.label.trim(),
            value: i.value.trim(),
            description: i.description?.trim() || null,
            sort: i.sort,
            status: i.status
          }))
        }
      })
      toast.add({ title: '字典更新成功', type: 'success' })
      setIsEditing(false)
      setErrors({})
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      toast.add({ title: '更新失败', description: message, type: 'error' })
    }
  }

  const handleToggleStar = async () => {
    try {
      await toggleStarMutation.mutateAsync({
        id: detail.id,
        isStarred: !detail.isStarred
      })
      toast.add({
        title: detail.isStarred ? '已取消收藏' : '已添加收藏',
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

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader size="lg">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            aria-label="返回上一页"
            onClick={() => router.history.go(-1)}
          >
            <ArrowLeft className="size-4" />
          </Button>

          <PageHeaderContent>
            <PageHeaderTitle as="h1" className="inline-flex flex-wrap items-center gap-2.5">
              <Toggle
                pressed={detail.isStarred}
                aria-label={detail.isStarred ? '取消收藏' : '收藏'}
                aria-pressed={detail.isStarred}
                disabled={toggleStarMutation.isPending}
                onPressedChange={() => void handleToggleStar()}
                className="size-8 rounded-md text-amber-500 hover:text-amber-600 data-[pressed]:text-amber-500"
              >
                <Star className={cn('size-5', detail.isStarred && 'fill-current')} />
              </Toggle>
              <span>{detail.name}</span>
            </PageHeaderTitle>

            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              {detail.description?.trim() ? (
                <span>{detail.description}</span>
              ) : (
                <span className="font-mono text-muted-foreground">{detail.code}</span>
              )}
            </PageHeaderDescription>
          </PageHeaderContent>

          <PageHeaderActions className="gap-3">
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="size-4 mr-1.5" /> 编辑
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
                <Button size="lg" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-1.5" />
                  )}
                  保存修改
                </Button>
              </>
            )}
          </PageHeaderActions>
        </PageHeader>

        {/* 双栏布局 */}
        <div className="flex flex-col gap-6 @5xl/content:flex-row pb-12">
          {/* 左侧字典项 */}
          <div className="order-2 min-w-0 flex-1 flex flex-col gap-4 @5xl/content:order-1">
            <DictItemsCard items={items} onChange={setItems} isEditing={isEditing} />
          </div>

          {/* 右侧基本信息与属性 */}
          <DictSideOverview
            className="order-1 @5xl/content:order-2"
            values={basicValues}
            onChange={(patch) => {
              setBasicValues((prev) => ({ ...prev, ...patch }))
              setErrors((prev) => {
                const next = { ...prev }
                for (const key of Object.keys(patch) as Array<keyof DictBasicInfoValues>) {
                  delete next[key]
                }
                return next
              })
            }}
            isEditing={isEditing}
            isNew={false}
            errors={errors}
          />
        </div>
      </Main>
    </>
  )
}
