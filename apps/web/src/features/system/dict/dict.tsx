import { createDictItemSchema, createDictTypeSchema, PermissionCode } from '@zen/shared'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  ScrollArea,
  Skeleton
} from '@zen/ui'
import { BookMarked, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfigDrawer, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Can } from '@/components/auth/can'
import { Header, Main } from '@/components/layouts'
import { EmptyState, SystemPageHeader } from '@/features/system/components'

import { useCreateDictItem, useCreateDictType, useDictList } from './queries'

export function DictPage() {
  const { data, isLoading } = useDictList()
  const createType = useCreateDictType()
  const createItem = useCreateDictItem()
  const [typeOpen, setTypeOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [selectedTypeCode, setSelectedTypeCode] = useState<string | null>(null)
  const [typeCode, setTypeCode] = useState('')
  const [typeName, setTypeName] = useState('')
  const [itemLabel, setItemLabel] = useState('')
  const [itemValue, setItemValue] = useState('')

  const selected = data?.find((item) => item.code === selectedTypeCode) ?? data?.[0]

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <SystemPageHeader
          title="数据字典"
          description="维护字典类型与字典项，供业务下拉与枚举复用"
          actions={
            <Can permission={PermissionCode.DICT_MANAGE}>
              <Button onClick={() => setTypeOpen(true)}>
                <Plus data-icon="inline-start" />
                新建类型
              </Button>
            </Can>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <Card size="sm" className="gap-0 py-0">
            <CardHeader className="border-b px-3 py-3">
              <CardTitle className="text-sm">字典类型</CardTitle>
              <CardDescription>{data?.length ?? 0} 个类型</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              {isLoading ? (
                <div className="flex flex-col gap-2 p-1">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={BookMarked}
                  title="暂无字典类型"
                  description="先创建一个类型，再添加字典项"
                  compact
                />
              ) : (
                <ScrollArea className="max-h-[min(60vh,28rem)]">
                  <ul className="flex flex-col gap-1 p-1">
                    {data?.map((type) => {
                      const active = selected?.code === type.code
                      return (
                        <li key={type.id}>
                          <button
                            type="button"
                            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                              active
                                ? 'bg-primary/10 text-foreground ring-1 ring-primary/20'
                                : 'hover:bg-muted/70'
                            }`}
                            onClick={() => setSelectedTypeCode(type.code)}
                          >
                            <div className="font-medium">{type.name}</div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {type.code}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card size="sm" className="gap-0 py-0">
            {!selected ? (
              <EmptyState
                icon={BookMarked}
                title="请选择字典类型"
                description="从左侧列表选择后可查看并维护字典项"
              />
            ) : (
              <>
                <CardHeader className="border-b px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <CardTitle>{selected.name}</CardTitle>
                      <CardDescription>{selected.description || selected.code}</CardDescription>
                    </div>
                    <Can permission={PermissionCode.DICT_MANAGE}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTypeCode(selected.code)
                          setItemOpen(true)
                        }}
                      >
                        <Plus data-icon="inline-start" />
                        添加字典项
                      </Button>
                    </Can>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {selected.items.length === 0 ? (
                    <EmptyState
                      icon={Plus}
                      title="暂无字典项"
                      description="为该类型添加标签与值"
                      compact
                      action={
                        <Can permission={PermissionCode.DICT_MANAGE}>
                          <Button size="sm" variant="outline" onClick={() => setItemOpen(true)}>
                            添加第一项
                          </Button>
                        </Can>
                      }
                    />
                  ) : (
                    <ul className="divide-y">
                      {selected.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{item.label}</div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {item.value}
                            </div>
                          </div>
                          <Badge variant={item.status === 'active' ? 'secondary' : 'outline'}>
                            {item.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </Main>

      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建字典类型</DialogTitle>
            <DialogDescription>编码创建后通常不可随意变更，请使用稳定标识</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dict-type-code">编码</FieldLabel>
              <Input
                id="dict-type-code"
                placeholder="如 gender"
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dict-type-name">名称</FieldLabel>
              <Input
                id="dict-type-name"
                placeholder="如 性别"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeOpen(false)}>
              取消
            </Button>
            <Button
              disabled={createType.isPending}
              onClick={async () => {
                const parsed = createDictTypeSchema.safeParse({ code: typeCode, name: typeName })
                if (!parsed.success) {
                  toast.error(parsed.error.issues[0]?.message ?? '表单校验失败')
                  return
                }
                await createType.mutateAsync(parsed.data)
                toast.success('字典类型已创建')
                setTypeOpen(false)
                setTypeCode('')
                setTypeName('')
                setSelectedTypeCode(parsed.data.code)
              }}
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加字典项</DialogTitle>
            <DialogDescription>
              归属类型：{selected?.name ?? '—'}（{selected?.code ?? '—'}）
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dict-item-label">标签</FieldLabel>
              <Input
                id="dict-item-label"
                placeholder="展示文案"
                value={itemLabel}
                onChange={(e) => setItemLabel(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dict-item-value">值</FieldLabel>
              <Input
                id="dict-item-value"
                placeholder="存储值"
                value={itemValue}
                onChange={(e) => setItemValue(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>
              取消
            </Button>
            <Button
              disabled={createItem.isPending || !selected}
              onClick={async () => {
                if (!selected) return
                const parsed = createDictItemSchema.safeParse({
                  typeCode: selected.code,
                  label: itemLabel,
                  value: itemValue
                })
                if (!parsed.success) {
                  toast.error(parsed.error.issues[0]?.message ?? '表单校验失败')
                  return
                }
                await createItem.mutateAsync(parsed.data)
                toast.success('字典项已创建')
                setItemOpen(false)
                setItemLabel('')
                setItemValue('')
              }}
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
