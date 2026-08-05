import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

import { AppearancePage } from '@/features/settings'

export const Route = createFileRoute('/_authenticated/_other/settings/appearance')({
  component: AppearancePage,
  staticData: {
    title: '外观界面',
    description: '自定义系统的视觉主题模式 (日间/夜间/跟随系统)、侧边栏形态及界面布局。',
    icon: Settings,
    order: 40
  }
})
