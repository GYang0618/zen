import { useNavigate } from '@tanstack/react-router'
import { Button, Field, FieldGroup, FieldLabel } from '@zen/ui'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfigDrawer, PasswordInput, ProfileDropdown, Search, ThemeSwitch } from '@/components'
import { Header, Main } from '@/components/layouts'
import { authApi } from '@/features/auth/api'
import { useAuthStore } from '@/stores'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)
  const clearMustChangePassword = useAuthStore((state) => state.clearMustChangePassword)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pending, setPending] = useState(false)

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className="flex flex-1 flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">修改密码</h2>
          <p className="text-muted-foreground">
            {mustChangePassword
              ? '管理员要求或密码已过期，请先修改密码后再继续使用'
              : '更新登录密码'}
          </p>
        </div>
        <form
          className="max-w-md space-y-4 rounded-lg border bg-card p-4"
          onSubmit={async (event) => {
            event.preventDefault()
            setPending(true)
            try {
              await authApi.changePassword({
                currentPassword: mustChangePassword ? undefined : currentPassword,
                newPassword
              })
              clearMustChangePassword()
              toast.success('密码已更新')
              navigate({ to: '/', replace: true })
            } catch (error) {
              toast.error(error instanceof Error ? error.message : '修改失败')
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
                required
              />
            </Field>
            <Button type="submit" disabled={pending || !newPassword}>
              保存
            </Button>
          </FieldGroup>
        </form>
      </Main>
    </>
  )
}
