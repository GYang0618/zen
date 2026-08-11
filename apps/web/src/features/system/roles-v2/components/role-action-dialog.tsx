import { zodResolver } from '@hookform/resolvers/zod'
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
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ROLE_ICON_COLOR_VALUES, ROLE_ICONS } from '../data/data'
import { useRoles } from '../roles-provider'
import { RoleIconColorPicker } from './role-icon-color-picker'
import { RoleIconPicker } from './role-icon-picker'

import type { RoleIconName } from '../data/data'
import type { Role, RoleIconColor } from '../type'

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
  icon: z.enum(ROLE_ICONS).nullable(),
  iconColor: z.enum(ROLE_ICON_COLOR_VALUES).nullable(),
  description: z.string().trim().max(200, '角色描述不能超过200个字符'),
  expiredAt: z.date().nullable()
})

const editRoleFormSchema = roleFormSchema.extend({
  code: z.string().min(1, '角色编码不能为空')
})

type RoleFormValues = z.infer<typeof roleFormSchema>

const defaultValues: RoleFormValues = {
  name: '',
  code: '',
  icon: null,
  iconColor: null,
  description: '',
  expiredAt: null
}

function formatExpiredAt(date: Date | null): string | null {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseExpiredAt(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toFormIcon(icon: Role['icon']): RoleIconName | null {
  if (!icon) return null
  return (ROLE_ICONS as readonly string[]).includes(icon) ? (icon as RoleIconName) : null
}

function toFormIconColor(iconColor: Role['iconColor']): RoleIconColor | null {
  if (!iconColor) return null
  return (ROLE_ICON_COLOR_VALUES as readonly string[]).includes(iconColor)
    ? iconColor
    : null
}

export function RoleActionDialog({ currentRow, open, onOpenChange }: RoleActionDialogProps) {
  const { addRole, updateRole, hasRoleCode } = useRoles()
  const isEdit = !!currentRow
  const [expiredAtOpen, setExpiredAtOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(isEdit ? editRoleFormSchema : roleFormSchema),
    defaultValues
  })
  const iconColor = useWatch({ control: form.control, name: 'iconColor' })

  useEffect(() => {
    if (!open) return

    if (currentRow) {
      form.reset({
        name: currentRow.name,
        code: currentRow.code,
        icon: toFormIcon(currentRow.icon),
        iconColor: toFormIconColor(currentRow.iconColor),
        description: currentRow.description,
        expiredAt: parseExpiredAt(currentRow.expiredAt)
      })
    } else {
      form.reset(defaultValues)
    }

    setExpiredAtOpen(false)
    setIsSubmitting(false)
  }, [open, currentRow, form])

  const handleCreateSubmit = (values: RoleFormValues) => {
    const code = values.code.trim()
    if (hasRoleCode(code)) {
      form.setError('code', { message: '角色编码已存在' })
      return
    }

    if (values.expiredAt && values.expiredAt < TODAY) {
      form.setError('expiredAt', { message: '过期时间不能早于今天' })
      return
    }

    setIsSubmitting(true)
    try {
      const created = addRole({
        name: values.name.trim(),
        code,
        icon: values.icon,
        iconColor: values.iconColor,
        description: values.description.trim(),
        expiredAt: formatExpiredAt(values.expiredAt)
      })
      toast.success(`成功新建角色「${created.name}」`)
      onOpenChange(false)
      form.reset(defaultValues)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = (values: RoleFormValues) => {
    if (!currentRow) return

    if (values.expiredAt && values.expiredAt < TODAY) {
      const original = parseExpiredAt(currentRow.expiredAt)
      const isSameDay = original !== null && values.expiredAt.getTime() === original.getTime()
      if (!isSameDay) {
        form.setError('expiredAt', { message: '过期时间不能早于今天' })
        return
      }
    }

    setIsSubmitting(true)
    try {
      const updated = updateRole(currentRow.id, {
        name: values.name.trim(),
        icon: values.icon,
        iconColor: values.iconColor,
        description: values.description.trim(),
        expiredAt: formatExpiredAt(values.expiredAt)
      })
      toast.success(`已更新角色「${updated?.name ?? values.name.trim()}」`)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
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
              <UserShield className="size-5" /> 角色
            </span>
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '在此更新角色、有效期等信息。' : '在此创建新角色、有效期、权限等信息。'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="role-action-form"
          className="space-y-4"
          onSubmit={form.handleSubmit(isEdit ? handleUpdateSubmit : handleCreateSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-name">角色名称</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="role-name"
                      placeholder="例如：运维专家"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-code">唯一标识 Code</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="role-code"
                      className="font-mono"
                      placeholder="例如：ops_expert"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      disabled={isEdit}
                      readOnly={isEdit}
                    />
                    {isEdit ? <FieldDescription>创建后不可修改。</FieldDescription> : null}
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="icon"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-icon">角色图标</FieldLabel>
                  <FieldContent>
                    <RoleIconPicker
                      id="role-icon"
                      value={field.value}
                      color={iconColor}
                      onValueChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>可选。为角色选择一个标识图标。</FieldDescription>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="iconColor"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-icon-color">图标颜色</FieldLabel>
                  <FieldContent>
                    <RoleIconColorPicker
                      id="role-icon-color"
                      value={field.value}
                      onValueChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>可选。点选可切换，再点一次可清除。</FieldDescription>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="expiredAt"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-expired-at">过期时间</FieldLabel>
                  <FieldContent>
                    <Popover open={expiredAtOpen} onOpenChange={setExpiredAtOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="role-expired-at"
                          type="button"
                          variant="outline"
                          data-empty={!field.value}
                          aria-invalid={fieldState.invalid}
                          className="w-full justify-between font-normal data-[empty=true]:text-muted-foreground"
                        >
                          {field.value
                            ? EXPIRED_AT_FORMATTER.format(field.value)
                            : '留空表示长期有效'}
                          <CalendarIcon data-icon="inline-end" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={(date) => {
                            field.onChange(date ?? null)
                            setExpiredAtOpen(false)
                          }}
                          captionLayout="dropdown"
                          startMonth={TODAY}
                          disabled={{ before: TODAY }}
                          defaultMonth={field.value ?? TODAY}
                          autoFocus
                        />
                        {field.value ? (
                          <div className="border-t p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                field.onChange(null)
                                setExpiredAtOpen(false)
                              }}
                            >
                              清除（长期有效）
                            </Button>
                          </div>
                        ) : null}
                      </PopoverContent>
                    </Popover>
                    <FieldDescription>可选。到达该日期后角色将自动过期。</FieldDescription>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-description">角色描述说明</FieldLabel>
                  <FieldContent>
                    <Textarea
                      {...field}
                      id="role-description"
                      rows={3}
                      placeholder="明确该角色的职责"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </FieldContent>
                </Field>
              )}
            />
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
