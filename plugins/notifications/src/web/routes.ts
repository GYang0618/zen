/** 路由贡献由宿主 apps/web 薄封装挂载；此文件供 Manifest 声明入口 */
export const NOTIFICATIONS_ROUTE_PATH = '/notifications'
export const NOTIFICATIONS_ROUTE_META = {
  title: '通知中心',
  icon: 'bell',
  group: '能力',
  order: 110,
  permissions: ['notif:message:list'],
  pluginId: 'notifications'
} as const
