/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createFileRoute } from '@tanstack/react-router'
import { NotificationsPage } from '@zen/plugin-notifications/web'
import { Bell } from 'lucide-react'

import { PluginPageShell } from '@/features/plugins/plugin-page-shell'
import { requireActivePlugin } from '@/lib/plugins/require-active-plugin'

export const Route = createFileRoute('/_authenticated/plugins/notifications')({
  beforeLoad: () => requireActivePlugin('notifications'),
  component: function PluginRoutePage() {
    return <PluginPageShell page={NotificationsPage} />
  },
  staticData: {
    title: '通知中心',
    icon: Bell,
    order: 110,
    permissions: ['notif:message:list'],
    pluginId: 'notifications'
  }
})
