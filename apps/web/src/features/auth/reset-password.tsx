import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { userPasswordSchema } from '@zen/shared'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  toast
} from '@zen/ui'
import { Loader2, Mail } from 'lucide-react'
import { useState } from 'react'

import { PasswordInput } from '@/components'

import { authApi } from './api'
import { AuthBrand } from './auth-brand'
import { isMockInviteToken } from './user-invite'

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/reset-password' })
  const [token, setToken] = useState(search.token ?? '')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const hasTokenInUrl = Boolean(search.token)
  const isInviteMock = isMockInviteToken(token.trim())

  return (
    <div className="w-md flex flex-col gap-4">
      <AuthBrand />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {isInviteMock ? '设置登录密码' : '重置密码'}
          </CardTitle>
          <CardDescription>
            {isInviteMock
              ? '通过邀请链接设置密码后可直接登录。若未完成，仍可使用临时密码首次登录后再改。'
              : '请设置新的登录密码。完成后需要重新登录。'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              const parsed = userPasswordSchema.safeParse(password)
              if (!parsed.success) {
                toast.add({
                  title: parsed.error.issues[0]?.message ?? '密码不符合要求',
                  type: 'error'
                })
                return
              }

              setPending(true)
              try {
                if (isInviteMock) {
                  toast.add({
                    title: '模拟：密码已设置。接入邮箱后将写入服务器并取消首次登录改密。',
                    type: 'success'
                  })
                  navigate({ to: '/sign-in', replace: true })
                  return
                }

                await authApi.resetPassword(token.trim(), password)
                toast.add({ title: '密码已设置，请重新登录', type: 'success' })
                navigate({ to: '/sign-in', replace: true })
              } catch (error) {
                toast.add({
                  title: error instanceof Error ? error.message : '设置失败',
                  type: 'error'
                })
              } finally {
                setPending(false)
              }
            }}
          >
            <FieldGroup>
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
                  <Input
                    id="token"
                    value={token}
                    placeholder="粘贴重置令牌"
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="password">新密码</FieldLabel>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                />
                <FieldDescription>至少 8 位，须包含大小写字母、数字与特殊字符。</FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={pending || !token.trim() || !password}>
                  {pending ? <Loader2 className="animate-spin" /> : null}
                  {isInviteMock ? '确认设置' : '确认重置'}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                <Link to="/sign-in">返回登录</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
