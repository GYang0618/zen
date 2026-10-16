import { Link, useNavigate } from '@tanstack/react-router'
import { changePasswordSchema } from '@zen/shared'
import {
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
  toast
} from '@zen/ui'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { PasswordInput } from '@/components'
import { useAuthStore } from '@/stores'

import { authApi } from './api'
import { AuthBrand } from './auth-brand'
import { useSignOutMutation } from './mutations'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)
  const clearMustChangePassword = useAuthStore((state) => state.clearMustChangePassword)
  const { mutate: signOut, isPending: isSigningOut } = useSignOutMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <div className="w-sm flex flex-col gap-4">
      <AuthBrand />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">修改密码</CardTitle>
          <CardDescription>
            {mustChangePassword
              ? '首次登录或管理员重置后，需要先设置新密码才能进入首页。'
              : '更新登录密码'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              if (!mustChangePassword && !currentPassword) {
                toast.add({ title: '请提供当前密码', type: 'error' })
                return
              }

              const parsed = changePasswordSchema.safeParse(
                mustChangePassword ? { newPassword } : { currentPassword, newPassword }
              )
              if (!parsed.success) {
                toast.add({
                  title: parsed.error.issues[0]?.message ?? '密码不符合要求',
                  type: 'error'
                })
                return
              }

              setPending(true)
              try {
                await authApi.changePassword(parsed.data)
                clearMustChangePassword()
                toast.add({ title: '密码已更新', type: 'success' })
                navigate({ to: '/', replace: true })
              } catch (error) {
                toast.add({
                  title: error instanceof Error ? error.message : '修改失败',
                  type: 'error'
                })
              } finally {
                setPending(false)
              }
            }}
          >
            <FieldGroup>
              {!mustChangePassword ? (
                <Field>
                  <FieldLabel htmlFor="current">当前密码</FieldLabel>
                  <PasswordInput
                    id="current"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="next">新密码</FieldLabel>
                <PasswordInput
                  id="next"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                />
                <FieldDescription>至少 8 位，须包含大小写字母、数字与特殊字符。</FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={pending || isSigningOut || !newPassword}>
                  {pending ? <Loader2 className="animate-spin" /> : null}
                  确认修改
                </Button>
              </Field>
              {mustChangePassword ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-muted-foreground"
                    disabled={pending || isSigningOut}
                    onClick={() => {
                      signOut(undefined, {
                        onSettled: () => {
                          navigate({ to: '/sign-in', replace: true })
                        }
                      })
                    }}
                  >
                    退出登录
                  </Button>
                </div>
              ) : (
                <FieldDescription className="text-center">
                  <Link to="/">返回首页</Link>
                </FieldDescription>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
