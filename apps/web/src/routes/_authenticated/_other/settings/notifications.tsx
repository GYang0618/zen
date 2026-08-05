import { createFileRoute } from '@tanstack/react-router'
import { Bell } from 'lucide-react'

import { NotificationsPage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/notifications')({
  component: NotificationsPage,
  staticData: {
    title: '通知与消息',
    description: '配置您希望接收系统消息的推送渠道与提醒方式。',
    icon: Bell,
    order: 50
  }
})
