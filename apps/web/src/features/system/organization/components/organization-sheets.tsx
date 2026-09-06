import { Link } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
  Textarea
} from '@zen/ui'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronsUpDown,
  FolderKanban,
  GitBranch,
  Landmark,
  Network,
  Pencil,
  Plus,
  UsersRound,
  X
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { flattenOrganizations } from '../data'

import type { LucideIcon } from 'lucide-react'
import type { OrganizationIcon, OrganizationNode } from '../data'

const iconOptions: Record<OrganizationIcon, LucideIcon> = {
  landmark: Landmark,
  network: Network,
  building: Building2,
  branch: GitBranch,
  briefcase: BriefcaseBusiness,
  project: FolderKanban,
  users: UsersRound
}

const typeDefaultIcons: Record<string, OrganizationIcon> = {
  集团: 'landmark',
  事业群: 'network',
  业务中心: 'building',
  职能中心: 'building',
  分公司: 'branch',
  部门: 'briefcase',
  项目组: 'project',
  小组: 'users'
}

const mockUsers = [
  { id: 'u-1001', name: '陈予安', email: 'chenyuan@zen.com' },
  { id: 'u-1002', name: '林清禾', email: 'linqinghe@zen.com' },
  { id: 'u-1003', name: '赵启明', email: 'zhaoqiming@zen.com' },
  { id: 'u-1004', name: '许知夏', email: 'xuzhixia@zen.com' },
  { id: 'u-1005', name: '沈知微', email: 'shenzhiwei@zen.com' }
]

export function defaultIconForType(type: string): OrganizationIcon {
  return typeDefaultIcons[type] ?? 'building'
}

export function allowedChildTypes(parentType: string): string[] {
  if (parentType === '集团') return ['事业群', '业务中心', '职能中心', '分公司']
  if (['事业群', '业务中心', '职能中心', '分公司'].includes(parentType)) {
    return ['部门', '项目组']
  }
  if (parentType === '部门' || parentType === '项目组') return ['小组']
  return []
}

export type BasicOrganizationValues = Pick<
  OrganizationNode,
  'name' | 'code' | 'type' | 'description' | 'leader' | 'leaderId'
> & { icon: OrganizationIcon }

function OrganizationTypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = iconOptions[defaultIconForType(type)]
  return <Icon className={className} />
}

