import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { PasswordInput } from '@/components'

import { useChangePasswordMutation } from '../queries'

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const changePassword = useChangePasswordMutation()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      return
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        }
      }
    )
  }

  const isValid = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword

  return (
    <form onSubmit={handleSubmit}>
      <FieldSet>
        <FieldLegend>登录密码</FieldLegend>
        <FieldDescription>定期更新密码有助于保护账户安全。</FieldDescription>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="current-password">当前密码</FieldLabel>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              placeholder="输入当前登录密码"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="new-password">新密码</FieldLabel>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              placeholder="设置符合安全规范的新密码"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <FieldDescription>至少 8 位，须包含大小写字母、数字与特殊字符。</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">确认新密码</FieldLabel>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && newPassword !== confirmPassword ? (
              <p className="text-sm text-destructive">两次输入的密码不一致</p>
            ) : null}
          </Field>

          <Field orientation="horizontal">
            <Button type="submit" disabled={!isValid || changePassword.isPending}>
              {changePassword.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              更新密码
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  )
}
