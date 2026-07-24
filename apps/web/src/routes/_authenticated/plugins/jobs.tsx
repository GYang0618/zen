import { createFileRoute, redirect } from '@tanstack/react-router'
import { Cuboid } from 'lucide-react'

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
    icon: Cuboid,
    order: 130,
    permissions: ['job:task:list'],
    pluginId: 'jobs'
  }
})
