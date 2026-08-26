import { createFileRoute } from '@tanstack/react-router'
import { Wrench } from 'lucide-react'

import { SettingsAccount } from '@/features/settings-v2/account'

export const Route = createFileRoute('/_authenticated/_other/settings/account')({
  component: SettingsAccount,
  staticData: {
    title: '账户',
    description: '更新您的登录密码凭证、双重身份验证 (2FA / MFA) 与账号认证配置。',
    icon: Wrench,
    order: 20
  }
})
