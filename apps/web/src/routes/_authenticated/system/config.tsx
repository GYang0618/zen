import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

import { SiteConfigPage } from '@/features/system/config'

export const Route = createFileRoute('/_authenticated/system/config')({
  component: SiteConfigPage,
  staticData: {
    title: '站点配置',
    description: '维护站点名称、Logo 与全局 Feature Flag',
    icon: Settings,
    order: 80,
    permissions: ['system:config:list']
  }
})
