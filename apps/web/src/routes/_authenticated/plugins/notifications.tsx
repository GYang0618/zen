/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createFileRoute } from '@tanstack/react-router'
import { NotificationsPage } from '@zen/plugin-notifications/web'
import { PLUGIN_WEB_ROUTES } from '@zen/plugin-registry/web'
import { Bell } from 'lucide-react'

import { RoutePending } from '@/components/route-pending'
import { PluginPageShell } from '@/features/plugins/plugin-page-shell'
import { requireActivePlugin } from '@/lib/plugins/require-active-plugin'

const pluginRoute = PLUGIN_WEB_ROUTES.find((item) => item.path === '/plugins/notifications')
if (!pluginRoute) {
  throw new Error('Missing plugin web route metadata: /plugins/notifications')
}

export const Route = createFileRoute('/_authenticated/plugins/notifications')({
  beforeLoad: () => requireActivePlugin(pluginRoute.pluginId),
  pendingComponent: RoutePending,
  component: function PluginRoutePage() {
    return <PluginPageShell page={NotificationsPage} />
  },
  staticData: {
    title: pluginRoute.title,
    icon: Bell,
    order: pluginRoute.order,
    permissions: [...pluginRoute.permissions],
    pluginId: pluginRoute.pluginId
  }
})
