import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardAction,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from '@zen/ui'
import {
  Archive,
  BookOpenCheck,
  Check,
  Copy,
  Ellipsis,
  FileJson2,
  Filter,
  Hash,
  Layers3,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  X
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { AppHeader, Main } from '@/components/layouts'
import { PageHeader } from '@/components/page-header'

import type { ReactNode } from 'react'

type ItemStatus = 'enabled' | 'disabled'
type DictItem = {
  id: string
  label: string
  value: string
  description: string
  sort: number
  status: ItemStatus
  updatedAt: string
}
type Dictionary = {
  id: string
  name: string
  code: string
  description: string
  items: DictItem[]
  updatedAt: string
}
type ItemForm = Omit<DictItem, 'id' | 'updatedAt'>
type DictionaryForm = Pick<Dictionary, 'name' | 'code' | 'description'>

const initialDictionaries: Dictionary[] = [
  {
    id: 'user-status',
    name: '用户状态',
    code: 'user_status',
    description: '用于账号、成员与访问控制的状态展示。',
    updatedAt: '刚刚更新',
    items: [
      {
        id: 'active',
        label: '正常',
        value: 'active',
        description: '账户可正常登录并使用系统。',
        sort: 10,
        status: 'enabled',
        updatedAt: '刚刚'
      },
      {
        id: 'pending',
        label: '待激活',
        value: 'pending',
        description: '等待完成首次验证。',
        sort: 20,
        status: 'enabled',
        updatedAt: '2 小时前'
      },
      {
        id: 'suspended',
        label: '已停用',
        value: 'suspended',
        description: '保留历史数据，禁止继续访问。',
        sort: 90,
        status: 'disabled',
        updatedAt: '昨天'
      }
    ]
  },
  {
    id: 'task-priority',
    name: '任务优先级',
    code: 'task_priority',
    description: '工作台和任务流的优先级枚举。',
    updatedAt: '12 分钟前',
    items: [
      {
        id: 'low',
        label: '低',
        value: 'low',
        description: '可在常规迭代中处理。',
        sort: 30,
        status: 'enabled',
        updatedAt: '12 分钟前'
      },
      {
        id: 'medium',
        label: '中',
        value: 'medium',
        description: '按当前计划推进。',
        sort: 20,
        status: 'enabled',
        updatedAt: '12 分钟前'
      },
      {
        id: 'high',
        label: '高',
        value: 'high',
        description: '需要优先排期并关注风险。',
        sort: 10,
        status: 'enabled',
        updatedAt: '12 分钟前'
      }
    ]
  },
  {
    id: 'employment-type',
    name: '用工类型',
    code: 'employment_type',
    description: '人员档案、排班和组织报表使用。',
    updatedAt: '3 天前',
    items: [
      {
        id: 'full-time',
        label: '全职',
        value: 'full_time',
        description: '正式全职员工。',
        sort: 10,
        status: 'enabled',
        updatedAt: '3 天前'
      },
      {
        id: 'contractor',
        label: '外包',
        value: 'contractor',
        description: '按项目或服务周期合作。',
        sort: 20,
        status: 'enabled',
        updatedAt: '3 天前'
      }
    ]
  }
]

const emptyItem: ItemForm = { label: '', value: '', description: '', sort: 10, status: 'enabled' }
const emptyDictionary: DictionaryForm = { name: '', code: '', description: '' }

function StatusBadge({ status }: { status: ItemStatus }) {
  return status === 'enabled' ? (
    <Badge variant="secondary">
      <Check data-icon="inline-start" />
      已启用
    </Badge>
  ) : (
    <Badge variant="outline">
      <Archive data-icon="inline-start" />
      已停用
    </Badge>
  )
}

export function ArrayDictV2Page() {
  const [dictionaries, setDictionaries] = useState(initialDictionaries)
  const [selectedId, setSelectedId] = useState(initialDictionaries[0].id)
  const [typeSearch, setTypeSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [showDisabled, setShowDisabled] = useState(true)
  const [createTypeOpen, setCreateTypeOpen] = useState(false)
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [typeSettingsOpen, setTypeSettingsOpen] = useState(false)
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [typeForm, setTypeForm] = useState<DictionaryForm>(emptyDictionary)
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [deletingItem, setDeletingItem] = useState<DictItem | null>(null)

  const selected =
    dictionaries.find((dictionary) => dictionary.id === selectedId) ?? dictionaries[0]
  const visibleTypes = useMemo(() => {
    const query = typeSearch.trim().toLowerCase()
    return query
      ? dictionaries.filter(
          (dictionary) =>
            dictionary.name.toLowerCase().includes(query) ||
            dictionary.code.toLowerCase().includes(query)
        )
      : dictionaries
  }, [dictionaries, typeSearch])
  const visibleItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()
    return selected.items
      .filter((item) => showDisabled || item.status === 'enabled')
      .filter(
        (item) =>
          !query || `${item.label} ${item.value} ${item.description}`.toLowerCase().includes(query)
      )
      .toSorted((left, right) => left.sort - right.sort)
  }, [itemSearch, selected, showDisabled])

  const updateSelected = (updater: (dictionary: Dictionary) => Dictionary) => {
    setDictionaries((current) =>
      current.map((dictionary) =>
        dictionary.id === selected.id ? updater(dictionary) : dictionary
      )
    )
  }
  const openAddItem = () => {
    setEditingItemId(null)
    setItemForm({
      ...emptyItem,
      sort: Math.max(0, ...selected.items.map((item) => item.sort)) + 10
    })
    setCreateItemOpen(true)
  }
  const saveItem = () => {
    const label = itemForm.label.trim()
    const value = itemForm.value.trim()
    if (!label || !value) return toast.error('请填写标签和值')
    if (selected.items.some((item) => item.value === value && item.id !== editingItemId))
      return toast.error('当前字典中已存在相同的值')
    if (editingItemId) {
      updateSelected((dictionary) => ({
        ...dictionary,
        updatedAt: '刚刚更新',
        items: dictionary.items.map((item) =>
          item.id === editingItemId
            ? { ...item, ...itemForm, label, value, updatedAt: '刚刚' }
            : item
        )
      }))
      setEditItemOpen(false)
      toast.success('字典项已保存')
      return
    }
    updateSelected((dictionary) => ({
      ...dictionary,
      updatedAt: '刚刚更新',
      items: [
        ...dictionary.items,
        { id: `item-${Date.now()}`, ...itemForm, label, value, updatedAt: '刚刚' }
      ]
    }))
    setCreateItemOpen(false)
    toast.success('字典项已添加')
  }
  const saveType = () => {
    const name = typeForm.name.trim()
    const code = typeForm.code.trim().toLowerCase().replace(/\s+/g, '_')
    if (!name || !code) return toast.error('请填写类型名称与编码')
    if (dictionaries.some((dictionary) => dictionary.code === code))
      return toast.error('类型编码已存在')
    const next: Dictionary = {
      id: `type-${Date.now()}`,
      name,
      code,
      description: typeForm.description.trim() || '尚未添加说明。',
      updatedAt: '刚刚创建',
      items: []
    }
    setDictionaries((current) => [...current, next])
    setSelectedId(next.id)
    setCreateTypeOpen(false)
    setTypeForm(emptyDictionary)
    toast.success('字典类型已创建')
  }
  const saveTypeSettings = () => {
    const name = typeForm.name.trim()
    if (!name) return toast.error('请填写字典名称')
    updateSelected((dictionary) => ({
      ...dictionary,
      name,
      description: typeForm.description.trim() || '尚未添加说明。',
      updatedAt: '刚刚更新'
    }))
    setTypeSettingsOpen(false)
    toast.success('字典设置已保存')
  }
  const editItem = (item: DictItem) => {
    setEditingItemId(item.id)
    setItemForm({
      label: item.label,
      value: item.value,
      description: item.description,
      sort: item.sort,
      status: item.status
    })
    setEditItemOpen(true)
  }
  const toggleItem = (item: DictItem) => {
    const status: ItemStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
    updateSelected((dictionary) => ({
      ...dictionary,
      updatedAt: '刚刚更新',
      items: dictionary.items.map((current) =>
        current.id === item.id ? { ...current, status, updatedAt: '刚刚' } : current
      )
    }))
    toast.success(status === 'enabled' ? '字典项已启用' : '字典项已停用')
  }
  const duplicateItem = (item: DictItem) => {
    const copy = {
      ...item,
      id: `item-${Date.now()}`,
      label: `${item.label}（副本）`,
      value: `${item.value}_copy`,
      sort: Math.max(...selected.items.map((current) => current.sort)) + 10,
      updatedAt: '刚刚'
    }
    updateSelected((dictionary) => ({
      ...dictionary,
      updatedAt: '刚刚更新',
      items: [...dictionary.items, copy]
    }))
    toast.success('已创建字典项副本')
  }
  const removeItem = () => {
    if (!deletingItem) return
    updateSelected((dictionary) => ({
      ...dictionary,
      updatedAt: '刚刚更新',
      items: dictionary.items.filter((item) => item.id !== deletingItem.id)
    }))
    setDeletingItem(null)
    toast.success('字典项已删除')
  }

  return (
    <>
      <AppHeader />
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader
          title="数组字典 V2"
          description="独立的前端字典工作台，变更仅保留在当前会话。"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                <FileJson2 data-icon="inline-start" />
                预览 JSON
              </Button>
              <Button onClick={() => setCreateTypeOpen(true)}>
                <Plus data-icon="inline-start" />
                新建字典
              </Button>
            </div>
          }
        />
        <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <Card size="sm" className="min-w-0 gap-0 py-0">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers3 />
                字典集合
              </CardTitle>
              <CardDescription>{dictionaries.length} 个已配置类型</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              <InputGroup>
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label="搜索字典类型"
                  placeholder="搜索名称或编码"
                  value={typeSearch}
                  onChange={(event) => setTypeSearch(event.target.value)}
                />
              </InputGroup>
              <ScrollArea className="h-[min(54vh,34rem)] pr-2">
                <div className="flex flex-col gap-1">
                  {visibleTypes.map((dictionary) => (
                    <button
                      key={dictionary.id}
                      type="button"
                      data-selected={dictionary.id === selected.id}
                      className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/70 data-[selected=true]:bg-muted"
                      onClick={() => {
                        setSelectedId(dictionary.id)
                        setItemSearch('')
                      }}
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <BookOpenCheck />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{dictionary.name}</span>
                          <Badge variant="outline">{dictionary.items.length}</Badge>
                        </span>
                        <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                          {dictionary.code}
                        </span>
                      </span>
                    </button>
                  ))}
                  {visibleTypes.length === 0 && (
                    <div className="flex flex-col items-center gap-2 px-3 py-10 text-center text-sm text-muted-foreground">
                      <Search />
                      未找到匹配的字典类型
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardContent className="border-t py-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash />
                仅本地演示数据
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-0 gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="flex min-w-0 items-center gap-2">
                <span className="truncate">{selected.name}</span>
                <Badge variant="outline" className="font-mono font-normal">
                  {selected.code}
                </Badge>
              </CardTitle>
              <CardDescription>{selected.description}</CardDescription>
              <CardAction>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="编辑字典设置"
                  onClick={() => {
                    setTypeForm({
                      name: selected.name,
                      code: selected.code,
                      description: selected.description
                    })
                    setTypeSettingsOpen(true)
                  }}
                >
                  <Settings2 />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 py-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <Metric icon={<Layers3 />} value={selected.items.length} label="全部字典项" />
                <Metric
                  icon={<Check />}
                  value={selected.items.filter((item) => item.status === 'enabled').length}
                  label="当前已启用"
                />
                <Metric icon={<Hash />} value={selected.updatedAt} label="最后更新" compact />
              </div>
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <InputGroup className="max-w-md">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="搜索字典项"
                    placeholder="搜索标签、值或说明"
                    value={itemSearch}
                    onChange={(event) => setItemSearch(event.target.value)}
                  />
                  {itemSearch && (
                    <InputGroupAddon align="inline-end">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="清空搜索"
                        onClick={() => setItemSearch('')}
                      >
                        <X />
                      </Button>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="show-disabled-switch"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Switch
                      id="show-disabled-switch"
                      checked={showDisabled}
                      onCheckedChange={setShowDisabled}
                    />
                    显示停用项
                  </label>
                  <Button onClick={openAddItem}>
                    <Plus data-icon="inline-start" />
                    添加字典项
                  </Button>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-4">标签</TableHead>
                    <TableHead>值</TableHead>
                    <TableHead className="hidden lg:table-cell">说明</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="hidden xl:table-cell">更新于</TableHead>
                    <TableHead className="w-11" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-4 font-medium">{item.label}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.value}</code>
                      </TableCell>
                      <TableCell className="hidden max-w-72 truncate text-muted-foreground lg:table-cell">
                        {item.description || '—'}
                      </TableCell>
                      <TableCell>{item.sort}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {item.updatedAt}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`操作 ${item.label}`}
                            >
                              <Ellipsis />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onSelect={() => editItem(item)}>
                                <Pencil />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => duplicateItem(item)}>
                                <Copy />
                                复制为新项
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem onSelect={() => toggleItem(item)}>
                                {item.status === 'enabled' ? <Archive /> : <Check />}
                                {item.status === 'enabled' ? '停用' : '启用'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeletingItem(item)}
                              >
                                <Trash2 />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <Filter />
                          <span>没有符合当前筛选条件的字典项</span>
                          {(itemSearch || !showDisabled) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setItemSearch('')
                                setShowDisabled(true)
                              }}
                            >
                              清除筛选
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardContent className="flex items-center justify-between border-t py-3 text-xs text-muted-foreground">
              <span>
                显示 {visibleItems.length} / {selected.items.length} 条记录
              </span>
              <span>数组顺序按排序值升序展示</span>
            </CardContent>
          </Card>
        </div>
      </Main>
      <Dialog open={createTypeOpen} onOpenChange={setCreateTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建字典类型</DialogTitle>
            <DialogDescription>创建后可立即添加和维护数组中的字典项。</DialogDescription>
          </DialogHeader>
          <DictionaryFields form={typeForm} onChange={setTypeForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTypeOpen(false)}>
              取消
            </Button>
            <Button onClick={saveType}>创建字典</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={createItemOpen} onOpenChange={setCreateItemOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>添加字典项</DialogTitle>
            <DialogDescription>将添加到「{selected.name}」的数组中。</DialogDescription>
          </DialogHeader>
          <ItemFields form={itemForm} onChange={setItemForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateItemOpen(false)}>
              取消
            </Button>
            <Button onClick={saveItem}>添加字典项</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={typeSettingsOpen} onOpenChange={setTypeSettingsOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>字典设置</SheetTitle>
            <SheetDescription>类型编码用于业务引用，在此页面保持只读。</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-2">
            <DictionaryFields form={typeForm} onChange={setTypeForm} codeReadOnly />
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setTypeSettingsOpen(false)}>
              取消
            </Button>
            <Button onClick={saveTypeSettings}>保存更改</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet open={editItemOpen} onOpenChange={setEditItemOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>编辑字典项</SheetTitle>
            <SheetDescription>更改会立即更新当前会话内的数组数据。</SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-2">
            <ItemFields form={itemForm} onChange={setItemForm} />
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditItemOpen(false)}>
              取消
            </Button>
            <Button onClick={saveItem}>保存更改</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>前端数组预览</DialogTitle>
            <DialogDescription>刷新页面后会恢复初始状态，不会向后端发出请求。</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] rounded-lg border bg-muted/30">
            <pre className="p-4 text-xs leading-5 text-muted-foreground">
              {JSON.stringify(dictionaries, null, 2)}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除「{deletingItem?.label}」？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作会从当前字典数组中移除该项，且无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={removeItem}>
              删除字典项
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Metric({
  icon,
  value,
  label,
  compact = false
}: {
  icon: ReactNode
  value: ReactNode
  label: string
  compact?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
      <span className="flex size-8 items-center justify-center rounded-md bg-background ring-1 ring-foreground/10">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={
            compact ? 'truncate text-sm font-medium' : 'text-lg font-semibold leading-none'
          }
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  )
}

function DictionaryFields({
  form,
  onChange,
  codeReadOnly = false
}: {
  form: DictionaryForm
  onChange: (next: DictionaryForm) => void
  codeReadOnly?: boolean
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="array-dict-name">字典名称</FieldLabel>
        <Input
          id="array-dict-name"
          value={form.name}
          placeholder="例如：订单状态"
          onChange={(event) => onChange({ ...form, name: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="array-dict-code">类型编码</FieldLabel>
        <Input
          id="array-dict-code"
          value={form.code}
          readOnly={codeReadOnly}
          className="font-mono"
          placeholder="例如：order_status"
          onChange={(event) => onChange({ ...form, code: event.target.value })}
        />
        <FieldDescription>使用小写字母、数字和下划线作为稳定的业务标识。</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="array-dict-description">说明</FieldLabel>
        <Textarea
          id="array-dict-description"
          value={form.description}
          placeholder="描述这个字典适用的业务范围"
          onChange={(event) => onChange({ ...form, description: event.target.value })}
        />
      </Field>
    </FieldGroup>
  )
}

function ItemFields({ form, onChange }: { form: ItemForm; onChange: (next: ItemForm) => void }) {
  return (
    <FieldGroup>
      <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
        <Field>
          <FieldLabel htmlFor="array-item-label">标签</FieldLabel>
          <Input
            id="array-item-label"
            value={form.label}
            placeholder="例如：处理中"
            onChange={(event) => onChange({ ...form, label: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="array-item-value">值</FieldLabel>
          <Input
            id="array-item-value"
            value={form.value}
            className="font-mono"
            placeholder="例如：processing"
            onChange={(event) => onChange({ ...form, value: event.target.value })}
          />
        </Field>
      </FieldGroup>
      <Field>
        <FieldLabel htmlFor="array-item-description">说明</FieldLabel>
        <Textarea
          id="array-item-description"
          value={form.description}
          placeholder="向维护者说明该字典项的使用场景"
          onChange={(event) => onChange({ ...form, description: event.target.value })}
        />
      </Field>
      <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
        <Field>
          <FieldLabel htmlFor="array-item-sort">排序值</FieldLabel>
          <Input
            id="array-item-sort"
            type="number"
            min="0"
            value={form.sort}
            onChange={(event) => onChange({ ...form, sort: Number(event.target.value) || 0 })}
          />
        </Field>
        <Field>
          <FieldLabel>状态</FieldLabel>
          <Select
            value={form.status}
            onValueChange={(status: ItemStatus) => onChange({ ...form, status })}
          >
            <SelectTrigger aria-label="字典项状态">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="enabled">已启用</SelectItem>
                <SelectItem value="disabled">已停用</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FieldGroup>
  )
}
