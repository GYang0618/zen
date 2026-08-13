/** 路由贡献由宿主 apps/web 薄封装挂载；此文件供 Manifest 声明入口 */
export const DEMO_NOTES_ROUTE_PATH = '/plugins/notes'
export const DEMO_NOTES_ROUTE_META = {
  title: '演示便签',
  icon: 'sticky-note',
  group: '演示',
  order: 100,
  permissions: ['demo:note:list'],
  pluginId: 'demo-notes'
} as const
