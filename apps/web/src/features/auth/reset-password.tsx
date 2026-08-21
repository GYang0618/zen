import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { userPasswordSchema } from '@zen/shared'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  Input
} from '@zen/ui'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { authApi } from '@/features/auth/api'
import { isMockInviteToken } from '@/features/auth/user-invite'

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/reset-password' })
  const [token, setToken] = useState(search.token ?? '')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const hasTokenInUrl = Boolean(search.token)
  const isInviteMock = isMockInviteToken(token.trim())

  return (
    <form
      className="p-6 md:p-8"
      onSubmit={async (event) => {
        event.preventDefault()
        const parsed = userPasswordSchema.safeParse(password)
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? '密码不符合要求')
          return
        }

        setPending(true)
        try {
          if (isInviteMock) {
            toast.success('模拟：密码已设置。接入邮箱后将写入服务器并取消首次登录改密。')
            navigate({ to: '/sign-in', replace: true })
            return
          }

          await authApi.resetPassword(token.trim(), password)
          toast.success('密码已设置，请重新登录')
          navigate({ to: '/sign-in', replace: true })
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '设置失败')
        } finally {
          setPending(false)
        }
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">{isInviteMock ? '设置登录密码' : '重置密码'}</h1>
          <p className="text-sm text-muted-foreground">
            {isInviteMock
              ? '通过邀请链接设置密码后可直接登录。若未完成，仍可使用临时密码首次登录后再改。'
              : '使用令牌设置新密码'}
          </p>
        </div>
        {isInviteMock ? (
          <Alert>
            <Mail className="size-4" />
            <AlertTitle>当前为模拟邀请</AlertTitle>
            <AlertDescription>
              提交不会写入服务器。接入邮件后，此页将调用重置密码接口，成功后清除「首次登录必须改密」。
            </AlertDescription>
          </Alert>
        ) : null}
        {hasTokenInUrl ? null : (
          <Field>
            <FieldLabel htmlFor="token">重置令牌</FieldLabel>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="password">新密码</FieldLabel>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        <Button type="submit" disabled={pending || !token.trim() || !password}>
          {isInviteMock ? '确认设置' : '确认重置'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/sign-in">返回登录</Link>
        </p>
      </FieldGroup>
    </form>
  )
}
