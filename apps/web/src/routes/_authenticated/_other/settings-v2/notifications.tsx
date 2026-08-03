import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'

import { SettingsNotifications } from '@/features/settings-v2/notifications'

export const Route = createFileRoute('/_authenticated/_other/settings-v2/notifications')({
  component: SettingsNotifications,
  staticData: {
    title: '通知与消息',
    icon: Bell,
    order: 40
  }
})
