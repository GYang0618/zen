import { createFileRoute } from '@tanstack/react-router'
import { UserRoundCog } from 'lucide-react'

import { SettingsProfile } from '@/features/settings-v2/profile'

export const Route = createFileRoute('/_authenticated/_other/settings/profile')({
  component: SettingsProfile,
  staticData: {
    title: '个人资料',
    description: '管理您的个人身份标识、展示名称、头像及公开联系方式。',
    icon: UserRoundCog,
    order: 10
  }
})
