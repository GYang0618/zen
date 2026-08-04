import { createFileRoute } from '@tanstack/react-router'
import { Palette } from 'lucide-react'

import { SettingsAppearance } from '@/features/settings-v2/appearance'

export const Route = createFileRoute('/_authenticated/_other/settings-v2/appearance')({
  component: SettingsAppearance,
  staticData: {
    title: '外观界面',
    description: '自定义系统的视觉主题模式 (日间/夜间/跟随系统)、侧边栏形态及界面布局。',
    icon: Palette,
    order: 30
  }
})
