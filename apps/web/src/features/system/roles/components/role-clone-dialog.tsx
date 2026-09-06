import { useForm } from '@tanstack/react-form'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
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
import { CalendarIcon, Copy, Info, Loader2, ShieldCheck, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { useCloneRoleMutation } from '@/features/system/roles/mutations'

import type { Role } from '@zen/shared'

interface RoleCloneDialogProps {
  currentRow: Role
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

const cloneFormSchema = z.object({
  name: z.string().trim().min(1, '角色名称不能为空').max(50, '角色名称不能超过50个字符'),
  code: z
    .string()
    .trim()
    .min(2, '角色编码至少需要2个字符')
    .max(50, '角色编码不能超过50个字符')
    .regex(/^[a-z][a-z0-9_]*$/, '角色编码仅支持小写字母、数字和下划线，且以字母开头'),
  description: z.string().trim().max(200, '角色描述不能超过200个字符'),
  expiresAt: z.date().nullable()
})

type CloneFormValues = z.infer<typeof cloneFormSchema>

function formatExpiredAt(date: Date | null): string | null {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function suggestCloneCode(sourceCode: string): string {
  return `${sourceCode
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')}_copy`
}

function buildDefaultValues(source: Role): CloneFormValues {
  return {
    name: `${source.name} 副本`,
    code: suggestCloneCode(source.code),
    description: source.description ?? '',
    expiresAt: null
  }
}

export function RoleCloneDialog({ currentRow, open, onOpenChange }: RoleCloneDialogProps) {
  const [expiredAtOpen, setExpiredAtOpen] = useState(false)
  const { mutate: cloneRole, isPending } = useCloneRoleMutation()

  const form = useForm({
    defaultValues: buildDefaultValues(currentRow) as CloneFormValues,
    validators: { onChange: cloneFormSchema },
    onSubmit: async ({ value }) => {
      await handleSubmit(cloneFormSchema.parse(value))
    }
  })

  useEffect(() => {
    if (!open) return
    form.reset(buildDefaultValues(currentRow))
    setExpiredAtOpen(false)
  }, [open, currentRow, form])

  const handleSubmit = (values: CloneFormValues) => {
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

    cloneRole(
      {
        id: currentRow.id,
        data: {
          name: values.name.trim(),
          code: values.code.trim(),
          description: values.description.trim() || undefined,
          expiresAt: formatExpiredAt(values.expiresAt)
        }
      },
      {
        onSuccess: (cloned) => {
          toast.success(`已基于「${currentRow.name}」克隆出新角色「${cloned.name}」`)
          onOpenChange(false)
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : '克隆失败'
          if (message.includes('编码') || message.includes('已存在')) {
            form.setFieldMeta('code', (meta) => ({
              ...meta,
              errorMap: {
                ...meta.errorMap,
                onSubmit: [{ code: 'custom', path: [], message: '角色编码已存在' }]
              }
            }))
            return
          }
          toast.error(message)
        }
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Copy className="size-5" /> 克隆角色权限配置
            </span>
          </DialogTitle>
          <DialogDescription>
            基于「{currentRow.name}」创建一个新角色，可在保存前调整名称与编码。
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info />
          <AlertTitle className="flex items-center gap-2">
            将复制以下配置
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3" />
              {currentRow.permissionCount} 项权限
            </Badge>
          </AlertTitle>
          <AlertDescription className="flex items-center gap-1.5">
            <UserX className="size-3.5" /> 不包含该角色当前关联的成员，克隆后需重新分配。
          </AlertDescription>
        </Alert>

        <form
          id="role-clone-form"
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
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-name">新角色名称</FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="clone-role-name"
                      placeholder="例如：运维专家 副本"
                      aria-invalid={!field.state.meta.isValid}
                      autoComplete="off"
                      autoFocus
                    />
                    {!field.state.meta.isValid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="code">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-code">唯一标识 Code</FieldLabel>
                  <FieldContent>
                    <Input
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="clone-role-code"
                      className="font-mono"
                      placeholder="例如：ops_expert_copy"
                      aria-invalid={!field.state.meta.isValid}
                      autoComplete="off"
                    />
                    <FieldDescription>已根据来源角色自动生成，可自行修改。</FieldDescription>
                    {!field.state.meta.isValid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="expiresAt">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-expired-at">过期时间</FieldLabel>
                  <FieldContent>
                    <Popover open={expiredAtOpen} onOpenChange={setExpiredAtOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="clone-role-expired-at"
                          type="button"
                          variant="outline"
                          data-empty={!field.state.value}
                          aria-invalid={!field.state.meta.isValid}
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
                    {!field.state.meta.isValid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel htmlFor="clone-role-description">角色描述说明</FieldLabel>
                  <FieldContent>
                    <Textarea
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      id="clone-role-description"
                      rows={3}
                      placeholder="明确该角色的职责"
                      aria-invalid={!field.state.meta.isValid}
                    />
                    {!field.state.meta.isValid ? (
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
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="submit" form="role-clone-form" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Copy />}
            克隆
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
