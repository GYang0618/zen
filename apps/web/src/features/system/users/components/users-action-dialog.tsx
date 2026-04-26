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
  Input
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { PasswordInput } from '@/components'

import { useCreateUserMutation, useUpdateUserMutation } from '../mutations'

import type { User } from '../data/schema'

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

const userFormSchema = z
  .object({
    username: z.string().trim().min(3, '用户名至少需要3个字符').max(30, '用户名不能超过30个字符'),
    email: z.email('无效的邮箱格式'),
    nickname: z.string().trim().max(50, '昵称不能超过50个字符').optional(),
    phoneNumber: z.string().trim().max(20, '手机号码不能超过20个字符').optional(),
    password: z
      .string()
      .min(8, '密码必须至少有8个字符')
      .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
      .regex(/[a-z]/, '密码必须包含至少一个小写字母')
      .regex(/\d/, '密码必须包含至少一个数字')
      .regex(/[\W_]/, '密码必须包含至少一个特殊字符')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional()
  })
  .superRefine((data, ctx) => {
    const hasPassword = !!data.password
    const hasConfirm = !!data.confirmPassword

    if (hasPassword && !hasConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请确认密码',
        path: ['confirmPassword']
      })
      return
    }

    if ((hasPassword || hasConfirm) && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '两次输入的密码不一致',
        path: ['confirmPassword']
      })
    }
  })

type UserFormValues = z.infer<typeof userFormSchema>

const toOptionalString = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: UserActionDialogProps) {
  const isEdit = !!currentRow
  const { mutate: createUser, isPending: isCreating, error: createError } = useCreateUserMutation()
  const { mutate: updateUser, isPending: isUpdating, error: updateError } = useUpdateUserMutation()
  const isPending = isCreating || isUpdating
  const actionError = isEdit ? updateError : createError

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      email: '',
      nickname: '',
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    }
  })

  useEffect(() => {
    if (!isEdit || !currentRow) {
      form.reset({
        username: '',
        email: '',
        nickname: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
      })
      return
    }

    form.reset({
      username: currentRow.username,
      email: currentRow.email,
      nickname: currentRow.nickname ?? '',
      phoneNumber: currentRow.phoneNumber ?? '',
      password: '',
      confirmPassword: ''
    })
  }, [isEdit, currentRow, form])

  const handleCreateSubmit = (values: UserFormValues) => {
    const password = toOptionalString(values.password)
    if (!password) {
      form.setError('password', { message: '请输入密码' })
      return
    }

    createUser(
      {
        username: values.username.trim(),
        email: values.email.trim(),
        nickname: toOptionalString(values.nickname),
        phoneNumber: toOptionalString(values.phoneNumber),
        password
      },
      {
        onSuccess: () => {
          toast.success('用户创建成功')
          onOpenChange(false)
          form.reset()
        }
      }
    )
  }

  const handleUpdateSubmit = (values: UserFormValues) => {
    if (!currentRow) return

    updateUser(
      {
        id: currentRow.id,
        data: {
          username: values.username.trim(),
          email: values.email.trim(),
          nickname: toOptionalString(values.nickname),
          phoneNumber: toOptionalString(values.phoneNumber),
          password: toOptionalString(values.password)
        }
      },
      {
        onSuccess: () => {
          toast.success('用户更新成功')
          onOpenChange(false)
        }
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        onOpenChange(state)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>用户</DialogTitle>
          <DialogDescription>
            {isEdit ? '在此更新用户信息。' : '在此创建新用户。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>

        <div className="h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
          <form
            id="user-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(isEdit ? handleUpdateSubmit : handleCreateSubmit)}
          >
            <FieldGroup>
              {actionError?.message ? (
                <FieldError errors={[{ message: actionError.message }]} />
              ) : null}

              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="user-username" className="w-28 shrink-0">
                      用户名
                    </FieldLabel>
                    <FieldContent>
                      <Input {...field} id="user-username" placeholder="请输入用户名" />
                      {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="user-email" className="w-28 shrink-0">
                      邮箱
                    </FieldLabel>
                    <FieldContent>
                      <Input {...field} id="user-email" placeholder="请输入邮箱" />
                      {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="nickname"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="user-nickname" className="w-28 shrink-0">
                      昵称
                    </FieldLabel>
                    <FieldContent>
                      <Input {...field} id="user-nickname" placeholder="请输入昵称（可选）" />
                      {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="phoneNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="user-phone" className="w-28 shrink-0">
                      手机号
                    </FieldLabel>
                    <FieldContent>
                      <Input {...field} id="user-phone" placeholder="请输入手机号（可选）" />
                      {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="user-password" className="w-28 shrink-0">
                      {isEdit ? '新密码（留空则不修改）' : '密码'}
                    </FieldLabel>
                    <FieldContent>
                      <PasswordInput
                        {...field}
                        id="user-password"
                        autoComplete="new-password"
                        placeholder={isEdit ? '如需修改密码请填写' : '请输入密码'}
                      />
                      {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="user-confirm-password" className="w-28 shrink-0">
                      确认密码
                    </FieldLabel>
                    <FieldContent>
                      <PasswordInput
                        {...field}
                        id="user-confirm-password"
                        autoComplete="new-password"
                        placeholder={isEdit ? '填写以确认新密码' : '请再次输入密码'}
                      />
                      {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <DialogFooter>
          <Button type="submit" form="user-form" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
