import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { PasswordInput } from '@/components'
import { isCurrentUserId, useAccessChangeFeedback } from '@/lib/auth/access-change'

import { useAdminResetPasswordMutation } from '../mutations'

import type { User } from '@zen/shared'

const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, '密码必须至少有8个字符')
      .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
      .regex(/[a-z]/, '密码必须包含至少一个小写字母')
      .regex(/\d/, '密码必须包含至少一个数字')
      .regex(/[\W_]/, '密码必须包含至少一个特殊字符'),
    confirmPassword: z.string().min(1, '请确认密码'),
    mustChangePassword: z.boolean()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword']
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

type UsersResetPasswordDialogProps = {
  currentRow: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersResetPasswordDialog({
  currentRow,
  open,
  onOpenChange
}: UsersResetPasswordDialogProps) {
  const { mutateAsync, isPending } = useAdminResetPasswordMutation()
  const notifyAccessChange = useAccessChangeFeedback()
  const isSelf = isCurrentUserId(currentRow.id)
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      mustChangePassword: true
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutateAsync({
      id: currentRow.id,
      password: values.password,
      mustChangePassword: values.mustChangePassword
    })
    notifyAccessChange(currentRow.id, '密码已重置', '密码已重置，请重新登录')
    onOpenChange(false)
    form.reset({ password: '', confirmPassword: '', mustChangePassword: true })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          form.reset({ password: '', confirmPassword: '', mustChangePassword: true })
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重置密码</DialogTitle>
          <DialogDescription>
            {isSelf ? '为当前账号设置新密码，保存后请重新登录。' : `为用户 ${currentRow.username} 设置新密码`}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="reset-password">新密码</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="reset-confirm">确认密码</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-confirm"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="mustChangePassword"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="must-change-password"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="must-change-password" className="font-normal">
                    下次登录必须修改密码
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              确认重置
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
