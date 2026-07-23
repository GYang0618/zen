import { createFileRoute, redirect } from '@tanstack/react-router'

import { NotificationsFeaturePage } from '@/features/plugins/notifications'
import { fetchActivePluginIds } from '@/features/system/plugins/api'

export const Route = createFileRoute('/_authenticated/plugins/notifications')({
  beforeLoad: async () => {
    const ids = await fetchActivePluginIds()
    if (!ids.includes('notifications')) {
      throw redirect({ to: '/errors/403', replace: true })
    }
  },
  component: NotificationsFeaturePage,
  staticData: {
    title: '站内通知',
    icon: 'message-circle-more',
    group: '能力插件',
    order: 110,
    permissions: ['notif:message:list'],
    pluginId: 'notifications'
  }
})
