import { useRouter } from '@tanstack/react-router'
import {
  Button,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
  toast
} from '@zen/ui'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useState } from 'react'

import { AppHeader, Main } from '@/components/layouts'

import { DictItemsCard } from './components/dict-items-card'
import { DictSideOverview } from './components/dict-side-overview'
import { useCreateDictionaryMutation } from './mutations'
import { getDictionaryItemValidationError } from './validation'

import type { DictionaryItem } from '@zen/shared'
import type { DictBasicInfoValues } from './components/dict-side-overview'

interface DictNewProps {
  initialWorkspaceId?: string
}

export function DictNew({ initialWorkspaceId }: DictNewProps) {
  const router = useRouter()
  const createMutation = useCreateDictionaryMutation()

  const [basicValues, setBasicValues] = useState<DictBasicInfoValues>({
    name: '',
    code: '',
    folderId: initialWorkspaceId || '',
    kind: 'business',
    description: ''
  })

  const [items, setItems] = useState<DictionaryItem[]>([
    { label: '', value: '', description: '', sort: 1, status: 'ACTIVE' }
  ])
  const [errors, setErrors] = useState<Partial<Record<keyof DictBasicInfoValues, string>>>({})

  const handleSave = async () => {
    const nextErrors: Partial<Record<keyof DictBasicInfoValues, string>> = {}
    if (!basicValues.name.trim()) nextErrors.name = '请输入字典名称'
    if (!basicValues.code.trim()) {
      nextErrors.code = '请输入字典编码'
    } else if (!/^[a-z][a-z0-9_]*$/.test(basicValues.code.trim())) {
      nextErrors.code = '编码必须以小写字母开头，仅包含小写字母、数字与下划线'
    }
    if (!basicValues.folderId) nextErrors.folderId = '请选择归属空间'

    // Filter valid items or validate if user entered partial item
    const validItems = items.filter(
      (item) => item.label.trim() || item.value.trim() || (item.description ?? '').trim()
    )
    for (let i = 0; i < validItems.length; i++) {
      if (!validItems[i].label.trim() || !validItems[i].value.trim()) {
        toast.add({
          title: '配置项不完整',
          description: `第 ${i + 1} 个字典项的标签名称和键值不能为空`,
          type: 'error'
        })
        return
      }
      const validationError = getDictionaryItemValidationError(validItems[i])
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
      const created = await createMutation.mutateAsync({
        name: basicValues.name.trim(),
        code: basicValues.code.trim(),
        folderId: basicValues.folderId,
        kind: basicValues.kind,
        description: basicValues.description.trim() || null,
        items: validItems.map((item, idx) => ({
          label: item.label.trim(),
          value: item.value.trim(),
          description: item.description?.trim() || null,
          sort: item.sort || idx + 1,
          status: item.status
        }))
      })

      toast.add({ title: '字典创建成功', type: 'success' })
      void router.navigate({
        to: '/system/dict/$id',
        params: { id: created.id }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      toast.add({ title: '创建字典失败', description: message, type: 'error' })
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
            <PageHeaderTitle as="h1">新建数据字典</PageHeaderTitle>
            <PageHeaderDescription className="flex flex-wrap items-center gap-2 text-sm">
              创建一个数据字典，用于存储和管理数据。
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions className="gap-3">
            <Button size="lg" onClick={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="size-4 mr-1.5" />
              )}
              保存字典
            </Button>
          </PageHeaderActions>
        </PageHeader>

        <div className="flex flex-col gap-6 @5xl/content:flex-row pb-12">
          {/* 左侧字典项 */}
          <div className="order-2 min-w-0 flex-1 flex flex-col gap-4 @5xl/content:order-1">
            <DictItemsCard items={items} onChange={setItems} isEditing={true} />
          </div>

          {/* 右侧基本信息与属性 */}
          <DictSideOverview
            className="order-1 @5xl/content:order-2"
            values={basicValues}
            onChange={(patch) => {
              setBasicValues((prev) => ({ ...prev, ...patch }))
              setErrors((prev) => {
                const next = { ...prev }
                for (const key of Object.keys(patch)) {
                  delete next[key as keyof DictBasicInfoValues]
                }
                return next
              })
            }}
            isEditing={true}
            isNew={true}
            errors={errors}
          />
        </div>
      </Main>
    </>
  )
}
