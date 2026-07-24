import { createFileRoute, redirect } from '@tanstack/react-router'
import { StickyNote } from 'lucide-react'

import { DemoNotesPage } from '@/features/demo/notes'
import { fetchActivePluginIds } from '@/features/system/plugins/api'

export const Route = createFileRoute('/_authenticated/plugins/notes')({
  beforeLoad: async () => {
    const ids = await fetchActivePluginIds()
    if (!ids.includes('demo-notes')) {
      throw redirect({ to: '/errors/403', replace: true })
    }
  },
  component: DemoNotesPage,
  staticData: {
    title: '演示便签',
    icon: StickyNote,
    order: 100,
    permissions: ['demo:note:list'],
    pluginId: 'demo-notes'
  }
})
