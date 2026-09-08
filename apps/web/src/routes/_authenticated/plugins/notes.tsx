/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
import { createFileRoute } from '@tanstack/react-router'
import { NotesPage } from '@zen/plugin-demo-notes/web'
import { PLUGIN_WEB_ROUTES } from '@zen/plugin-registry/web'
import { StickyNote } from 'lucide-react'

import { RoutePending } from '@/components/route-pending'
import { PluginPageShell } from '@/features/plugins/plugin-page-shell'
import { requireActivePlugin } from '@/lib/plugins/require-active-plugin'

const pluginRoute = PLUGIN_WEB_ROUTES.find((item) => item.path === '/plugins/notes')
if (!pluginRoute) {
  throw new Error('Missing plugin web route metadata: /plugins/notes')
}

export const Route = createFileRoute('/_authenticated/plugins/notes')({
  beforeLoad: () => requireActivePlugin(pluginRoute.pluginId),
  pendingComponent: RoutePending,
  component: function PluginRoutePage() {
    return <PluginPageShell page={NotesPage} />
  },
  staticData: {
    title: pluginRoute.title,
    icon: StickyNote,
    order: pluginRoute.order,
    permissions: [...pluginRoute.permissions],
    pluginId: pluginRoute.pluginId
  }
})
