/** 路由贡献由宿主 apps/web 薄封装挂载；此文件供 Manifest 声明入口 */
export const JOBS_ROUTE_PATH = '/jobs'
export const JOBS_ROUTE_META = {
  title: '任务中心',
  icon: 'list-checks',
  group: '能力',
  order: 130,
  permissions: ['job:task:list'],
  pluginId: 'jobs'
} as const
