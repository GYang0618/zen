import { Link, useNavigate } from '@tanstack/react-router'
import { Button, Field, FieldGroup, FieldLabel, Input } from '@zen/ui'
import { useState } from 'react'
import { toast } from 'sonner'

import { authApi } from '@/features/auth/api'

export function ForgotPasswordForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <form
      className="p-6 md:p-8"
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        try {
          const result = await authApi.forgotPassword(email.trim())
          toast.success('若邮箱存在，重置指引已发出')
          if (result.resetToken) {
            navigate({
              to: '/reset-password',
              search: { token: result.resetToken },
              replace: true
            })
            return
          }
          navigate({ to: '/sign-in' })
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '请求失败')
        } finally {
          setPending(false)
        }
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">忘记密码</h1>
          <p className="text-sm text-muted-foreground">输入注册邮箱以获取重置令牌</p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">邮箱</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={pending || !email.trim()}>
          发送重置链接
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/sign-in">返回登录</Link>
        </p>
      </FieldGroup>
    </form>
  )
}
