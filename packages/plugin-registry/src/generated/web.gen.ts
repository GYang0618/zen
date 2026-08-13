/* eslint-disable */
/**
 * 本文件由 `zen-plugin generate` 自动生成，请勿手工编辑。
 */
export interface PluginWebRouteLoader {
  pluginId: string
  routeId: string
  path: string
  title: string
  icon: string
  order: number
  permissions: readonly string[]
  packageName: string
  componentExport: string
}

export const PLUGIN_WEB_ROUTES = [
  {
    pluginId: 'demo-notes' as const,
    routeId: 'demo-notes-home' as const,
    path: '/plugins/notes' as const,
    title: "演示便签",
    icon: 'sticky-note' as const,
    order: 100,
    permissions: ["demo:note:list"] as readonly string[],
    packageName: '@zen/plugin-demo-notes' as const,
    componentExport: 'NotesPage' as const
  },
  {
    pluginId: 'files' as const,
    routeId: 'files-home' as const,
    path: '/plugins/files' as const,
    title: "文件管理",
    icon: 'folder-kanban' as const,
    order: 120,
    permissions: ["file:object:list"] as readonly string[],
    packageName: '@zen/plugin-files' as const,
    componentExport: 'FilesPage' as const
  },
  {
    pluginId: 'jobs' as const,
    routeId: 'jobs-home' as const,
    path: '/plugins/jobs' as const,
    title: "任务中心",
    icon: 'list-todo' as const,
    order: 130,
    permissions: ["job:task:list"] as readonly string[],
    packageName: '@zen/plugin-jobs' as const,
    componentExport: 'JobsPage' as const
  },
  {
    pluginId: 'notifications' as const,
    routeId: 'notifications-home' as const,
    path: '/plugins/notifications' as const,
    title: "通知中心",
    icon: 'bell' as const,
    order: 110,
    permissions: ["notif:message:list"] as readonly string[],
    packageName: '@zen/plugin-notifications' as const,
    componentExport: 'NotificationsPage' as const
  }
] as const satisfies readonly PluginWebRouteLoader[]

