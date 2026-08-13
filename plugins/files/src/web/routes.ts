/** 路由贡献由宿主 apps/web 薄封装挂载；此文件供 Manifest 声明入口 */
export const FILES_ROUTE_PATH = '/plugins/files'
export const FILES_ROUTE_META = {
  title: '文件管理',
  icon: 'folder-kanban',
  group: '能力',
  order: 120,
  permissions: ['file:object:list'],
  pluginId: 'files'
} as const
