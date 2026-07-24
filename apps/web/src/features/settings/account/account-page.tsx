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
      <SettingsPageHeader title="账户与安全" description="管理密码凭证与双重身份验证 (2FA)。" />

      <form
        className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs"
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
        <div className="max-w-xl space-y-4 p-6">
          <h3 className="text-base font-semibold">修改登录密码</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">当前旧密码</Label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">设置新密码</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="8 位以上，须包含大小写字母及数字"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end bg-muted/40 px-6 py-3.5">
          <Button type="submit" disabled={passwordPending || !newPassword || !currentPassword}>
            {passwordPending ? '更新中…' : '更新密码'}
          </Button>
        </div>
      </form>

      <MfaSection />
    </SettingsShell>
  )
}
