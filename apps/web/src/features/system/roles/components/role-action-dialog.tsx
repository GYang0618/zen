import { useForm, useStore } from '@tanstack/react-form'
import { ROLE_ICON_COLOR_VALUES, ROLE_ICON_VALUES } from '@zen/shared'
import {
  Button,
  Calendar,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea
} from '@zen/ui'
import { CalendarIcon, Loader2, UserShield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { useCreateRoleMutation, useUpdateRoleMutation } from '@/features/system/roles/mutations'

import { RoleIconColorPicker } from './role-icon-color-picker'
import { RoleIconPicker } from './role-icon-picker'

import type { Role, RoleIcon, RoleIconColor } from '@zen/shared'

interface RoleActionDialogProps {
  currentRow?: Role
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EXPIRED_AT_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const TODAY = (() => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
})()

const roleFormSchema = z.object({
  name: z.string().trim().min(1, '角色名称不能为空').max(50, '角色名称不能超过50个字符'),
  code: z
    .string()
    .trim()
    .min(2, '角色编码至少需要2个字符')
    .max(50, '角色编码不能超过50个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '角色编码仅支持小写字母、数字和下划线，且以字母开头'),
  icon: z.enum(ROLE_ICON_VALUES).nullable(),
  iconColor: z.enum(ROLE_ICON_COLOR_VALUES).nullable(),
  description: z.string().trim().max(200, '角色描述不能超过200个字符'),
  expiresAt: z.date().nullable()
})

const editRoleFormSchema = roleFormSchema.extend({
  code: z.string().min(1, '角色编码不能为空')
})

type RoleFormValues = z.infer<typeof roleFormSchema>

function parseExpiredAt(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? null : date
}

function createRoleFormValues(role?: Role | null): RoleFormValues {
  if (!role) {
    return {
      name: '',
      code: '',
      icon: null,
      iconColor: null,
      description: '',
      expiresAt: null
    }
  }

  return {
    name: role.name,
    code: role.code,
    icon: role.icon,
    iconColor: role.iconColor,
    description: role.description ?? '',
    expiresAt: parseExpiredAt(role.expiresAt)
  }
}

function isTouchedInvalid(meta: { isTouched: boolean; isValid: boolean }) {
  return meta.isTouched && !meta.isValid
}

function formatExpiredAt(date: Date | null): string | null {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function RoleActionDialog({ currentRow, open, onOpenChange }: RoleActionDialogProps) {
  const isEdit = !!currentRow
  const [expiredAtOpen, setExpiredAtOpen] = useState(false)
  const { mutate: createRole, isPending: isCreating } = useCreateRoleMutation()
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRoleMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm({
    defaultValues: createRoleFormValues(currentRow),
    validators: { onChange: isEdit ? editRoleFormSchema : roleFormSchema },
    onSubmit: async ({ value }) => {
      await (isEdit ? handleUpdateSubmit : handleCreateSubmit)(
        (isEdit ? editRoleFormSchema : roleFormSchema).parse(value)
      )
    }
  })
  const iconColor = useStore(form.store, (state) => state.values.iconColor)

  useEffect(() => {
    if (!open) return
    form.reset(createRoleFormValues(currentRow))
    setExpiredAtOpen(false)
  }, [open, currentRow, form])

  const handleCreateSubmit = (values: RoleFormValues) => {
    if (values.expiresAt && values.expiresAt < TODAY) {
      form.setFieldMeta('expiresAt', (meta) => ({
        ...meta,
        errorMap: {
          ...meta.errorMap,
          onSubmit: [{ code: 'custom', path: [], message: '过期时间不能早于今天' }]
        }
      }))
      return
    }

    createRole(
      {
        name: values.name.trim(),
        code: values.code.trim(),
        icon: values.icon,
        iconColor: values.iconColor,
        description: values.description.trim() || undefined,
        expiresAt: formatExpiredAt(values.expiresAt),
        dataScope: 'self'
      },
      {
        onSuccess: (created) => {
          toast.success(`成功新建角色「${created.name}」`)
          onOpenChange(false)
          form.reset(createRoleFormValues())
        }
      }
    )
  }

  const handleUpdateSubmit = (values: RoleFormValues) => {
    if (!currentRow) return
    if (values.expiresAt && values.expiresAt < TODAY) {
      const original = parseExpiredAt(currentRow.expiresAt)
      const isSameDay = original !== null && values.expiresAt.getTime() === original.getTime()
      if (!isSameDay) {
        form.setFieldMeta('expiresAt', (meta) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: [{ code: 'custom', path: [], message: '过期时间不能早于今天' }]
          }
        }))
        return
      }
    }

    updateRole(
      {
        id: currentRow.id,
        data: {
          name: values.name.trim(),
          icon: values.icon as RoleIcon | null,
          iconColor: values.iconColor as RoleIconColor | null,
          description: values.description.trim(),
          expiresAt: formatExpiredAt(values.expiresAt)
        }
      },
      {
        onSuccess: (updated) => {
          toast.success(`已更新角色「${updated.name}」`)
          onOpenChange(false)
        }
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <UserShield className="size-5" /> {isEdit ? '编辑角色' : '新建角色'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {currentRow
              ? `更新「${currentRow.name}」的名称、图标、有效期等信息。`
              : '在此创建新角色；权限请进入详情页配置。'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="role-action-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => (
                <Field data-invalid={isTouchedInvalid(field.state.meta) || undefined}>
                  <FieldLabel htmlFor="role-name">角色名称</FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="role-name"
                      placeholder="例如：运维专家"
                      aria-invalid={isTouchedInvalid(field.state.meta) || undefined}
                      autoComplete="off"
                    />
                    {isTouchedInvalid(field.state.meta) ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="code">
              {(field) => (
                <Field data-invalid={isTouchedInvalid(field.state.meta) || undefined}>
                  <FieldLabel htmlFor="role-code">唯一标识 Code</FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="role-code"
                      className="font-mono"
                      placeholder="例如：ops_expert"
                      aria-invalid={isTouchedInvalid(field.state.meta) || undefined}
                      autoComplete="off"
                      disabled={isEdit}
                      readOnly={isEdit}
                    />
                    {isEdit ? <FieldDescription>创建后不可修改。</FieldDescription> : null}
                    {isTouchedInvalid(field.state.meta) ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="icon">
              {(field) => (
                <Field data-invalid={isTouchedInvalid(field.state.meta) || undefined}>
                  <FieldLabel htmlFor="role-icon">角色图标</FieldLabel>
                  <FieldContent>
                    <RoleIconPicker
                      id="role-icon"
                      value={field.state.value}
                      color={iconColor}
                      onValueChange={field.handleChange}
                      aria-invalid={isTouchedInvalid(field.state.meta) || undefined}
                    />
                    {isTouchedInvalid(field.state.meta) ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="iconColor">
              {(field) => (
                <Field data-invalid={isTouchedInvalid(field.state.meta) || undefined}>
                  <FieldLabel htmlFor="role-icon-color">图标颜色</FieldLabel>
                  <FieldContent>
                    <RoleIconColorPicker
                      id="role-icon-color"
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      aria-invalid={isTouchedInvalid(field.state.meta) || undefined}
                    />
                    {isTouchedInvalid(field.state.meta) ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="expiresAt">
              {(field) => (
                <Field data-invalid={isTouchedInvalid(field.state.meta) || undefined}>
                  <FieldLabel htmlFor="role-expired-at">过期时间</FieldLabel>
                  <FieldContent>
                    <Popover open={expiredAtOpen} onOpenChange={setExpiredAtOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="role-expired-at"
                          type="button"
                          variant="outline"
                          data-empty={!field.state.value}
                          aria-invalid={isTouchedInvalid(field.state.meta) || undefined}
                          className="w-full justify-between font-normal data-[empty=true]:text-muted-foreground"
                        >
                          {field.state.value
                            ? EXPIRED_AT_FORMATTER.format(field.state.value)
                            : '留空表示长期有效'}
                          <CalendarIcon data-icon="inline-end" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.state.value ?? undefined}
                          onSelect={(date) => {
                            field.handleChange(date ?? null)
                            setExpiredAtOpen(false)
                          }}
                          captionLayout="dropdown"
                          startMonth={TODAY}
                          disabled={{ before: TODAY }}
                          defaultMonth={field.state.value ?? TODAY}
                          autoFocus
                        />
                        {field.state.value ? (
                          <div className="border-t p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                field.handleChange(null)
                                setExpiredAtOpen(false)
                              }}
                            >
                              清除（长期有效）
                            </Button>
                          </div>
                        ) : null}
                      </PopoverContent>
                    </Popover>
                    {isTouchedInvalid(field.state.meta) ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <Field data-invalid={isTouchedInvalid(field.state.meta) || undefined}>
                  <FieldLabel htmlFor="role-description">角色描述说明</FieldLabel>
                  <FieldContent>
                    <Textarea
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="role-description"
                      rows={3}
                      placeholder="明确该角色的职责"
                      aria-invalid={isTouchedInvalid(field.state.meta) || undefined}
                    />
                    {isTouchedInvalid(field.state.meta) ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="submit" form="role-action-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
