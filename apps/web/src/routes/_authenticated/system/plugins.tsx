import { createFileRoute } from '@tanstack/react-router'

import { PluginsPage } from '@/features/system/plugins'

export const Route = createFileRoute('/_authenticated/system/plugins')({
  component: PluginsPage,
  staticData: {
    title: '插件管理',
    icon: 'puzzle',
    group: '系统管理',
    order: 70,
    permissions: ['system:plugin:list']
  }
})
