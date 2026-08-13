import { redirect } from '@tanstack/react-router'

import { fetchActivePluginIds } from '@/features/system/plugins/api'

/** 插件路由 beforeLoad：未启用则 403 */
export async function requireActivePlugin(pluginId: string): Promise<void> {
  const ids = await fetchActivePluginIds()
  if (!ids.includes(pluginId)) {
    throw redirect({ to: '/errors/403', replace: true })
  }
}
