import { Button, Label } from '@zen/ui'
import { useState } from 'react'
import { toast } from 'sonner'

import { PasswordInput } from '@/components'
import { authApi } from '@/features/auth/api'
import { MfaSection } from '@/features/settings/account/mfa-section'
import { SettingsPageHeader } from '@/features/settings/components/settings-page-header'
import { SettingsShell } from '@/features/settings/components/settings-shell'

export function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordPending, setPasswordPending] = useState(false)

  return (
    <SettingsShell>
      <SettingsPageHeader
        title="账号与安全"
        description="更新您的登录密码凭证、双重身份验证 (2FA / MFA) 与账号认证配置。"
      />

      <div className="space-y-8">
        <form
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault()
            setPasswordPending(true)
            try {
              await authApi.changePassword({ currentPassword, newPassword })
              toast.success('登录密码已更新')
              setCurrentPassword('')
              setNewPassword('')
            } catch (error) {
              toast.error(error instanceof Error ? error.message : '修改失败')
            } finally {
              setPasswordPending(false)
            }
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">当前旧密码</Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="输入您当前正在使用的登录密码"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">设置新密码</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="输入符合安全规范的新密码"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                密码长度需至少 8 位，须包含大小写字母与数字。
              </p>
            </div>
          </div>

          <Button type="submit" disabled={passwordPending || !newPassword || !currentPassword}>
            {passwordPending ? '更新中…' : '更新密码'}
          </Button>
        </form>

        <MfaSection />
      </div>
    </SettingsShell>
  )
}

