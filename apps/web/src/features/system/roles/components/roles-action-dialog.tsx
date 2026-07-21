import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
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
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { dataScopeOptions, roleStatusOptions } from '../data/data'
import { useCreateRoleMutation, useUpdateRoleMutation } from '../mutations'
import { PermissionPicker } from './permission-picker'

import type { Role } from '@zen/shared'

type RolesActionDialogProps = {
  currentRow?: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, '角色编码至少需要2个字符')
    .max(50, '角色编码不能超过50个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '角色编码仅支持小写字母、数字和下划线，且以字母开头'),
  name: z.string().trim().min(1, '角色名称不能为空').max(50, '角色名称不能超过50个字符'),
  description: z.string().trim().max(200, '描述不能超过200个字符').optional(),
  dataScope: z.enum(['all', 'department', 'self', 'custom']),
  sort: z.number().int().min(0).max(9999),
  permissionCodes: z.array(z.string()).default([]),
  status: z.enum(['active', 'disabled']).optional()
})

type RoleFormValues = z.infer<typeof roleFormSchema>

const defaultValues: RoleFormValues = {
  code: '',
  name: '',
  description: '',
  dataScope: 'self',
  sort: 100,
  permissionCodes: [],
  status: 'active'
}

const isLockedSystemRole = (role?: Role) => role?.code === 'super_admin'

export function RolesActionDialog({ currentRow, open, onOpenChange }: RolesActionDialogProps) {
  const isEdit = !!currentRow
  const locked = isLockedSystemRole(currentRow)
  const { mutate: createRole, isPending: isCreating, error: createError } = useCreateRoleMutation()
  const { mutate: updateRole, isPending: isUpdating, error: updateError } = useUpdateRoleMutation()
  const isPending = isCreating || isUpdating
  const actionError = isEdit ? updateError : createError

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues
  })

  useEffect(() => {
    if (!open) return

    if (!isEdit || !currentRow) {
      form.reset(defaultValues)
      return
    }

    form.reset({
      code: currentRow.code,
      name: currentRow.name,
      description: currentRow.description ?? '',
      dataScope: currentRow.dataScope,
      sort: currentRow.sort,
      permissionCodes: currentRow.permissions,
      status: currentRow.status
    })
  }, [open, isEdit, currentRow, form])

  const handleSubmit = (values: RoleFormValues) => {
    if (locked) {
      toast.error('超级管理员角色不可编辑')
      return
    }

    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      dataScope: values.dataScope,
      sort: values.sort,
      permissionCodes: values.permissionCodes ?? []
    }

    if (isEdit && currentRow) {
      updateRole(
        {
          id: currentRow.id,
          data: {
            ...payload,
            status: values.status
          }
        },
        {
          onSuccess: () => {
            toast.success('角色更新成功')
            onOpenChange(false)
          }
        }
      )
      return
    }

    createRole(
      {
        code: values.code.trim(),
        ...payload
      },
      {
        onSuccess: () => {
          toast.success('角色创建成功')
          onOpenChange(false)
          form.reset(defaultValues)
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '新增角色'}</DialogTitle>
          <DialogDescription>
            {locked
              ? '超级管理员拥有全部权限，不可修改。'
              : isEdit
                ? '更新角色基础信息与权限配置。'
                : '创建自定义角色并分配权限。'}
          </DialogDescription>
        </DialogHeader>

        <form id="role-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="role-code">角色编码</FieldLabel>
              <FieldContent>
                <Input
                  id="role-code"
                  placeholder="例如 project_manager"
                  disabled={isEdit || locked}
                  {...form.register('code')}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="role-name">角色名称</FieldLabel>
              <FieldContent>
                <Input
                  id="role-name"
                  placeholder="例如 项目经理"
                  disabled={locked}
                  {...form.register('name')}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="role-description">描述</FieldLabel>
              <FieldContent>
                <Textarea
                  id="role-description"
                  rows={2}
                  placeholder="可选，描述角色职责"
                  disabled={locked}
                  {...form.register('description')}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </FieldContent>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>数据范围</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="dataScope"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择数据范围" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataScopeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[form.formState.errors.dataScope]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="role-sort">排序</FieldLabel>
                <FieldContent>
                  <Input
                    id="role-sort"
                    type="number"
                    min={0}
                    max={9999}
                    disabled={locked}
                    {...form.register('sort', { valueAsNumber: true })}
                  />
                  <FieldError errors={[form.formState.errors.sort]} />
                </FieldContent>
              </Field>
            </div>

            {isEdit ? (
              <Field>
                <FieldLabel>状态</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={locked || currentRow?.isSystem}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {currentRow?.isSystem ? (
                    <p className="text-xs text-muted-foreground">系统内置角色的状态不可修改</p>
                  ) : null}
                </FieldContent>
              </Field>
            ) : null}

            <Field>
              <FieldLabel>权限配置</FieldLabel>
              <FieldContent>
                <Controller
                  control={form.control}
                  name="permissionCodes"
                  render={({ field }) => (
                    <PermissionPicker
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={locked}
                    />
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          {actionError ? (
            <p className="text-sm text-destructive">{actionError.message || '操作失败'}</p>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="submit" form="role-form" disabled={isPending || locked}>
            {isPending ? <Loader2 className="animate-spin" /> : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
