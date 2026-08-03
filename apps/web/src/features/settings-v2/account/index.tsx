import { Separator } from '@zen/ui'

import { AppPageHeader } from '@/components/layouts/app-page-header'

export function SettingsAccount() {
  return (
    <>
      <AppPageHeader
        title="账户"
        description="更新您的登录密码凭证、双重身份验证 (2FA / MFA) 与账号认证配置。"
      />
      <Separator className="my-4 flex-none" />
      <div>Account</div>
    </>
  )
}
