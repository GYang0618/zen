import { createFileRoute } from '@tanstack/react-router'
import { UserRoundCog } from 'lucide-react'

import { SettingsProfile } from '@/features/settings-v2/profile'

export const Route = createFileRoute('/_authenticated/_other/settings-v2/profile')({
  component: SettingsProfile,
  staticData: {
    title: '个人资料',
    icon: UserRoundCog,
    order: 10
  }
})
