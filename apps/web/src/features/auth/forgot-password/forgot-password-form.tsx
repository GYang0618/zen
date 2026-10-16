import { Link, useNavigate } from '@tanstack/react-router'
import { Button, Field, FieldDescription, FieldGroup, FieldLabel, Input, toast } from '@zen/ui'
import { useState } from 'react'

import { authApi } from '@/features/auth/api'

export function ForgotPasswordForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        try {
          const result = await authApi.forgotPassword(email.trim())
          toast.add({ title: '若邮箱存在，重置指引已发出', type: 'success' })
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
          toast.add({ title: error instanceof Error ? error.message : '请求失败', type: 'error' })
        } finally {
          setPending(false)
        }
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">邮箱</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={pending || !email.trim()}>
          继续
        </Button>
        <FieldDescription className="text-center">
          还没有账户？<Link to="/sign-up">注册</Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
