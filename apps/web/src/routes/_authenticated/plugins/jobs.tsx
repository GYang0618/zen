import { createFileRoute, redirect } from '@tanstack/react-router'

import { JobsFeaturePage } from '@/features/plugins/jobs'
import { fetchActivePluginIds } from '@/features/system/plugins/api'

export const Route = createFileRoute('/_authenticated/plugins/jobs')({
  beforeLoad: async () => {
    const ids = await fetchActivePluginIds()
    if (!ids.includes('jobs')) {
      throw redirect({ to: '/errors/403', replace: true })
    }
  },
  component: JobsFeaturePage,
  staticData: {
    title: '任务中心',
    icon: 'cuboid',
    group: '能力插件',
    order: 130,
    permissions: ['job:task:list'],
    pluginId: 'jobs'
  }
})
