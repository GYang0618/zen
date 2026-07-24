import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'

import { NotificationsPage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/notifications')({
  component: NotificationsPage,
  staticData: {
    title: '通知与消息',
    icon: Bell,
    order: 50
  }
})
