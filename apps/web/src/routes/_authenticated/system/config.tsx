import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

import { SiteConfigPage } from '@/features/system/config'

export const Route = createFileRoute('/_authenticated/system/config')({
  component: SiteConfigPage,
  staticData: {
    title: '站点配置',
    icon: Settings,
    order: 80,
    permissions: ['system:config:list']
  }
})
