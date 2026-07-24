import { createFileRoute, redirect } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'

import { FilesFeaturePage } from '@/features/plugins/files'
import { fetchActivePluginIds } from '@/features/system/plugins/api'

export const Route = createFileRoute('/_authenticated/plugins/files')({
  beforeLoad: async () => {
    const ids = await fetchActivePluginIds()
    if (!ids.includes('files')) {
      throw redirect({ to: '/errors/403', replace: true })
    }
  },
  component: FilesFeaturePage,
  staticData: {
    title: '文件中心',
    icon: FolderKanban,
    order: 120,
    permissions: ['file:object:list'],
    pluginId: 'files'
  }
})
