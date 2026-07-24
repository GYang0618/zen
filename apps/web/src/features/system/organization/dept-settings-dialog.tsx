import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@zen/ui'
import { AlertCircle, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { userApi } from '@/features/system/users/api'

import { useMoveOrganization, useUpdateOrganization } from './queries'
import { collectDescendantIds } from './utils'

import type { OrganizationTreeNode } from '@zen/shared'

const deptSettingsSchema = z.object({
  name: z.string().trim().min(1, '部门名称不能为空').max(100),
  parentId: z.string().nullable(),
  description: z.string().trim().max(500).optional(),
  leaderId: z.string().nullable().optional()
})

type DeptSettingsValues = z.infer<typeof deptSettingsSchema>

type DeptSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: OrganizationTreeNode
  parentOptions: OrganizationTreeNode[]
  onRequestDelete?: () => void
}

async function resolveUserId(keyword: string): Promise<{ id: string; label: string } | null> {
  const list = await userApi.getUserList({ keyword, page: 1, pageSize: 5 })
  const match =
    list.items.find((item) => item.id === keyword) ??
    list.items.find((item) => item.username === keyword || item.email === keyword) ??
    list.items[0]
  if (!match) return null
  return { id: match.id, label: match.nickname || match.username }
}

export function DeptSettingsDialog({
  open,
  onOpenChange,
  organization,
  parentOptions,
  onRequestDelete
}: DeptSettingsDialogProps) {
  const updateOrganization = useUpdateOrganization()
  const moveOrganization = useMoveOrganization()
  const [leaderKeyword, setLeaderKeyword] = useState('')
  const [leaderHint, setLeaderHint] = useState('')
  const isPending = updateOrganization.isPending || moveOrganization.isPending

  const excludedParentIds = useMemo(() => collectDescendantIds(organization), [organization])

  const form = useForm<DeptSettingsValues>({
    resolver: zodResolver(deptSettingsSchema),
    defaultValues: {
      name: organization.name,
      parentId: organization.parentId,
      description: organization.description ?? '',
      leaderId: organization.leaderId
    }
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: organization.name,
      parentId: organization.parentId,
      description: organization.description ?? '',
      leaderId: organization.leaderId
    })
    setLeaderKeyword(organization.leaderName ?? '')
    setLeaderHint('')
  }, [open, organization, form])

  const onSubmit = form.handleSubmit(async (values) => {
    let leaderId = values.leaderId ?? null
    const keyword = leaderKeyword.trim()

    if (keyword) {
      const resolved = await resolveUserId(keyword)
      if (!resolved) {
        setLeaderHint('未找到用户')
        return
      }
      leaderId = resolved.id
      setLeaderHint('')
    } else {
      leaderId = null
    }

    const nextParentId = values.parentId
    const parentChanged = nextParentId !== organization.parentId

    await updateOrganization.mutateAsync({
      id: organization.id,
      data: {
        name: values.name,
        description: values.description || undefined,
        leaderId
      }
    })

    if (parentChanged) {
      await moveOrganization.mutateAsync({
        id: organization.id,
        data: { parentId: nextParentId }
      })
    }

    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-4 text-primary" aria-hidden />
            部门属性与信息设置
          </DialogTitle>
          <DialogDescription>修改部门名称、上级归属、负责人与职能描述</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="dept-name">当前部门名称</FieldLabel>
                  <Input {...field} id="dept-name" aria-invalid={fieldState.invalid || undefined} />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="parentId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>上级母部门</FieldLabel>
                    <Select
                      value={field.value ?? '__root__'}
                      onValueChange={(value) => field.onChange(value === '__root__' ? null : value)}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                        <SelectValue placeholder="无（根节点）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__root__">无（根节点）</SelectItem>
                        {parentOptions
                          .filter((item) => !excludedParentIds.has(item.id))
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel htmlFor="dept-leader">部门负责人</FieldLabel>
                <Input
                  id="dept-leader"
                  placeholder="用户 ID / 用户名 / 邮箱"
                  value={leaderKeyword}
                  onChange={(event) => {
                    setLeaderKeyword(event.target.value)
                    setLeaderHint('')
                    form.setValue('leaderId', null)
                  }}
                />
                {leaderHint ? <p className="text-xs text-destructive">{leaderHint}</p> : null}
              </Field>
            </div>

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="dept-description">部门职能描述</FieldLabel>
                  <Textarea
                    {...field}
                    id="dept-description"
                    rows={3}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">
              修改部门名称或上级归属会即时同步至组织架构图谱，并关联相关成员的权限域。
            </AlertDescription>
          </Alert>

          <DialogFooter className="sm:justify-between">
            {onRequestDelete ? (
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 text-xs text-destructive"
                onClick={() => {
                  onOpenChange(false)
                  onRequestDelete()
                }}
              >
                申请归档/撤销部门
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                保存修改
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
