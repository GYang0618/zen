import { createFileRoute } from '@tanstack/react-router'

import { SiteConfigPage } from '@/features/system/config'

export const Route = createFileRoute('/_authenticated/system/config')({
  component: SiteConfigPage,
  staticData: {
    title: '站点配置',
    icon: 'settings',
    group: '系统管理',
    order: 80,
    permissions: ['system:config:list']
  }
})
