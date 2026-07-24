import { createFileRoute } from '@tanstack/react-router'
import { UserRoundCog } from 'lucide-react'

import { ProfilePage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/profile')({
  component: ProfilePage,
  staticData: {
    title: '个人资料',
    icon: UserRoundCog,
    order: 10
  }
})
