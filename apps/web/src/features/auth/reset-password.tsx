import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button, Field, FieldGroup, FieldLabel, Input } from '@zen/ui'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { authApi } from '@/features/auth/api'

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/(auth)/reset-password' })
  const [token, setToken] = useState(search.token ?? '')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <form
      className="p-6 md:p-8"
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        try {
          await authApi.resetPassword(token.trim(), password)
          toast.success('密码已重置，请重新登录')
          navigate({ to: '/sign-in', replace: true })
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '重置失败')
        } finally {
          setPending(false)
        }
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">重置密码</h1>
          <p className="text-sm text-muted-foreground">使用令牌设置新密码</p>
        </div>
        <Field>
          <FieldLabel htmlFor="token">重置令牌</FieldLabel>
          <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">新密码</FieldLabel>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={pending || !token.trim() || !password}>
          确认重置
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/sign-in">返回登录</Link>
        </p>
      </FieldGroup>
    </form>
  )
}
