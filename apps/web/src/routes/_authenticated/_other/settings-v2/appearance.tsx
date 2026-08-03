import { createFileRoute } from '@tanstack/react-router'
import { Palette } from 'lucide-react'

import { SettingsAppearance } from '@/features/settings-v2/appearance'

export const Route = createFileRoute('/_authenticated/_other/settings-v2/appearance')({
  component: SettingsAppearance,
  staticData: {
    title: '外观界面',
    icon: Palette,
    order: 30
  }
})
