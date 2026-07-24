import { zodResolver } from '@hookform/resolvers/zod'
import { createOrganizationSchema } from '@zen/shared'
import {
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
  SelectValue
} from '@zen/ui'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { userApi } from '@/features/system/users/api'

import { useCreateOrganization } from './queries'

import type { OrganizationTreeNode } from '@zen/shared'
import type { z } from 'zod'

type CreateFormValues = z.infer<typeof createOrganizationSchema>

type CreateOrganizationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentOptions: OrganizationTreeNode[]
  defaultParentId?: string | null
}

async function resolveUserId(keyword: string): Promise<string | null> {
  const list = await userApi.getUserList({ keyword, page: 1, pageSize: 5 })
  const match =
    list.items.find((item) => item.id === keyword) ??
    list.items.find((item) => item.username === keyword || item.email === keyword) ??
    list.items[0]
  return match?.id ?? null
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  parentOptions,
  defaultParentId = null
}: CreateOrganizationDialogProps) {
  const createMutation = useCreateOrganization()
  const [leaderKeyword, setLeaderKeyword] = useState('')
  const [leaderHint, setLeaderHint] = useState('')

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'department',
      parentId: defaultParentId ?? undefined,
      description: '',
      leaderId: undefined
    }
  })

  const resetForm = () => {
    form.reset({
      code: '',
      name: '',
      type: 'department',
      parentId: defaultParentId ?? undefined,
      description: '',
      leaderId: undefined
    })
    setLeaderKeyword('')
    setLeaderHint('')
  }

  useEffect(() => {
    if (!open) return
    form.reset({
      code: '',
      name: '',
      type: 'department',
      parentId: defaultParentId ?? undefined,
      description: '',
      leaderId: undefined
    })
    setLeaderKeyword('')
    setLeaderHint('')
  }, [open, defaultParentId, form])

  const onSubmit = form.handleSubmit(async (values) => {
    let leaderId = values.leaderId ?? undefined
    const keyword = leaderKeyword.trim()
    if (keyword) {
      const resolved = await resolveUserId(keyword)
      if (!resolved) {
        setLeaderHint('未找到用户')
        return
      }
      leaderId = resolved
      setLeaderHint('')
    } else {
      leaderId = undefined
    }

    await createMutation.mutateAsync({
      ...values,
      parentId: values.parentId || undefined,
      leaderId: leaderId || undefined
    })
    onOpenChange(false)
    resetForm()
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetForm()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建组织</DialogTitle>
          <DialogDescription>创建后可在组织树中继续挂载下级节点并分配成员</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="org-code">编码</FieldLabel>
                  <Input
                    {...field}
                    id="org-code"
                    placeholder="rd_backend"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="org-name">名称</FieldLabel>
                  <Input
                    {...field}
                    id="org-name"
                    placeholder="研发中心"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>类型</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">公司</SelectItem>
                      <SelectItem value="branch">分支</SelectItem>
                      <SelectItem value="department">部门</SelectItem>
                      <SelectItem value="team">小组</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="parentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>上级组织</FieldLabel>
                  <Select
                    value={field.value ?? '__root__'}
                    onValueChange={(value) =>
                      field.onChange(value === '__root__' ? undefined : value)
                    }
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid || undefined}>
                      <SelectValue placeholder="无（根节点）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">无（根节点）</SelectItem>
                      {parentOptions.map((item) => (
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
              <FieldLabel htmlFor="org-leader">负责人</FieldLabel>
              <Input
                id="org-leader"
                placeholder="用户 ID / 用户名 / 邮箱"
                value={leaderKeyword}
                onChange={(e) => {
                  setLeaderKeyword(e.target.value)
                  setLeaderHint('')
                  form.setValue('leaderId', undefined)
                }}
              />
              {leaderHint ? <p className="text-xs text-destructive">{leaderHint}</p> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
