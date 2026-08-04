import { createFileRoute } from '@tanstack/react-router'
import { UserRoundCog } from 'lucide-react'

import { ProfilePage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/profile')({
  component: ProfilePage,
  staticData: {
    title: '个人资料',
    description: '管理您的个人身份标识、展示名称、头像及公开联系方式。',
    icon: UserRoundCog,
    order: 10
  }
})