function LeaderSelect({
  value,
  onValueChange
}: {
  value: string
  onValueChange: (user: (typeof mockUsers)[number]) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = mockUsers.find((user) => user.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {selected ? `${selected.name} · ${selected.email}` : '搜索用户 ID、姓名或邮箱'}
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索用户 ID、姓名或邮箱" />
          <CommandList>
            <CommandEmpty>没有找到匹配用户</CommandEmpty>
            <CommandGroup heading="用户">
              {mockUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.id} ${user.name} ${user.email}`}
                  data-checked={value === user.id}
                  onSelect={() => {
                    onValueChange(user)
                    setOpen(false)
                  }}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.id} · {user.email}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function OrganizationDetailsPanel({
  organization,
  onClose,
  onUpdate,
  onCreateChild
}: {
  organization: OrganizationNode
  onClose: () => void
  onUpdate: (id: string, values: BasicOrganizationValues) => void
  onCreateChild: (parentId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<BasicOrganizationValues>({
    name: organization.name,
    code: organization.code,
    type: organization.type,
    description: organization.description,
    leader: organization.leader,
    leaderId: organization.leaderId,
    icon: defaultIconForType(organization.type)
  })

  useEffect(() => {
    setEditing(false)
    setValues({
      name: organization.name,
      code: organization.code,
      type: organization.type,
      description: organization.description,
      leader: organization.leader,
      leaderId: organization.leaderId,
      icon: defaultIconForType(organization.type)
    })
  }, [organization])

  const save = () => {
    if (!values.name.trim() || !values.code.trim()) return
    onUpdate(organization.id, {
      ...values,
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description.trim()
    })
    setEditing(false)
  }

  return (
    <aside className="min-w-0">
      <Card className="sticky top-4 rounded-lg">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle>组织基础信息</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">当前页面的 mock 数据</p>
            </div>
            <div className="flex items-center gap-1">
              {!editing && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="编辑组织信息"
                  onClick={() => setEditing(true)}
                >
                  <Pencil />
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" aria-label="关闭组织信息" onClick={onClose}>
                <X />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="organization-name">名称</FieldLabel>
                <Input
                  id="organization-name"
                  value={values.name}
                  onChange={(event) => setValues({ ...values, name: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>类型、图标</FieldLabel>
                <div className="flex h-8 items-center gap-2 rounded-lg border bg-muted/30 px-2.5">
                  <OrganizationTypeIcon type={values.type} className="size-4 text-primary" />
                  <span>{values.type}</span>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="organization-code">编码</FieldLabel>
                <Input
                  id="organization-code"
                  value={values.code}
                  onChange={(event) => setValues({ ...values, code: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>负责人</FieldLabel>
                <LeaderSelect
                  value={values.leaderId ?? ''}
                  onValueChange={(user) =>
                    setValues({ ...values, leaderId: user.id, leader: user.name })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="organization-description">描述说明</FieldLabel>
                <Textarea
                  id="organization-description"
                  rows={4}
                  value={values.description}
                  onChange={(event) => setValues({ ...values, description: event.target.value })}
                />
              </Field>
            </FieldGroup>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <OrganizationTypeIcon type={organization.type} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold">{organization.name}</h3>
                    <Badge variant="secondary">{organization.memberCount} 人</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{organization.type}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <dl className="grid gap-4">
                <div>
                  <dt className="text-xs text-muted-foreground">编码</dt>
                  <dd className="mt-1 font-medium">{organization.code}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">描述说明</dt>
                  <dd className="mt-1 leading-6 text-muted-foreground">
                    {organization.description || '暂未填写描述说明'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">负责人</dt>
                  <dd className="mt-1 font-medium">{organization.leader}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">办公地点</dt>
                  <dd className="mt-1 font-medium">{organization.location}</dd>
                </div>
              </dl>
            </>
          )}
        </CardContent>
        <CardFooter className="border-t">
          {editing ? (
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                取消
              </Button>
              <Button onClick={save} disabled={!values.name.trim() || !values.code.trim()}>
                <Check data-icon="inline-start" />
                保存
              </Button>
            </div>
          ) : (
            <div className="grid w-full gap-2">
              {allowedChildTypes(organization.type).length > 0 && (
                <Button variant="outline" onClick={() => onCreateChild(organization.id)}>
                  <Plus data-icon="inline-start" />
                  新建下级组织
                </Button>
              )}
              <Button asChild>
                <Link to="/system/organization/$id" params={{ id: organization.id }}>
                  进入组织详情
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </aside>
  )
}

export function CreateOrganizationSheet({
  root,
  parentId,
  open,
  onOpenChange,
  onCreate
}: {
  root: OrganizationNode
  parentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (parentId: string, values: BasicOrganizationValues) => void
}) {
  const parentOptions = useMemo(
    () => flattenOrganizations(root).filter((item) => allowedChildTypes(item.type).length > 0),
    [root]
  )
  const [selectedParentId, setSelectedParentId] = useState(parentId)
  const selectedParent =
    parentOptions.find((option) => option.id === selectedParentId) ?? parentOptions[0]
  const childTypes = selectedParent ? allowedChildTypes(selectedParent.type) : []
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState(childTypes[0] ?? '部门')
  const [description, setDescription] = useState('')
  const [leaderId, setLeaderId] = useState('')
  const [leader, setLeader] = useState('待指定')

  useEffect(() => {
    if (!open) return
    const nextParent = parentOptions.find((option) => option.id === parentId) ?? parentOptions[0]
    const nextType = nextParent ? allowedChildTypes(nextParent.type)[0] : '部门'
    setSelectedParentId(nextParent?.id ?? '')
    setName('')
    setCode('')
    setType(nextType)
    setDescription('')
    setLeaderId('')
    setLeader('待指定')
  }, [open, parentId, parentOptions])

  const changeParent = (nextParentId: string) => {
    const nextParent = parentOptions.find((option) => option.id === nextParentId)
    setSelectedParentId(nextParentId)
    setType(nextParent ? allowedChildTypes(nextParent.type)[0] : '部门')
  }

  const submit = () => {
    if (!name.trim() || !code.trim() || !selectedParent) return
    onCreate(selectedParent.id, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      description: description.trim(),
      leader,
      leaderId: leaderId || undefined,
      icon: defaultIconForType(type)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>新建组织</SheetTitle>
          <SheetDescription>先创建基础信息，成员与岗位可在组织详情中配置</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-organization-name">名称 *</FieldLabel>
              <Input
                id="new-organization-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：平台研发部"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-organization-type">组织类型</FieldLabel>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="new-organization-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {childTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>根据上级层级提供现代组织常用类型</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="parent-organization">上级组织</FieldLabel>
              <Select value={selectedParent?.id} onValueChange={changeParent}>
                <SelectTrigger id="parent-organization" className="w-full">
                  <SelectValue placeholder="选择上级组织" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name} · {option.type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>新组织将直接创建在所选组织下方</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>组织图标</FieldLabel>
              <div className="flex h-9 items-center gap-2 rounded-lg border bg-muted/30 px-2.5">
                <OrganizationTypeIcon type={type} className="size-4 text-primary" />
                <span className="text-sm">已根据“{type}”自动匹配</span>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="new-organization-code">编码 *</FieldLabel>
              <Input
                id="new-organization-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="例如：ZEN-PLATFORM"
              />
            </Field>
            <Field>
              <FieldLabel>负责人</FieldLabel>
              <LeaderSelect
                value={leaderId}
                onValueChange={(user) => {
                  setLeaderId(user.id)
                  setLeader(user.name)
                }}
              />
              <FieldDescription>当前使用 mock 用户，后续接入用户列表远程搜索</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="new-organization-description">描述说明</FieldLabel>
              <Textarea
                id="new-organization-description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="说明该组织的职责与范围"
              />
            </Field>
          </FieldGroup>
        </div>
        <SheetFooter className="border-t sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit} disabled={!name.trim() || !code.trim() || !selectedParent}>
            创建组织
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
