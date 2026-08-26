import { createFileRoute } from '@tanstack/react-router'
import { Palette } from 'lucide-react'

import { SettingsAppearance } from '@/features/settings-v2/appearance'

export const Route = createFileRoute('/_authenticated/_other/settings/appearance')({
  component: SettingsAppearance,
  staticData: {
    title: '外观界面',
    description: '自定义主题模式、配色、字体、样式、侧边栏形态与界面布局。',
    icon: Palette,
    order: 30
  }
})
