import { createFileRoute } from '@tanstack/react-router'
import { Shield } from 'lucide-react'

import { AccountPage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/account')({
  component: AccountPage,
  staticData: {
    title: '账户与安全',
    description: '更新您的登录密码凭证、双重身份验证 (2FA / MFA) 与账号认证配置。',
    icon: Shield,
    order: 20
  }
})
